import type { ReviewPayload } from '#shared/types/reviews'
import { hasErrors, validateReview } from '#shared/utils/validation'
import { checkRateLimit } from '../../utils/rate-limit'
import { createReview, isConfigured } from '../../utils/woocommerce'

/**
 * Dépôt d'un avis : POST /api/catalog/reviews.
 *
 * L'avis part en attente de validation dans WooCommerce : il ne paraît pas
 * tout de suite, et la réponse le dit au visiteur plutôt que de le laisser
 * chercher son texte.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<ReviewPayload>(event).catch(() => null)

  // Le champ piège est invisible pour un humain : rempli, c'est un robot. On
  // répond comme un succès pour ne pas lui apprendre qu'il a été reconnu.
  if (body?.honeypot) {
    return { success: true, message: 'Merci, votre avis a bien été reçu.' }
  }

  checkRateLimit(event, 'review')

  const errors = validateReview(body ?? {})
  if (hasErrors(errors)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Avis invalide',
      message: 'Merci de corriger les champs signalés.',
      data: { errors },
    })
  }

  if (!isConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Avis indisponibles',
      message: 'Les avis seront disponibles à l’ouverture de la boutique.',
    })
  }

  try {
    await createReview({
      productId: Number(body!.productId),
      name: body!.name,
      email: body!.email,
      rating: Number(body!.rating),
      comment: body!.comment,
    })
  }
  catch (error) {
    console.error('[reviews] dépôt refusé', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Avis refusé',
      message: 'Votre avis n’a pas pu être enregistré. Merci de réessayer dans un instant.',
    })
  }

  return {
    success: true,
    message: 'Merci ! Votre avis sera publié dès qu’il aura été validé par notre équipe.',
  }
})
