import type { ReviewsResult } from '#shared/types/reviews'
import { cachedWp } from '../../utils/wp-cache'
import { fetchReviews, isConfigured } from '../../utils/woocommerce'

/**
 * Avis approuvés d'un produit : GET /api/catalog/reviews?product=<id>.
 *
 * Une panne de WooCommerce ne doit pas casser la fiche : la liste d'avis est
 * un complément, pas ce qui permet d'acheter. On renvoie donc une réponse vide,
 * gardée quelques secondes seulement pour ne pas figer la panne.
 */
const EMPTY: ReviewsResult = {
  items: [],
  total: 0,
  average: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
}

export default defineEventHandler(async (event): Promise<ReviewsResult> => {
  const productId = Number(getQuery(event).product)

  if (!Number.isInteger(productId) || productId <= 0 || !isConfigured()) return EMPTY

  // Le cache est partagé par tous les visiteurs et purgé avec le reste du
  // contenu (`/api/revalidate`). Deux minutes : un avis qu'on vient de valider
  // dans WooCommerce n'a pas de purge dédiée, il paraît à l'expiration.
  return cachedWp<ReviewsResult>(`reviews:${productId}`, async () => {
    try {
      return { value: await fetchReviews(productId), isError: false }
    }
    catch (error) {
      console.error('[reviews] avis illisibles', error)
      return { value: EMPTY, isError: true }
    }
  }, { ttl: 2 * 60 * 1000, ttlOnError: 15 * 1000 })
})
