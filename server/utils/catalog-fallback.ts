import type { CatalogCategory, CatalogProduct, ProductQuery } from '#shared/types/catalog'

/**
 * Catalogue de démonstration, servi tant que WooCommerce n'est pas configuré.
 * Il permet de développer et de valider les pages avant l'ouverture de la
 * boutique. Dès que WOO_BASE_URL et les clés sont renseignés, ce jeu n'est
 * plus jamais consulté.
 */

interface Seed {
  slug: string
  name: string
  description: string
  children: { slug: string, name: string, description: string }[]
}

const seeds: Seed[] = [
  {
    slug: 'interieur',
    name: 'Intérieur',
    description: 'Tapis, housses et rangements pour un habitacle net en toute saison.',
    children: [
      { slug: 'tapis-auto', name: 'Tapis d’auto', description: 'Toutes saisons, à rebords surélevés.' },
      { slug: 'housses-de-siege', name: 'Housses de siège', description: 'Ajustables, lavables en machine.' },
      { slug: 'organisateurs-de-coffre', name: 'Organisateurs de coffre', description: 'Compartiments renforcés et pliables.' },
    ],
  },
  {
    slug: 'exterieur',
    name: 'Extérieur',
    description: 'Protection de carrosserie et accessoires de plein air.',
    children: [
      { slug: 'baches-et-housses', name: 'Bâches et housses', description: 'Résistantes au gel et aux UV.' },
      { slug: 'coffres-de-toit', name: 'Coffres de toit', description: 'Volume utile de 300 à 500 L.' },
      { slug: 'deflecteurs', name: 'Déflecteurs', description: 'Vitres et capot, pose sans perçage.' },
    ],
  },
  {
    slug: 'electronique',
    name: 'Électronique',
    description: 'Caméras, navigation et alimentation à bord.',
    children: [
      { slug: 'cameras-et-dashcams', name: 'Caméras et dashcams', description: 'Enregistrement continu, vision de nuit.' },
      { slug: 'audio-et-confort', name: 'Audio & confort', description: 'Autoradios, enceintes, adaptateurs.' },
      { slug: 'chargeurs-et-supports', name: 'Chargeurs et supports', description: 'USB-C, induction, fixations.' },
    ],
  },
  {
    slug: 'entretien',
    name: 'Entretien',
    description: 'Nettoyants et produits de finition testés au froid.',
    children: [
      { slug: 'nettoyants', name: 'Nettoyants', description: 'Habitacle, jantes, vitres.' },
      { slug: 'cires-et-polish', name: 'Cires et polish', description: 'Protection longue durée.' },
      { slug: 'lave-glace', name: 'Lave-glace', description: 'Formules jusqu’à -40 °C.' },
    ],
  },
  {
    slug: 'pieces-et-filtres',
    name: 'Pièces & filtres',
    description: 'Les consommables d’entretien courant, compatibles toutes marques.',
    children: [
      { slug: 'filtres', name: 'Filtres', description: 'Air moteur, habitacle, charbon actif.' },
      { slug: 'essuie-glaces', name: 'Essuie-glaces', description: 'Toutes saisons, montage sans outil.' },
      { slug: 'ampoules', name: 'Ampoules', description: 'Halogène et LED homologuées.' },
      { slug: 'batteries', name: 'Batteries', description: 'Démarrage renforcé, reprise de l’ancienne.' },
    ],
  },
  {
    slug: 'confort-et-securite',
    name: 'Confort & sécurité',
    description: 'L’équipement qui évite les mauvaises surprises sur la route.',
    children: [
      { slug: 'demarreurs-d-appoint', name: 'Démarreurs d’appoint', description: 'Lithium, jusqu’à 1500 A.' },
      { slug: 'gonfleurs-de-pneus', name: 'Gonfleurs de pneus', description: '12 V, avec jauge numérique.' },
      { slug: 'trousse-hiver', name: 'Trousses d’hiver', description: 'Balai à neige, câbles, couverture.' },
      { slug: 'pare-soleil', name: 'Pare-soleil', description: 'Pliables, ajustables à tout pare-brise.' },
    ],
  },
]

