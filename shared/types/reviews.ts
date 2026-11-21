/**
 * Avis clients d'un produit.
 *
 * Ils sont saisis dans WooCommerce (Produits > Avis) : le site les lit et en
 * dépose de nouveaux, qui attendent la validation de la boutique avant de
 * paraître. L'adresse courriel de l'auteur n'est jamais renvoyée au navigateur.
 */

export interface ProductReview {
  id: number
  author: string
  rating: number
  /** Date ISO. */
  date: string
  content: string
  /** Achat vérifié par WooCommerce. */
  verified: boolean
}

export interface ReviewsResult {
  items: ProductReview[]
  total: number
  average: number
  /** Nombre d'avis par note, de 5 à 1. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface ReviewPayload {
  productId: number
  name: string
  email: string
  rating: number
  comment: string
  /** Champ piège anti-spam : doit rester vide. */
  honeypot?: string
}

export const REVIEW_COMMENT_MIN = 10
export const REVIEW_COMMENT_MAX = 1500
