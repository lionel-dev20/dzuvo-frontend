import type { CatalogProduct } from '#shared/types/catalog'
import type { CartIssue, CartItem, CartLine, CartState } from '#shared/types/cart'
import { formatPrice, roundMoney } from '#shared/utils/format'
import type { WooCoupon } from './woocommerce'

/**
 * Calcul du panier, côté serveur exclusivement.
 *
 * Le navigateur n'envoie que des identifiants et des quantités : tout le reste
 * — prix, disponibilité, remise — est reconstruit ici à partir du catalogue.
 * C'est la seule façon d'avoir un total auquel on peut se fier.
 */

/** Quantité maximale par ligne, garde-fou en l'absence de gestion de stock. */
const MAX_LINE_QUANTITY = 99

export function normalizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return []

  const byId = new Map<number, number>()
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const id = Number((entry as CartItem).id)
    const quantity = Number((entry as CartItem).quantity)
    if (!Number.isInteger(id) || id <= 0) continue
    if (!Number.isFinite(quantity) || quantity < 1) continue

    // Un même produit envoyé deux fois ne doit pas produire deux lignes.
    const merged = (byId.get(id) ?? 0) + Math.floor(quantity)
    byId.set(id, Math.min(merged, MAX_LINE_QUANTITY))
  }

  return [...byId].map(([id, quantity]) => ({ id, quantity })).slice(0, 50)
}

/** Assemble les lignes en confrontant le panier du visiteur au catalogue. */
export function buildLines(items: CartItem[], products: CatalogProduct[]) {
  const catalog = new Map(products.map(p => [p.id, p]))
  const lines: CartLine[] = []
  const issues: CartIssue[] = []

  for (const item of items) {
    const product = catalog.get(item.id)

    // Produit dépublié ou supprimé depuis la mise au panier.
    if (!product) {
      issues.push({ id: item.id, reason: 'missing' })
      continue
    }

    if (!product.inStock || product.purchasable === false) {
      issues.push({ id: item.id, name: product.name, reason: 'out-of-stock' })
      continue
    }

    const ceiling = Math.min(product.stockQuantity ?? MAX_LINE_QUANTITY, MAX_LINE_QUANTITY)
    const quantity = Math.max(1, Math.min(item.quantity, ceiling))
    if (quantity !== item.quantity) {
      issues.push({ id: item.id, name: product.name, reason: 'quantity-adjusted', quantity })
    }

    lines.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0]?.src,
      sku: product.sku,
      price: product.price,
      regularPrice: product.regularPrice,
      quantity,
      maxQuantity: product.stockQuantity,
      lineTotal: roundMoney(product.price * quantity),
      inStock: true,
    })
  }

  return { lines, issues }
}

export function subtotalOf(lines: CartLine[]) {
  return roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0))
}

/** Économie déjà acquise grâce aux promotions produit, hors code avantage. */
export function savingsOf(lines: CartLine[]) {
  return roundMoney(
    lines.reduce(
      (sum, line) => sum + (line.regularPrice ? (line.regularPrice - line.price) * line.quantity : 0),
      0,
    ),
  )
}

export interface CouponOutcome {
  discount: number
  label: string
  description?: string
  error?: string
}

/**
 * Applique les règles WooCommerce d'un code avantage.
 *
 * WooCommerce en accepte davantage (cumul, rôles, catégories) : on reprend
 * celles qui décident du montant, et la commande est de toute façon rejouée
 * par WooCommerce au moment du paiement — c'est lui qui tranche.
 */
export function applyCoupon(coupon: WooCoupon | null, lines: CartLine[], code: string): CouponOutcome {
  const fail = (error: string): CouponOutcome => ({ discount: 0, label: '', error })

  if (!coupon) return fail(`Le code « ${code} » n’existe pas.`)

  if (coupon.date_expires) {
    // WooCommerce fait expirer un code à la fin de la journée indiquée.
    const expiry = new Date(`${coupon.date_expires.slice(0, 10)}T23:59:59`)
    if (Number.isFinite(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return fail('Ce code avantage a expiré.')
    }
  }

  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) {
    return fail('Ce code avantage n’est plus disponible.')
  }

  const subtotal = subtotalOf(lines)
  const minimum = Number(coupon.minimum_amount || 0)
  if (minimum > 0 && subtotal < minimum) {
    return fail(`Ce code s’applique à partir de ${formatPrice(minimum)} d’achat.`)
  }

  const maximum = Number(coupon.maximum_amount || 0)
  if (maximum > 0 && subtotal > maximum) {
    return fail(`Ce code ne s’applique pas au-delà de ${formatPrice(maximum)} d’achat.`)
  }

  // Restrictions de périmètre : produits visés, exclus, et articles soldés.
  const included = new Set(coupon.product_ids ?? [])
  const excluded = new Set(coupon.excluded_product_ids ?? [])
  const eligible = lines.filter((line) => {
    if (excluded.has(line.id)) return false
    if (included.size && !included.has(line.id)) return false
    if (coupon.exclude_sale_items && line.regularPrice) return false
    return true
  })

  if (!eligible.length) {
    return fail('Ce code ne s’applique à aucun article du panier.')
  }

  const amount = Number(coupon.amount || 0)
  const eligibleTotal = subtotalOf(eligible)
  const eligibleUnits = eligible.reduce((sum, line) => sum + line.quantity, 0)

  let discount = 0
  let label = ''

  switch (coupon.discount_type) {
    case 'percent':
      discount = eligibleTotal * (amount / 100)
      label = `-${amount.toString().replace('.', ',')} %`
      break
    case 'fixed_product':
      // Montant fixe déduit sur chaque exemplaire concerné.
      discount = amount * eligibleUnits
      label = `-${formatPrice(roundMoney(discount))}`
      break
    default:
      discount = amount
      label = `-${formatPrice(roundMoney(Math.min(amount, subtotal)))}`
  }

  // La remise ne peut jamais dépasser le panier : pas de total négatif.
  discount = roundMoney(Math.min(discount, subtotal))
  if (discount <= 0) return fail('Ce code n’apporte aucune remise sur ce panier.')

  return { discount, label, description: coupon.description || undefined }
}

/** Assemble l'état complet renvoyé au client. */
export function toCartState(
  lines: CartLine[],
  issues: CartIssue[],
  couponCode: string | undefined,
  outcome: CouponOutcome | null,
): CartState {
  const subtotal = subtotalOf(lines)
  const discount = outcome?.error ? 0 : (outcome?.discount ?? 0)

  return {
    lines,
    issues,
    coupon: outcome && !outcome.error && couponCode
      ? { code: couponCode, label: outcome.label, discount, description: outcome.description }
      : null,
    couponError: outcome?.error,
    totals: {
      subtotal,
      savings: savingsOf(lines),
      discount,
      total: roundMoney(Math.max(0, subtotal - discount)),
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
    },
    currency: 'CAD',
  }
}
