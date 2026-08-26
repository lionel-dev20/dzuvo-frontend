import type { CartItem } from '#shared/types/cart'
import type { CheckoutPayload, PaymentMethod } from '#shared/types/checkout'
import { hasErrors, validateAddress } from '#shared/utils/validation'
import { getSessionUser } from '../../utils/auth'
import { buildLines, normalizeItems } from '../../utils/cart'
import { COUNTRY, toWooAddress } from '../../utils/checkout'
import { resolveShipping, shippingMethodsFor } from '../../utils/shipping'
import { isStripeConfigured, stripeClient, toStripeAmount } from '../../utils/stripe'
import { cancelOrder, createOrder, fetchProductsByIds, isConfigured } from '../../utils/woocommerce'

/**
 * Ouverture du paiement.
 *
 * L'ordre des opérations est celui qui protège le montant : on revalide le
 * panier, on laisse WooCommerce créer la commande et calculer le total, puis
 * on demande à Stripe d'encaisser **ce total-là**. Rien de monétaire ne vient
 * du navigateur.
 */
export default defineEventHandler(async (event) => {
  if (!isConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Boutique non configurée',
      message: 'La commande n’est pas encore ouverte. Merci de réessayer plus tard.',
    })
  }

  const body = await readBody<CheckoutPayload & {
    items: CartItem[]
    coupon?: string
    paymentMethod?: PaymentMethod
  }>(event).catch(() => null)

  /*
   * Moyen de paiement : la carte par défaut, et rien d'autre n'est accepté que
   * ce qui est explicitement prévu ici — un intitulé venu du navigateur ne doit
   * pas pouvoir désigner une passerelle au hasard.
   */
  const paymentMethod: PaymentMethod = body?.paymentMethod === 'cod' ? 'cod' : 'card'

  // La carte exige Stripe ; le paiement à la livraison n'en a pas besoin.
  if (paymentMethod === 'card' && !isStripeConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Paiement non configuré',
      message: 'Le paiement par carte n’est pas encore disponible. Choisissez le paiement à la livraison.',
    })
  }

  // Champ piège : un robot le remplit, un visiteur jamais.
  if (body?.honeypot) {
    throw createError({ statusCode: 400, statusMessage: 'Requête rejetée' })
  }

  /* ---------- Adresse ---------- */

  const errors = validateAddress(body?.address ?? {})
  const billingErrors = body?.billing ? validateAddress(body.billing) : {}

  if (hasErrors(errors) || hasErrors(billingErrors)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: 'Merci de vérifier les informations saisies.',
      data: { errors, billingErrors },
    })
  }

  /* ---------- Panier, revalidé ---------- */

  const items = normalizeItems(body?.items)
  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: 'Panier vide' })
  }

  const products = await fetchProductsByIds(items.map(item => item.id)).catch((error) => {
    console.error('[checkout] WooCommerce injoignable', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Boutique indisponible',
      message: 'La commande est momentanément indisponible. Merci de réessayer dans un instant.',
    })
  })

  const { lines } = buildLines(items, products)
  if (!lines.length) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Panier indisponible',
      message: 'Aucun article du panier n’est disponible à la commande.',
    })
  }

  /* ---------- Livraison ---------- */

  const address = body!.address
  const methods = await shippingMethodsFor(COUNTRY, address.state)
  const method = resolveShipping(methods, body?.shipping ?? '')

  if (!method) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Livraison invalide',
      message: 'Merci de choisir un mode de livraison.',
    })
  }

  /* ---------- Commande WooCommerce ---------- */

  const user = await getSessionUser(event).catch(() => null)
  const shippingAddress = toWooAddress(address, true)

  const order = await createOrder({
    lineItems: lines.map(line => ({ product_id: line.id, quantity: line.quantity })),
    couponCode: body?.coupon?.trim() || undefined,
    customerId: user?.id,
    billing: toWooAddress(body?.billing ?? address),
    shipping: shippingAddress,
    shippingLine: {
      method_id: method.id.split(':')[0]!,
      method_title: method.label,
      total: method.cost.toFixed(2),
    },
    customerNote: body?.note?.trim() || undefined,
    payment: paymentMethod === 'cod'
      ? { method: 'cod', title: 'Paiement à la livraison', status: 'processing' }
      : { method: 'stripe', title: 'Carte bancaire', status: 'pending' },
  }).catch((error) => {
    console.error('[checkout] création de commande refusée', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Commande refusée',
      message: 'La commande n’a pas pu être créée. Merci de réessayer.',
    })
  })

  /* ---------- Paiement Stripe ---------- */

  const total = Number(order.total || 0)
  if (!(total > 0)) {
    await cancelOrder(order.id).catch(() => {})
    throw createError({
      statusCode: 409,
      statusMessage: 'Montant invalide',
      message: 'Le montant de la commande est invalide. Merci de reprendre votre panier.',
    })
  }

  /*
   * Paiement à la livraison : la commande est complète, il n'y a rien à
   * encaisser en ligne. On rend la main tout de suite, sans passer par Stripe
   * ni par /api/checkout/confirm — le règlement se fera au livreur, et c'est
   * WooCommerce qui le constatera.
   */
  if (paymentMethod === 'cod') {
    return {
      orderId: order.id,
      orderKey: order.order_key,
      paymentMethod,
      total,
      currency: order.currency || 'CAD',
    }
  }

  try {
    const intent = await stripeClient().paymentIntents.create(
      {
        amount: toStripeAmount(total),
        currency: (order.currency || 'CAD').toLowerCase(),
        // Carte uniquement : pas de moyen à redirection, donc pas d'aller-retour
        // hors du site au moment de payer.
        payment_method_types: ['card'],
        receipt_email: shippingAddress.email,
        description: `Commande DZUVO n° ${order.number || order.id}`,
        // Le rapprochement se fait sur ces clés, jamais sur ce que dit le client.
        metadata: { orderId: String(order.id), orderKey: order.order_key },
      },
      // Un double envoi du formulaire ne crée pas deux paiements.
      { idempotencyKey: `dzuvo-order-${order.id}` },
    )

    return {
      orderId: order.id,
      orderKey: order.order_key,
      clientSecret: intent.client_secret,
      paymentMethod,
      total,
      currency: order.currency || 'CAD',
    }
  }
  catch (error) {
    // Sans paiement possible, la commande ne doit pas rester en attente.
    console.error('[checkout] Stripe a refusé la création du paiement', error)
    await cancelOrder(order.id).catch(() => {})

    throw createError({
      statusCode: 502,
      statusMessage: 'Paiement indisponible',
      message: 'Le paiement n’a pas pu être initialisé. Merci de réessayer.',
    })
  }
})
