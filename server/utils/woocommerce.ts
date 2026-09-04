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
  type: string
  purchasable: boolean
  manage_stock: boolean
  stock_quantity: number | null
  cross_sell_ids: number[]
  upsell_ids: number[]
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

export function hasBaseUrl() {
  return Boolean(wooConfig().baseUrl)
}

/** Appel authentifié GET à l'API REST v3. Renvoie le corps et le total paginé. */
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

/** Écriture authentifiée (POST, PUT, DELETE) vers l'API REST v3. */
async function wooMutate<T>(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  query: Record<string, unknown> = {},
) {
  const { baseUrl, key, secret } = wooConfig()
  const url = `${baseUrl}/wp-json/wc/v3/${path}`

  const clean: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') clean[k] = v as string | number | boolean
  }

  const response = isSecure(baseUrl)
    ? await $fetch.raw<T>(url, {
        method,
        query: clean,
        body,
        headers: { Authorization: basicAuthHeader(key, secret) },
      })
    : await $fetch.raw<T>(signOAuthUrl(url, clean, key, secret, method), { method, body })

  return response._data as T
}

interface WooCustomer {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
}

interface WooApiError {
  code?: string
  message?: string
}

/** WordPress n'accepte pas le @ dans user_login : on dérive un identifiant sûr. */
export function usernameFromEmail(email: string, suffix = '') {
  const local = email.trim().toLowerCase().split('@')[0] ?? ''
  const sanitized = local.replace(/[^a-z0-9._-]/g, '').replace(/^\.+|\.+$/g, '')
  const base = (sanitized || 'client').slice(0, 50)
  return suffix ? `${base}${suffix}`.slice(0, 60) : base
}

function extractWooApiError(error: unknown): WooApiError | null {
  if (!error || typeof error !== 'object') return null
  const err = error as { data?: WooApiError, response?: { _data?: WooApiError } }
  if (err.data?.code) return err.data
  if (err.response?._data?.code) return err.response._data
  return null
}

/** Crée un client WooCommerce. Réessaie si le nom d'utilisateur est déjà pris. */
export async function createCustomer(payload: {
  email: string
  firstName: string
  lastName: string
  password: string
}) {
  const email = payload.email.trim().toLowerCase()
  const baseUsername = usernameFromEmail(email)

  for (let attempt = 0; attempt < 3; attempt++) {
    const username = attempt === 0
      ? baseUsername
      : usernameFromEmail(email, String(Math.floor(Math.random() * 9000 + 1000)))

    try {
      return await wooMutate<WooCustomer>('POST', 'customers', {
        email,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        username,
        password: payload.password,
      })
    }
    catch (error: unknown) {
      const woo = extractWooApiError(error)
      if (woo?.code === 'registration-error-username-exists' && attempt < 2) continue
      throw error
    }
  }

  throw new Error('Impossible de créer le client')
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
    variable: raw.type === 'variable',
    purchasable: raw.purchasable !== false,
    // `stock_quantity` n'a de sens que si la boutique gère les stocks.
    stockQuantity: raw.manage_stock && raw.stock_quantity != null ? raw.stock_quantity : undefined,
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

/**
 * Produits par identifiants, pour le panier.
 *
 * WooCommerce plafonne `per_page` à 100 : au-delà, on découpe. L'ordre de la
 * réponse n'est pas garanti, l'appelant travaille donc par identifiant.
 */
export async function fetchProductsByIds(ids: number[]): Promise<CatalogProduct[]> {
  const unique = [...new Set(ids)].filter(id => Number.isInteger(id) && id > 0)
  if (!unique.length) return []

  const batches: number[][] = []
  for (let i = 0; i < unique.length; i += 100) batches.push(unique.slice(i, i + 100))

  const results = await Promise.all(
    batches.map(batch =>
      wooFetch<WooProduct[]>('products', {
        include: batch.join(','),
        per_page: batch.length,
        // Sans ce tri, WooCommerce applique « date » et ignore l'ordre demandé.
        orderby: 'include',
      }),
    ),
  )

  return results.flatMap(r => r.data.map(toProduct))
}

/**
 * Ventes croisées d'un produit, telles que définies dans WooCommerce
 * (onglet « Produits liés »). Vide si le marchand n'en a pas renseigné.
 *
 * La rubrique du produit source est renvoyée avec : elle sert à compléter les
 * suggestions quand l'appelant ne la connaît pas.
 */
export async function fetchCrossSells(
  productId: number,
): Promise<{ items: CatalogProduct[], category?: string }> {
  const { data } = await wooFetch<WooProduct[]>('products', { include: String(productId), per_page: 1 })
  const source = data[0]
  if (!source) return { items: [] }

  const category = source.categories?.[0]?.slug
  const ids = [...(source.cross_sell_ids ?? []), ...(source.upsell_ids ?? [])]
  if (!ids.length) return { items: [], category }

  return { items: await fetchProductsByIds(ids), category }
}

/* ---------- Codes avantage ---------- */

export interface WooCoupon {
  id: number
  code: string
  amount: string
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product'
  description: string
  date_expires: string | null
  usage_limit: number | null
  usage_count: number
  minimum_amount: string
  maximum_amount: string
  product_ids: number[]
  excluded_product_ids: number[]
  exclude_sale_items: boolean
}

/** Recherche un code avantage. `null` si le code n'existe pas. */
export async function fetchCoupon(code: string): Promise<WooCoupon | null> {
  const { data } = await wooFetch<WooCoupon[]>('coupons', {
    code: code.trim().toLowerCase(),
    per_page: 1,
  })
  return data[0] ?? null
}

/* ---------- Commandes ---------- */

/* ---------- Zones de livraison ---------- */

export interface WooShippingMethod {
  instance_id: number
  method_id: string
  method_title: string
  title: string
  enabled: boolean
  settings?: Record<string, { value?: string }>
}

export interface WooShippingZone {
  id: number
  name: string
  locations: { code: string, type: string }[]
  methods: WooShippingMethod[]
}

/** Zones, avec leurs lieux et méthodes. Trois appels par zone, mis en cache. */
const shippingCache = { value: null as WooShippingZone[] | null, expiresAt: 0 }
const SHIPPING_TTL = 5 * 60 * 1000

interface WooGateway {
  id: string
  title: string
  description: string
  enabled: boolean
}

/**
 * Passerelles de paiement telles que la boutique les a réglées.
 *
 * Le tunnel les ignorait : ses deux options étaient écrites en dur dans la
 * page. Désactiver « Paiement à la livraison » dans WooCommerce ne changeait
 * donc rien à l'écran — le réglage existait, il n'était simplement lu par
 * personne.
 */
export async function fetchPaymentGateways(): Promise<WooGateway[]> {
  const { data } = await wooFetch<WooGateway[]>('payment_gateways')
  return Array.isArray(data) ? data : []
}

export async function fetchShippingZones(): Promise<WooShippingZone[]> {
  if (shippingCache.value && shippingCache.expiresAt > Date.now()) return shippingCache.value

  const { data: zones } = await wooFetch<{ id: number, name: string }[]>('shipping/zones')

  const detailed = await Promise.all(
    zones.map(async (zone) => {
      // La zone 0 (« reste du monde ») n'a pas de lieux : l'interroger vaut un 404.
      const [locations, methods] = await Promise.all([
        zone.id === 0
          ? Promise.resolve({ data: [] as { code: string, type: string }[] })
          : wooFetch<{ code: string, type: string }[]>(`shipping/zones/${zone.id}/locations`),
        wooFetch<WooShippingMethod[]>(`shipping/zones/${zone.id}/methods`),
      ])

      return { id: zone.id, name: zone.name, locations: locations.data, methods: methods.data }
    }),
  )

  shippingCache.value = detailed
  shippingCache.expiresAt = Date.now() + SHIPPING_TTL
  return detailed
}

/* ---------- Commandes ---------- */

export interface WooAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postcode: string
  country: string
  email?: string
  phone?: string
  company?: string
}

