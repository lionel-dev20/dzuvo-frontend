import type { CartResolveBody } from '#shared/types/cart'
import { fallbackProductsByIds } from '../../utils/catalog-fallback'
import { applyCoupon, buildLines, normalizeItems, toCartState } from '../../utils/cart'
import { fetchCoupon, fetchProductsByIds, isConfigured } from '../../utils/woocommerce'

/**
 * Résolution du panier.
 *
 * Le client envoie ses identifiants et ses quantités, le serveur renvoie
 * l'état qui fait foi : prix du jour, disponibilité, remises, total. Le
 * panier du visiteur reste donc valable même si la boutique change entre deux
 * visites — un produit retiré du catalogue ressort ici en anomalie.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CartResolveBody>(event).catch(() => null)

  const items = normalizeItems(body?.items)
  const code = typeof body?.coupon === 'string' ? body.coupon.trim() : ''

  if (!items.length) return toCartState([], [], undefined, null)

  const ids = items.map(item => item.id)

  let products
  if (isConfigured()) {
    try {
      products = await fetchProductsByIds(ids)
    }
    catch (error) {
      // Pas de repli sur le jeu de démonstration ici : afficher un prix
      // inventé pour un produit réel serait pire qu'une erreur franche.
      console.error('[cart] WooCommerce injoignable', error)
      throw createError({
        statusCode: 503,
        statusMessage: 'Boutique indisponible',
        message: 'Le panier est momentanément indisponible. Merci de réessayer dans un instant.',
      })
    }
  }
  else {
    products = fallbackProductsByIds(ids)
  }

  const { lines, issues } = buildLines(items, products)

  let outcome = null
  if (code && lines.length) {
    if (!isConfigured()) {
      outcome = { discount: 0, label: '', error: 'Les codes avantage seront disponibles à l’ouverture de la boutique.' }
    }
    else {
      const coupon = await fetchCoupon(code).catch((error) => {
        console.error('[cart] code avantage invérifiable', error)
        return null
      })
      outcome = applyCoupon(coupon, lines, code)
    }
  }

  return toCartState(lines, issues, code || undefined, outcome)
})
