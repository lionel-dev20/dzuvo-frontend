import type { QuantityOffer } from '#shared/types/catalog'
import { roundMoney } from '#shared/utils/format'

/**
 * Offres de quantité : « 2 articles, -10 % ».
 *
 * La règle vit ici, et seulement ici, parce que deux endroits doivent
 * s'accorder au centime : la fiche produit, qui affiche l'économie avant
 * l'achat, et le serveur, qui fixe le prix du panier et de la commande. Deux
 * copies de ce calcul finiraient par diverger, et le client paierait alors un
 * autre montant que celui annoncé.
 *
 * Une offre s'applique à **toutes** les unités de la ligne dès que son seuil
 * est atteint (« 2 pour -10 % » : les deux sont remisées), comme sur les
 * boutiques Shopify à lots. Les offres ne se cumulent pas : la plus haute
 * atteinte l'emporte.
 */

/** Seuil minimal : à une unité, il n'y a pas d'offre. */
export const OFFER_MIN_QUANTITY = 2
/** Plafond de remise : au-delà, la saisie est presque sûrement une faute. */
export const OFFER_MAX_PERCENT = 90

/**
 * Nettoie les offres saisies dans l'administration.
 *
 * Ce contenu vient d'un champ libre : une offre incohérente ne doit pas
 * faire un prix absurde, elle doit disparaître. Les seuils sont uniques et
 * croissants, et une remise qui baisse quand la quantité monte est écartée —
 * acheter plus ne doit jamais coûter plus cher à l'unité.
 */
export function normalizeOffers(raw: { quantity: unknown, percent: unknown }[]): QuantityOffer[] {
  const byQuantity = new Map<number, number>()

  for (const entry of raw) {
    const quantity = Math.trunc(Number(entry.quantity))
    const percent = roundMoney(Number(String(entry.percent).replace(',', '.')))

    if (!Number.isFinite(quantity) || quantity < OFFER_MIN_QUANTITY || quantity > 99) continue
    if (!Number.isFinite(percent) || percent <= 0 || percent > OFFER_MAX_PERCENT) continue

    byQuantity.set(quantity, percent)
  }

  const sorted = [...byQuantity]
    .map(([quantity, percent]) => ({ quantity, percent }))
    .sort((a, b) => a.quantity - b.quantity)

  const kept: QuantityOffer[] = []
  for (const offer of sorted) {
    if (!kept.length || offer.percent > kept.at(-1)!.percent) kept.push(offer)
  }

  return kept
}

/** Offre qui s'applique à cette quantité : la plus haute dont le seuil est atteint. */
export function offerFor(quantity: number, offers: readonly QuantityOffer[] = []): QuantityOffer | undefined {
  let match: QuantityOffer | undefined
  for (const offer of offers) {
    if (quantity >= offer.quantity) match = offer
  }
  return match
}

export interface PricedLine {
  /** Total de la ligne, offre déduite. */
  total: number
  /** Total sans l'offre. */
  fullTotal: number
  /** Économie apportée par l'offre. */
  saving: number
  /** Pourcentage appliqué, 0 si aucune offre n'est atteinte. */
  percent: number
}

/** Prix d'une ligne de `quantity` unités à `unitPrice`, offre comprise. */
export function priceLine(unitPrice: number, quantity: number, offers: readonly QuantityOffer[] = []): PricedLine {
  const fullTotal = roundMoney(unitPrice * quantity)
  const offer = offerFor(quantity, offers)

  if (!offer) return { total: fullTotal, fullTotal, saving: 0, percent: 0 }

  const total = roundMoney(fullTotal * (1 - offer.percent / 100))
  return { total, fullTotal, saving: roundMoney(fullTotal - total), percent: offer.percent }
}
