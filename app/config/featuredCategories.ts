/**
 * Bloc de mise en avant de la page d'accueil : quatre cartes catégorie
 * puis deux panneaux larges. Visuels attendus dans public/images/categories/.
 */
export interface CategoryCard {
  id: string
  to: string
  /** Pastille en haut de carte : « Promo », « N° 1 des ventes »… */
  badge?: string
  image?: string
  /** Bloc tarifaire, optionnel : une carte peut ne porter qu'une offre. */
  fromLabel?: string
  oldPrice?: string
  discount?: string
  price?: string
  /** Accroche affichée en très gros à la place du prix. */
  headline?: string
  title: string
  note?: string
  fineprint?: string
  until?: string
}

export interface CategorySpotlight {
  id: string
  to: string
  ribbon?: string
  title: string
  subtitle?: string
  note?: string
  image?: string
  /** Panneau photo plein cadre avec texte en surimpression. */
  cover?: boolean
}

export const categoryCards: CategoryCard[] = [
  {
    id: 'reprise-batterie',
    to: '/categories/batteries',
    image: '/images/categories/imgdzuvo11.png',
    headline: '15 $',
    title: 'Reprise batterie',
    note: 'offerts en bon d’achat*',
    fineprint: '*voir conditions',
    until: 'pour la reprise de votre ancienne batterie',
  },
  {
    id: 'demarreurs',
    to: '/categories/demarreurs-d-appoint',
    badge: 'Promo',
    image: '/images/categories/imgdzuvo2.png',
    fromLabel: 'À partir de',
    oldPrice: '129,99 $',
    discount: '-30 $',
    price: '99,99 $',
    title: 'Démarreurs d’appoint lithium',
    until: 'Jusqu’au 1er septembre 2026',
  },
  {
    id: 'coffres',
    to: '/categories/coffres-de-toit',
    badge: 'Promo',
    image: '/images/categories/imgdzuvo4.png',
    fromLabel: 'À partir de',
    oldPrice: '209,99 $',
    discount: '-20 $',
    price: '189,99 $',
    title: 'Coffres de toit',
    until: 'Jusqu’au 1er septembre 2026',
  },
  {
    id: 'entretien',
    to: '/categories/entretien',
    badge: 'Promo',
    image: '/images/categories/imgdzuvo5.png',
    headline: 'Jusqu’à -30 %',
    title: 'sur une sélection de produits d’entretien',
    until: 'Jusqu’au 1er septembre 2026',
  },
]

export const categorySpotlights: CategorySpotlight[] = [
  {
    id: 'preparation-hiver',
    to: '/categories/trousse-hiver',
    ribbon: 'Des prix malins pour les grands trajets',
    title: 'Préparation hivernale',
    subtitle: '+ Diagnostic batterie et essuie-glaces',
    note: 'Garantie DZUVO préservée',
    image: '/images/categories/imgdzuvo6.jpg',
  },
  {
    id: 'conseils',
    to: '/blog',
    title: 'Nos conseils et solutions pour rouler l’esprit tranquille',
    subtitle: 'DZUVO augmente votre pouvoir de rouler',
    image: '/images/categories/imgdzuvo66.jpg',
    cover: true,
  },
]
