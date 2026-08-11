/**
 * Modèle du tunnel de commande, partagé client et serveur.
 *
 * Comme pour le panier, rien de monétaire ne vient du client : l'adresse et
 * le choix de livraison sont les seules données transmises, le montant est
 * toujours celui que le serveur a calculé.
 */

/**
 * Adresse saisie au formulaire. Les champs facultatifs restent des chaînes,
 * vides le cas échéant : le formulaire les fournit toujours, et un modèle
 * qui peut valoir `undefined` complique `v-model` pour rien.
 */
export interface CheckoutAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address1: string
  /** Appartement, bureau, étage. Facultatif. */
  address2: string
  city: string
  /**
   * Quartier ou arrondissement, choisi parmi ceux de la ville. Vide quand la
   * ville saisie n'est pas une ville desservie — il n'y a alors rien à
   * proposer, et rien à exiger.
   */
  district: string
  /** Code de province canadienne : QC, ON, AB… */
  state: string
  postcode: string
  /** Facultatif. */
  company: string
}

export interface CheckoutPayload {
  address: CheckoutAddress
  /** Identifiant de la méthode de livraison retenue. */
  shipping: string
  /** Adresse de facturation distincte, si le visiteur en saisit une. */
  billing?: CheckoutAddress
  /** Consigne de livraison, reprise dans la commande WooCommerce. */
  note?: string
  /** Champ piège anti-spam : doit rester vide. */
  honeypot?: string
}

export interface ShippingMethod {
  id: string
  label: string
  description: string
  cost: number
}

/** Ce que renvoie la création de commande, avant paiement. */
export interface CheckoutSession {
  orderId: number
  orderKey: string
  /** Secret de confirmation Stripe, consommé par Elements côté navigateur. */
  clientSecret: string
  /** Total réellement facturé, en dollars. */
  total: number
  currency: string
}

/** Commande finalisée, telle que présentée sur la page de confirmation. */
export interface OrderSummary {
  id: number
  number: string
  status: string
  paid: boolean
  total: number
  subtotal: number
  shippingTotal: number
  discountTotal: number
  currency: string
  email: string
  lines: { name: string, quantity: number, total: number }[]
  shippingAddress: string
  shippingLabel: string
}
