import type { PaymentMethod } from '#shared/types/checkout'
import { isStripeConfigured } from '../../utils/stripe'
import { cachedWp } from '../../utils/wp-cache'
import { fetchPaymentGateways, isConfigured } from '../../utils/woocommerce'

/**
 * Moyens de paiement réellement proposés.
 *
 * Le tunnel affichait ses deux options en dur : désactiver « Paiement à la
 * livraison » dans WooCommerce ne changeait rien à l'écran. Un réglage qui
 * existe mais que personne ne lit est pire qu'un réglage absent — on croit
 * avoir agi.
 *
 * Les deux moyens ne se décident pas au même endroit, et c'est volontaire :
 *
 *  - **la carte** dépend des clés Stripe de *ce* site. Le paiement ne passe
 *    pas par la passerelle Stripe de WooCommerce : Nuxt parle à Stripe en
 *    direct, crée son PaymentIntent, puis marque la commande payée. L'état de
 *    la passerelle WooCommerce n'a donc aucune prise sur lui.
 *  - **le paiement à la livraison** est, lui, entièrement une affaire de
 *    WooCommerce : c'est lui qui encaissera. Son interrupteur fait foi.
 */

export interface PaymentOption {
  id: PaymentMethod
  label: string
  hint: string
}

export const PAYMENT_METHODS_CACHE_KEY = 'payment-methods'
const TTL = 5 * 60 * 1000
const TTL_ERROR = 15 * 1000

/** Le paiement à la livraison est-il ouvert côté boutique ? */
export async function isCodEnabled(): Promise<boolean> {
  if (!isConfigured()) return false

  return cachedWp<boolean>(PAYMENT_METHODS_CACHE_KEY, async () => {
    try {
      const gateways = await fetchPaymentGateways()
      return { value: gateways.some(g => g.id === 'cod' && g.enabled), isError: false }
    }
    catch (error) {
      /*
       * Boutique injoignable : on ferme plutôt que d'ouvrir. Proposer un moyen
       * de paiement que WooCommerce refusera ensuite donne une commande créée
       * puis bloquée — l'inverse coûte seulement une option de moins, le temps
       * que la boutique réponde à nouveau.
       */
      console.error('[checkout] passerelles de paiement illisibles', error)
      return { value: false, isError: true }
    }
  }, { ttl: TTL, ttlOnError: TTL_ERROR })
}

export default defineEventHandler(async (): Promise<{ methods: PaymentOption[] }> => {
  const methods: PaymentOption[] = []

  if (isStripeConfigured()) {
    methods.push({
      id: 'card',
      label: 'Carte bancaire',
      hint: 'Débit immédiat, paiement sécurisé.',
    })
  }

  if (await isCodEnabled()) {
    methods.push({
      id: 'cod',
      label: 'À la livraison',
      hint: 'Vous réglez au livreur, à la réception.',
    })
  }

  return { methods }
})
