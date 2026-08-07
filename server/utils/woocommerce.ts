import type { CatalogCategory, CatalogProduct, ProductQuery, ProductSort } from '#shared/types/catalog'
import { basicAuthHeader, isSecure, normalizeBaseUrl, signOAuthUrl } from './woo-auth'

/**
 * Accès à WooCommerce en headless.
 *
 * Les identifiants ne quittent jamais le serveur : le navigateur parle à
 * /api/catalog/*, qui relaie. Tant que la boutique n'est pas configurée,
 * `isConfigured()` renvoie false et les routes servent le jeu de démonstration.
 */

interface WooImage { src: string, alt: string }
interface WooCategory {
  id: number
  slug: string
  name: string
  description: string
  count: number
  parent: number
  image?: WooImage | null
}
interface WooProduct {
  id: number
  slug: string
  name: string
  short_description: string
  description: string
  sku: string
  price: string
  regular_price: string
  on_sale: boolean
  stock_status: string
  images: WooImage[]
  categories: { slug: string, name: string }[]
  average_rating: string
  rating_count: number
  attributes: { name: string, options: string[] }[]
  featured: boolean
}

export function wooConfig() {
  const { wooBaseUrl, wooConsumerKey, wooConsumerSecret } = useRuntimeConfig()
  return {
    baseUrl: normalizeBaseUrl(wooBaseUrl ?? ''),
    key: wooConsumerKey,
    secret: wooConsumerSecret,
  }
}

export function isConfigured() {
  const { baseUrl, key, secret } = wooConfig()
  return Boolean(baseUrl && key && secret)
}

/** Appel authentifié à l'API REST v3. Renvoie le corps et le total paginé. */
async function wooFetch<T>(path: string, query: Record<string, unknown> = {}) {
  const { baseUrl, key, secret } = wooConfig()
  const url = `${baseUrl}/wp-json/wc/v3/${path}`

  // Les valeurs vides fausseraient la signature : on ne garde que le utile.
  const clean: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v as string | number | boolean
  }

  const response = isSecure(baseUrl)
    ? await $fetch.raw<T>(url, { query: clean, headers: { Authorization: basicAuthHeader(key, secret) } })
    : await $fetch.raw<T>(signOAuthUrl(url, clean, key, secret))

  return {
    data: response._data as T,
    total: Number(response.headers.get('x-wp-total') ?? 0),
  }
}

/* ---------- Transformateurs : WooCommerce → modèle du site ---------- */

function toCategory(raw: WooCategory, bySlugId: Map<number, string>): CatalogCategory {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    // WooCommerce renvoie du HTML : on ne garde que le texte.
    description: stripHtml(raw.description),
    image: raw.image?.src,
    count: raw.count,
    parent: raw.parent ? bySlugId.get(raw.parent) : undefined,
  }
}

function toProduct(raw: WooProduct): CatalogProduct {
  const price = Number(raw.price || 0)
  const regular = Number(raw.regular_price || 0)

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    excerpt: stripHtml(raw.short_description),
    description: stripHtml(raw.description),
    sku: raw.sku,
    price,
    regularPrice: raw.on_sale && regular > price ? regular : undefined,
    onSale: raw.on_sale,
    inStock: raw.stock_status === 'instock',
    stockLabel: raw.stock_status === 'instock' ? 'Livraison 24 h' : 'Non disponible',
    images: raw.images?.map(i => ({ src: i.src, alt: i.alt || raw.name })) ?? [],
    categories: raw.categories ?? [],
    rating: Number(raw.average_rating || 0),
    reviews: raw.rating_count ?? 0,
    attributes: (raw.attributes ?? []).map(a => ({ name: a.name, value: a.options.join(', ') })),
    badge: raw.on_sale ? 'Promo' : raw.featured ? 'N° 1 des ventes' : undefined,
  }
}

function stripHtml(html: string) {
  return (html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

/** Correspondance entre le tri de l'interface et les paramètres WooCommerce. */
function sortParams(sort: ProductSort = 'popularity') {
  switch (sort) {
    case 'price-asc': return { orderby: 'price', order: 'asc' }
    case 'price-desc': return { orderby: 'price', order: 'desc' }
    case 'newest': return { orderby: 'date', order: 'desc' }
    default: return { orderby: 'popularity', order: 'desc' }
  }
}

/* ---------- Résolution des catégories ---------- */

/**
 * WooCommerce filtre les produits par identifiant de catégorie, jamais par
 * slug : `?category=accessories` renvoie 0 résultat là où `?category=21` en
 * renvoie 3. On traduit donc le slug avant d'interroger.
 */
const categoryIds = new Map<string, { id: number, expiresAt: number }>()
const CATEGORY_TTL = 10 * 60 * 1000

async function resolveCategoryId(slug: string): Promise<number | null> {
  const cached = categoryIds.get(slug)
  if (cached && cached.expiresAt > Date.now()) return cached.id

  const { data } = await wooFetch<{ id: number, slug: string }[]>('products/categories', {
    slug,
    per_page: 1,
  })

  const id = data[0]?.id
  if (!id) return null

  categoryIds.set(slug, { id, expiresAt: Date.now() + CATEGORY_TTL })
  return id
}

/* ---------- Points d'entrée ---------- */

export async function fetchCategories(): Promise<CatalogCategory[]> {
  // `orderby` n'accepte que id, name, slug, count… : « menu_order » vaut un 400.
  const { data } = await wooFetch<WooCategory[]>('products/categories', {
    per_page: 100,
    hide_empty: false,
    orderby: 'name',
    order: 'asc',
  })

  const bySlugId = new Map(data.map(c => [c.id, c.slug]))
  const flat = data
    .filter(c => c.slug !== 'uncategorized')
    .map(c => toCategory(c, bySlugId))

  // Reconstruction de l'arborescence : WooCommerce ne renvoie qu'un id parent.
  const roots = flat.filter(c => !c.parent)
  for (const root of roots) {
    root.children = flat.filter(c => c.parent === root.slug)
  }
  return roots
}

export async function fetchProducts(query: ProductQuery = {}) {
  const { page = 1, perPage = 24 } = query

  let categoryId: number | null = null
  if (query.category) {
    categoryId = await resolveCategoryId(query.category)
    // Slug inconnu : inutile d'interroger, la rubrique n'existe pas.
    if (!categoryId) return { items: [], total: 0, page, perPage }
  }

  const { data, total } = await wooFetch<WooProduct[]>('products', {
    page,
    per_page: perPage,
    status: 'publish',
    ...(categoryId ? { category: categoryId } : {}),
    ...(query.search ? { search: query.search } : {}),
    ...(query.onSale ? { on_sale: true } : {}),
    ...(query.inStock ? { stock_status: 'instock' } : {}),
    ...(query.minPrice ? { min_price: query.minPrice } : {}),
    ...(query.maxPrice ? { max_price: query.maxPrice } : {}),
    ...sortParams(query.sort),
  })

  return { items: data.map(toProduct), total, page, perPage }
}

export async function fetchProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const { data } = await wooFetch<WooProduct[]>('products', { slug, per_page: 1 })
  return data[0] ? toProduct(data[0]) : null
}
