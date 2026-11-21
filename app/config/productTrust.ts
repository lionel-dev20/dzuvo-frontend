/**
 * Éléments de réassurance de la fiche produit.
 *
 * Ce sont des engagements que le site tient déjà ailleurs (pied de page,
 * tunnel de commande, page d'accueil) : les répéter au moment de l'achat
 * rassure sans rien promettre de nouveau. N'ajoutez ici que ce qui est vrai
 * pour **tous** les produits — un délai de retour ou une garantie plus longue
 * qui ne vaudrait que pour certains articles ferait mentir la fiche des autres.
 */

export type TrustIcon = 'lock' | 'truck' | 'shield' | 'chat'

export interface TrustItem {
  icon: TrustIcon
  title: string
  text: string
}

export const trustItems: TrustItem[] = [
  {
    icon: 'lock',
    title: 'Paiement 100 % sécurisé',
    text: 'Données chiffrées, traitées par Stripe.',
  },
  {
    icon: 'truck',
    title: 'Livraison programmée',
    text: 'Partout au Canada, d’une ville à l’autre.',
  },
  {
    icon: 'shield',
    title: 'Garantie DZUVO 2 ans',
    text: 'Chaque produit est testé et garanti.',
  },
  {
    icon: 'chat',
    title: 'Conseillers à l’écoute',
    text: 'Du lundi au samedi, par la page Contact.',
  },
]

/** Cartes acceptées : celles que Stripe traite dans le tunnel de commande. */
export const paymentBrands = ['Visa', 'Mastercard', 'American Express']