/** Modèles de produits déclinés dans chaque sous-catégorie. */
const templates = [
  { suffix: 'essentiel', price: 24.99, sale: 0, rating: 4.3, reviews: 128 },
  { suffix: 'confort', price: 49.99, sale: 39.99, rating: 4.6, reviews: 312 },
  { suffix: 'premium', price: 89.99, sale: 0, rating: 4.8, reviews: 87 },
  { suffix: 'compact', price: 34.99, sale: 27.99, rating: 4.1, reviews: 54 },
]

function buildCatalog() {
  const categories: CatalogCategory[] = []
  const products: CatalogProduct[] = []
  let id = 1

  for (const seed of seeds) {
    const children: CatalogCategory[] = seed.children.map(child => ({
      id: id++,
      slug: child.slug,
      name: child.name,
      description: child.description,
      count: templates.length,
      parent: seed.slug,
    }))

    categories.push({
      id: id++,
      slug: seed.slug,
      name: seed.name,
      description: seed.description,
      count: children.length * templates.length,
      children,
    })

    for (const child of seed.children) {
      for (const model of templates) {
        const onSale = model.sale > 0
        products.push({
          id: id++,
          slug: `${child.slug}-${model.suffix}`,
          name: `${child.name} DZUVO ${model.suffix}`,
          excerpt: child.description,
          description: `${child.description} Conçu pour s’adapter à tous les véhicules et testé dans les conditions hivernales canadiennes.`,
          sku: `DZ-${child.slug.slice(0, 3).toUpperCase()}-${model.suffix.slice(0, 3).toUpperCase()}`,
          price: onSale ? model.sale : model.price,
          regularPrice: onSale ? model.price : undefined,
          onSale,
          inStock: model.suffix !== 'premium',
          stockLabel: model.suffix !== 'premium' ? 'Livraison 24 h' : 'Non disponible',
          images: [],
          categories: [
            { slug: child.slug, name: child.name },
            { slug: seed.slug, name: seed.name },
          ],
          rating: model.rating,
          reviews: model.reviews,
          attributes: [
            { name: 'Compatibilité', value: 'Toutes marques' },
            { name: 'Garantie', value: '2 ans' },
            { name: 'Expédition', value: 'Depuis le Canada' },
          ],
          badge: onSale ? 'Promo' : model.suffix === 'premium' ? 'Nouveauté' : undefined,
        })
      }
    }
  }

  return { categories, products }
}

const catalog = buildCatalog()

export function fallbackCategories(): CatalogCategory[] {
  return catalog.categories
}

export function fallbackProducts(query: ProductQuery = {}) {
  const { page = 1, perPage = 24 } = query
  let items = [...catalog.products]

  if (query.category) {
    items = items.filter(p => p.categories.some(c => c.slug === query.category))
  }
  if (query.search) {
    const needle = query.search.toLowerCase()
    items = items.filter(p => p.name.toLowerCase().includes(needle))
  }
  if (query.onSale) items = items.filter(p => p.onSale)
  if (query.inStock) items = items.filter(p => p.inStock)
  if (query.minPrice) items = items.filter(p => p.price >= query.minPrice!)
  if (query.maxPrice) items = items.filter(p => p.price <= query.maxPrice!)

  switch (query.sort) {
    case 'price-asc': items.sort((a, b) => a.price - b.price); break
    case 'price-desc': items.sort((a, b) => b.price - a.price); break
    case 'newest': items.sort((a, b) => b.id - a.id); break
    default: items.sort((a, b) => b.reviews - a.reviews)
  }

  const total = items.length
  const start = (page - 1) * perPage
  return { items: items.slice(start, start + perPage), total, page, perPage }
}

export function fallbackProductBySlug(slug: string) {
  return catalog.products.find(p => p.slug === slug) ?? null
}
