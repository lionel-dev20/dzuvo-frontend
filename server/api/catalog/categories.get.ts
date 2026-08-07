import { fallbackCategories } from '../../utils/catalog-fallback'
import { fetchCategories, isConfigured } from '../../utils/woocommerce'

/**
 * Arborescence des catégories, mise en cache : elle change rarement et cette
 * route est appelée par toutes les pages du catalogue.
 */
export default defineCachedEventHandler(async () => {
  if (!isConfigured()) return fallbackCategories()

  try {
    return await fetchCategories()
  }
  catch (error) {
    // La boutique injoignable ne doit pas faire tomber la page.
    console.error('[catalog] catégories indisponibles, repli local', error)
    return fallbackCategories()
  }
}, {
  // Pas de cache en développement : le catalogue de démonstration change
  // au fil des ajustements, un cache figé masquerait les modifications.
  maxAge: import.meta.dev ? 0 : 60 * 10,
  name: 'catalog-categories',
})
