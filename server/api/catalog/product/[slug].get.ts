import { fallbackProductBySlug } from '../../../utils/catalog-fallback'
import { fetchProductBySlug, isConfigured } from '../../../utils/woocommerce'

/** Fiche produit. Un slug inconnu doit rendre un vrai 404, pas une page vide. */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!

  const product = isConfigured()
    ? await fetchProductBySlug(slug).catch(() => fallbackProductBySlug(slug))
    : fallbackProductBySlug(slug)

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }
  return product
})
