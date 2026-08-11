import { toOrderSummary } from '../../../utils/checkout'
import { fetchOrder } from '../../../utils/woocommerce'

/**
 * Commande affichée sur la page de confirmation.
 *
 * La clé de commande tient lieu d'autorisation : sans elle, un simple numéro
 * suffirait à lire la commande d'un autre client. WooCommerce applique la
 * même règle sur ses propres pages.
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const key = String(getQuery(event).key ?? '').trim()

  if (!id || !key) {
    throw createError({ statusCode: 400, statusMessage: 'Référence de commande incomplète' })
  }

  const order = await fetchOrder(id)
  if (!order || order.order_key !== key) {
    throw createError({ statusCode: 404, statusMessage: 'Commande introuvable' })
  }

  return { order: toOrderSummary(order) }
})
