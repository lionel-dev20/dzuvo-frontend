import type { CatalogProduct } from '#shared/types/catalog'
import { fallbackCrossSells, fallbackProducts } from '../../utils/catalog-fallback'
import { fetchCrossSells, fetchProducts, isConfigured } from '../../utils/woocommerce'

/**
 * Suggestions affichées après une mise au panier.
 *
 * On sert d'abord les ventes croisées saisies dans WooCommerce — c'est le
 * marchand qui sait ce qui va ensemble. À défaut, on complète avec la même
 * rubrique pour ne jamais montrer un bloc vide.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const productId = Number(q.product ?? 0)
  const category = q.category ? String(q.category) : undefined
  const limit = Math.min(Number(q.limit ?? 6), 12)

  // Les articles déjà au panier n'ont rien à faire dans les suggestions.
  const exclude = new Set(
    String(q.exclude ?? '')
      .split(',')
      .map(Number)
      .filter(Boolean),
  )
  if (productId) exclude.add(productId)

  const configured = isConfigured()

  let items: CatalogProduct[] = []
  /** Rubrique du produit source, à défaut de celle passée par l'appelant. */
  let family = category

  if (productId) {
    const related = configured
      ? await fetchCrossSells(productId).catch(() => ({ items: [], category: undefined }))
      : fallbackCrossSells(productId)

    items = related.items
    family ??= related.category
  }

  const keep = (list: CatalogProduct[]) =>
    list.filter(p => !exclude.has(p.id) && p.inStock && p.purchasable !== false && !p.variable)

  items = keep(items)

  if (items.length < limit && family) {
    const filler = configured
      ? await fetchProducts({ category: family, perPage: limit + exclude.size }).catch(() => ({ items: [] as CatalogProduct[] }))
      : fallbackProducts({ category: family, perPage: limit + exclude.size })

    const seen = new Set(items.map(p => p.id))
    items = [...items, ...keep(filler.items).filter(p => !seen.has(p.id))]
  }

  return { items: items.slice(0, limit) }
})
