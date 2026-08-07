import type { NavItem } from '#shared/types/navigation'

/** Colonnes de liens du pied de page. */
export interface FooterColumn {
  id: string
  title: string
  items: NavItem[]
}

export const footerColumns: FooterColumn[] = [
  {
    id: 'achats',
    title: 'Mes achats',
    items: [
      { label: 'Suivi de commande', to: '/suivi-commande' },
      { label: 'Livraisons & retours', to: '/livraison' },
      { label: 'Modes de paiement', to: '/paiement' },
      { label: 'Programme de fidélité', to: '/fidelite' },
      { label: 'Donner mon avis', to: '/avis' },
    ],
  },
  {
    id: 'informations',
    title: 'Informations',
    items: [
      { label: 'Actualités', to: '/actualites' },
      { label: 'Politique de confidentialité', to: '/legal/politique-de-confidentialite' },
      { label: 'Mentions légales', to: '/legal/mentions-legales' },
      { label: 'Conditions générales de vente', to: '/legal/conditions-generales' },
      { label: 'Échange de pièce consignée', to: '/consigne' },
      { label: 'Sécurité des produits & rappels', to: '/securite-produits' },
      { label: 'Code de conduite', to: '/legal/code-de-conduite' },
    ],
  },
]

/** Réseaux sociaux — URL à confirmer avant mise en ligne. */
export const socialLinks = [
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/dzuvo' },
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/dzuvo' },
  { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@dzuvo' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@dzuvo' },
]
