import type Stripe from 'stripe'
import { settleOrder } from '../../utils/checkout'
import { stripeClient } from '../../utils/stripe'
import { cancelOrder } from '../../utils/woocommerce'

/**
 * Webhook Stripe.
 *
 * Sans lui, un client qui paie puis ferme l'onglet avant le retour laisserait
 * une commande en attente alors que l'argent est encaissé. Stripe rejoue
 * l'événement jusqu'à obtenir un 2xx : ce point d'entrée doit donc rester
 * idempotent, ce dont `settleOrder` se charge.
 *
 * La signature est vérifiée sur le corps **brut** : le moindre reformatage du
 * JSON invaliderait le calcul.
 */
export default defineEventHandler(async (event) => {
  const { stripeWebhookSecret } = useRuntimeConfig()

  if (!stripeWebhookSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Webhook non configuré' })
  }

  const signature = getHeader(event, 'stripe-signature')
  const raw = await readRawBody(event, false)

  if (!signature || !raw) {
    throw createError({ statusCode: 400, statusMessage: 'Signature manquante' })
  }

  let hook: Stripe.Event
  try {
    hook = stripeClient().webhooks.constructEvent(raw, signature, stripeWebhookSecret)
  }
  catch (error) {
    // Signature invalide : la requête ne vient pas de Stripe.
    console.error('[stripe] webhook rejeté', error)
    throw createError({ statusCode: 400, statusMessage: 'Signature invalide' })
  }

  const intent = hook.data.object as Stripe.PaymentIntent

  switch (hook.type) {
    case 'payment_intent.succeeded':
      await settleOrder(intent)
      break

    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled': {
      // Carte refusée ou abandon : la commande ne doit pas rester en attente.
      const orderId = Number(intent.metadata?.orderId ?? 0)
      if (orderId) await cancelOrder(orderId).catch(() => {})
      break
    }

    default:
      // Les autres événements ne nous concernent pas, mais doivent être acquittés.
      break
  }

  return { received: true }
})
