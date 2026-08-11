import { COUNTRY } from '../../utils/checkout'
import { shippingMethodsFor } from '../../utils/shipping'

/**
 * Méthodes de livraison pour une province. Le formulaire les recharge dès que
 * le visiteur change de province — le tarif en dépend.
 */
export default defineEventHandler(async (event) => {
  const state = String(getQuery(event).state ?? '').trim().toUpperCase()
  return { methods: await shippingMethodsFor(COUNTRY, state) }
})
