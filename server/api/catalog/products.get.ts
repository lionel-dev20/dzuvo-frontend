import type { ProductQuery, ProductSort } from '#shared/types/catalog'
import { fallbackProducts } from '../../utils/catalog-fallback'
import { fetchProducts, isConfigured } from '../../utils/woocommerce'

/** Liste paginée et filtrée. Les paramètres arrivent par la query string. */
export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  const query: ProductQuery = {
    category: q.category ? String(q.category) : undefined,
    search: q.search ? String(q.search) : undefined,
    page: Number(q.page ?? 1),
    perPage: Math.min(Number(q.perPage ?? 24), 48),
    sort: (q.sort as ProductSort) ?? 'popularity',
    onSale: q.onSale === 'true',
    inStock: q.inStock === 'true',
    minPrice: q.minPrice ? Number(q.minPrice) : undefined,
    maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
  }

  if (!isConfigured()) return fallbackProducts(query)

  try {
    return await fetchProducts(query)
  }
  catch (error) {
    console.error('[catalog] produits indisponibles, repli local', error)
    return fallbackProducts(query)
  }
})
