import type { HomeOffer, HomeSpotlight } from '#shared/types/home'

/**
 * Bloc de mise en avant de la page d'accueil : quatre cartes catégorie
 * puis deux panneaux larges. Visuels attendus dans public/images/categories/.
 *
 * Contenu livré avec le site, servant de repli : dès que des offres sont
 * publiées dans WordPress, ce sont elles qui s'affichent. Les formes sont
 * décrites une seule fois, dans `#shared/types/home` — les deux sources
 * doivent rester interchangeables au champ près.
 */
export type CategoryCard = HomeOffer
export type CategorySpotlight = HomeSpotlight

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
