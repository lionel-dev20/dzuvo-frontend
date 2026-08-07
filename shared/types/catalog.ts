/**
 * Modèle du catalogue, indépendant de la source.
 *
 * WooCommerce reste derrière la couche serveur : ces types sont ce que
 * consomme le front. Changer de back-office ne devrait toucher qu'au
 * transformateur, pas aux pages.
 */

export interface CatalogCategory {
  id: number
  slug: string
  name: string
  description: string
  image?: string
  /** Nombre de produits, sous-catégories comprises. */
  count: number
  /** Slug du parent, absent pour une rubrique de premier niveau. */
  parent?: string
  children?: CatalogCategory[]
}

export interface ProductImage {
  src: string
  alt: string
}

export interface CatalogProduct {
  id: number
  slug: string
  name: string
  /** Résumé court, affiché en liste. */
  excerpt: string
  description: string
  sku: string
  price: number
  /** Prix barré, présent seulement en promotion. */
  regularPrice?: number
  onSale: boolean
  inStock: boolean
  stockLabel: string
  images: ProductImage[]
  categories: { slug: string, name: string }[]
  rating: number
  reviews: number
  /** Caractéristiques techniques, telles que saisies dans WooCommerce. */
  attributes: { name: string, value: string }[]
  badge?: string
}

/** Réponse paginée : le total vient des en-têtes WooCommerce. */
export interface ProductListResult {
  items: CatalogProduct[]
  total: number
  page: number
  perPage: number
}

export type ProductSort = 'popularity' | 'price-asc' | 'price-desc' | 'newest'

export interface ProductQuery {
  category?: string
  search?: string
  page?: number
  perPage?: number
  sort?: ProductSort
  onSale?: boolean
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
}
