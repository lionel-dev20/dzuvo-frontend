import type Stripe from 'stripe'
import type { CheckoutAddress, OrderSummary } from '#shared/types/checkout'
import { formatPostcodeCA } from '#shared/utils/validation'
import type { WooAddress, WooOrder } from './woocommerce'
import { fetchOrder, markOrderPaid } from './woocommerce'
import { toStripeAmount } from './stripe'

/** Pays desservi. La boutique est réglée sur le Canada (devise CAD). */
export const COUNTRY = 'CA'

/** Adresse du formulaire → format WooCommerce. */
export function toWooAddress(address: CheckoutAddress): WooAddress {
  return {
    first_name: address.firstName.trim(),
    last_name: address.lastName.trim(),
    address_1: address.address1.trim(),
    /* WooCommerce n'a pas de champ « quartier » : il rejoint la seconde ligne
       d'adresse, après l'appartement. C'est la ligne que les transporteurs
       lisent, et celle qui figure sur le bon de livraison. */
    address_2: [address.address2?.trim(), address.district?.trim()].filter(Boolean).join(', '),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    postcode: formatPostcodeCA(address.postcode),
    country: COUNTRY,
    email: address.email.trim().toLowerCase(),
    phone: address.phone.trim(),
    company: address.company?.trim() || '',
  }
}

/**
 * Enregistre le paiement d'une commande à partir du PaymentIntent Stripe.
 *
 * Point d'entrée unique du retour de paiement, atteint par deux chemins : le
 * navigateur qui revient, et le webhook Stripe. L'opération est donc conçue
 * pour être rejouée — c'est ce qui garantit qu'une commande payée est bien
 * encaissée même si le visiteur ferme l'onglet aussitôt.
 *
 * Rien n'est cru sur parole : le PaymentIntent est celui que Stripe renvoie,
 * la commande visée est celle inscrite dans ses métadonnées, et le montant
 * doit correspondre au centime près.
 */
export async function settleOrder(intent: Stripe.PaymentIntent): Promise<WooOrder> {
  const orderId = Number(intent.metadata?.orderId ?? 0)
  const orderKey = intent.metadata?.orderKey ?? ''

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'Paiement sans commande associée' })
  }

  if (intent.status !== 'succeeded') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Paiement non abouti',
      message: 'Le paiement n’a pas été confirmé par la banque.',
    })
  }

  const order = await fetchOrder(orderId)
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Commande introuvable' })
  }

  // La clé lie le paiement à cette commande précise, pas seulement à son numéro.
  if (orderKey && order.order_key !== orderKey) {
    throw createError({ statusCode: 403, statusMessage: 'Paiement non rattaché à cette commande' })
  }

  const expected = toStripeAmount(Number(order.total || 0))
  if (intent.amount_received !== expected && intent.amount !== expected) {
    console.error('[checkout] montant divergent', { orderId, expected, intent: intent.amount })
    throw createError({
      statusCode: 409,
      statusMessage: 'Montant divergent',
      message: 'Le montant réglé ne correspond pas à la commande. Notre équipe a été alertée.',
    })
  }

  // Déjà encaissée : le second appel n'a rien à faire.
  if (!['pending', 'failed'].includes(order.status)) return order

  return markOrderPaid(orderId, intent.id)
}

/** Commande WooCommerce → résumé affiché sur la page de confirmation. */
export function toOrderSummary(order: WooOrder): OrderSummary {
  const total = Number(order.total || 0)
  const shippingTotal = Number(order.shipping_total || 0)
  const discountTotal = Number(order.discount_total || 0)

  return {
    id: order.id,
    number: order.number || String(order.id),
    status: order.status,
    // « pending » et « failed » sont les seuls états non réglés qu'on produit.
    paid: !['pending', 'failed', 'cancelled'].includes(order.status),
    total,
    subtotal: total - shippingTotal + discountTotal,
    shippingTotal,
    discountTotal,
    currency: order.currency || 'CAD',
    email: order.billing?.email ?? '',
    lines: (order.line_items ?? []).map(line => ({
      name: line.name,
      quantity: line.quantity,
      total: Number(line.total || 0),
    })),
    shippingAddress: formatAddress(order.shipping),
    shippingLabel: order.shipping_lines?.[0]?.method_title ?? '',
  }
}

function formatAddress(address?: WooAddress) {
  if (!address?.address_1) return ''

  return [
    `${address.first_name} ${address.last_name}`.trim(),
    address.company,
    address.address_1,
    address.address_2,
    `${address.city}, ${address.state} ${address.postcode}`,
  ]
    .filter(Boolean)
    .join('\n')
}
