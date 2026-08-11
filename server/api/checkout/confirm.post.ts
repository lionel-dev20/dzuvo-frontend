import { settleOrder, toOrderSummary } from '../../utils/checkout'
import { stripeClient } from '../../utils/stripe'

/**
 * Retour du navigateur après saisie de la carte.
 *
 * On ne croit pas le client sur le succès du paiement : on redemande le
 * PaymentIntent à Stripe et c'est sa réponse qui décide. Le webhook fait le
 * même travail de son côté, pour les visiteurs qui ne reviennent jamais.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ paymentIntentId?: string }>(event).catch(() => null)
  const intentId = body?.paymentIntentId?.trim()

  if (!intentId) {
    throw createError({ statusCode: 400, statusMessage: 'Paiement manquant' })
  }

  const intent = await stripeClient().paymentIntents.retrieve(intentId).catch((error) => {
    console.error('[checkout] PaymentIntent illisible', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Paiement invérifiable',
      message: 'Nous n’avons pas pu vérifier le paiement. Merci de nous contacter.',
    })
  })

  const order = await settleOrder(intent)
  return { order: toOrderSummary(order) }
})