export interface WooOrderLine {
  name: string
  quantity: number
  total: string
}

export interface WooOrder {
  id: number
  number: string
  order_key: string
  status: string
  total: string
  discount_total: string
  shipping_total: string
  currency: string
  billing: WooAddress
  shipping: WooAddress
  line_items: WooOrderLine[]
  shipping_lines: { method_title: string }[]
  /** URL de règlement, calculée par WooCommerce lui-même. */
  payment_url?: string
}

/**
 * Crée une commande en attente de paiement.
 *
 * C'est WooCommerce qui fait foi sur le montant : on lui envoie les lignes,
 * le code avantage et la livraison, il recalcule et renvoie le total. C'est
 * ce total-là, jamais celui du navigateur, qui part chez Stripe.
 */
export async function createOrder(payload: {
  lineItems: { product_id: number, quantity: number }[]
  couponCode?: string
  customerId?: number
  billing: WooAddress
  shipping: WooAddress
  shippingLine?: { method_id: string, method_title: string, total: string }
  customerNote?: string
  /**
   * Moyen de paiement enregistré sur la commande.
   *
   * Par défaut la carte, en attente de règlement. Le paiement à la livraison
   * passe directement en « en traitement » : il n'y a pas d'encaissement à
   * attendre, la commande part en préparation et le client règle au livreur.
   */
  payment?: { method: string, title: string, status: WooOrder['status'] }
}): Promise<WooOrder> {
  const payment = payload.payment ?? { method: 'stripe', title: 'Carte bancaire', status: 'pending' as const }

  return wooMutate<WooOrder>('POST', 'orders', {
    status: payment.status,
    payment_method: payment.method,
    payment_method_title: payment.title,
    line_items: payload.lineItems,
    billing: payload.billing,
    shipping: payload.shipping,
    ...(payload.shippingLine ? { shipping_lines: [payload.shippingLine] } : {}),
    ...(payload.couponCode ? { coupon_lines: [{ code: payload.couponCode }] } : {}),
    ...(payload.customerId ? { customer_id: payload.customerId } : {}),
    ...(payload.customerNote ? { customer_note: payload.customerNote } : {}),
  })
}

export async function fetchOrder(id: number): Promise<WooOrder | null> {
  try {
    const { data } = await wooFetch<WooOrder>(`orders/${id}`)
    return data
  }
  catch {
    return null
  }
}

/**
 * Marque une commande payée.
 *
 * `set_paid` déclenche la mécanique WooCommerce complète : décrément du
 * stock, courriels de confirmation, passage en « en traitement ». L'appel est
 * volontairement rejouable — le retour du navigateur et le webhook Stripe
 * peuvent tous deux l'atteindre, et WooCommerce ignore un paiement déjà
 * enregistré.
 */
export async function markOrderPaid(id: number, transactionId: string): Promise<WooOrder> {
  return wooMutate<WooOrder>('PUT', `orders/${id}`, {
    status: 'processing',
    set_paid: true,
    transaction_id: transactionId,
  })
}

/** Annule une commande restée sans paiement (échec, abandon). */
export async function cancelOrder(id: number) {
  return wooMutate<WooOrder>('PUT', `orders/${id}`, { status: 'cancelled' })
}

