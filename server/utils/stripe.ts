import Stripe from 'stripe'

/**
 * Accès à Stripe.
 *
 * La clé secrète ne quitte jamais le serveur. Le numéro de carte, lui, ne
 * l'atteint jamais : il part du navigateur directement chez Stripe via
 * Elements, et ce site ne manipule qu'un identifiant de paiement.
 */

let client: Stripe | null = null
let clientKey = ''

export function isStripeConfigured() {
  const { stripeSecretKey } = useRuntimeConfig()
  return Boolean(stripeSecretKey)
}

export function stripeClient() {
  const { stripeSecretKey, stripeApiHost } = useRuntimeConfig()

  if (!stripeSecretKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Paiement non configuré',
      message: 'Le paiement par carte n’est pas encore disponible. Merci de réessayer plus tard.',
    })
  }

  // Le client est mis en cache, sauf si la clé change (rotation, tests).
  if (client && clientKey === stripeSecretKey) return client

  // `stripeApiHost` n'existe que pour brancher un double lors des tests.
  const host = stripeApiHost
    ? new URL(stripeApiHost.includes('://') ? stripeApiHost : `http://${stripeApiHost}`)
    : null

  client = new Stripe(stripeSecretKey, {
    maxNetworkRetries: 2,
    ...(host
      ? {
          host: host.hostname,
          port: Number(host.port || (host.protocol === 'https:' ? 443 : 80)),
          protocol: host.protocol === 'https:' ? 'https' : 'http',
        }
      : {}),
  })
  clientKey = stripeSecretKey

  return client
}

/**
 * Stripe compte en plus petite unité monétaire : 64,99 $ vaut 6499 cents.
 * L'arrondi se fait ici, une seule fois, sur un montant déjà calculé par le
 * serveur — jamais sur un total venu du navigateur.
 */
export function toStripeAmount(value: number) {
  return Math.round(value * 100)
}

export function fromStripeAmount(amount: number) {
  return amount / 100
}
