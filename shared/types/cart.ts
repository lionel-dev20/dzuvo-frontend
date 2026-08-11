/**
 * Modèle du panier, partagé client et serveur.
 *
 * Le navigateur ne mémorise que des identifiants et des quantités
 * (`CartItem`) : prix, stock et libellés sont toujours recalculés par le
 * serveur à partir de WooCommerce. Un panier trafiqué côté client ne peut donc
 * pas fausser un total.
 */

/** Ce que le cookie du visiteur contient — rien de sensible, rien de monétaire. */
export interface CartItem {
  id: number
  quantity: number
}

/** Ligne résolue, prête à l'affichage. */
export interface CartLine {
  id: number
  slug: string
  name: string
  image?: string
  sku: string
  price: number
  /** Prix barré, présent seulement en promotion. */
  regularPrice?: number
  quantity: number
  /** Plafond imposé par le stock WooCommerce, absent si le stock n'est pas géré. */
  maxQuantity?: number
  lineTotal: number
  inStock: boolean
}

/** Ligne écartée du total : produit supprimé, épuisé ou non vendable. */
export interface CartIssue {
  id: number
  name?: string
  reason: 'missing' | 'out-of-stock' | 'quantity-adjusted'
  /** Quantité retenue après ajustement au stock disponible. */
  quantity?: number
}

export interface CartCoupon {
  code: string
  /** Libellé lisible : « -10 % » ou « -15,00 $ ». */
  label: string
  discount: number
  description?: string
}

export interface CartTotals {
  /** Somme des lignes au prix courant, avant code avantage. */
  subtotal: number
  /** Économie déjà acquise par les promotions produit. */
  savings: number
  /** Remise apportée par le code avantage. */
  discount: number
  total: number
  /** Nombre d'articles, quantités comprises. */
  count: number
}

/** Réponse de /api/cart : l'état complet et faisant foi du panier. */
export interface CartState {
  lines: CartLine[]
  issues: CartIssue[]
  coupon: CartCoupon | null
  /** Renseigné quand un code a été soumis mais refusé. */
  couponError?: string
  totals: CartTotals
  currency: string
}

/** Corps attendu par /api/cart. */
export interface CartResolveBody {
  items: CartItem[]
  coupon?: string
}
