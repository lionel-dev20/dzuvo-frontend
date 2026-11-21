/**
 * Produits mis en scène sur l'accueil.
 *
 * Mêmes slugs et mêmes prix que `featuredProducts` : la fiche reste la source
 * de vérité, ces valeurs ne servent qu'à l'affichage de la vitrine. Les
 * visuels sont ceux déjà livrés dans `public/images/`.
 */
export interface ShowcaseProduct {
  slug: string
  name: string
  to: string
  image: string
  price: string
  oldPrice?: string
  rating: number
  reviews: number
}

export interface BundleStep {
  id: string
  step: string
  title: string
  pitch: string
  product?: ShowcaseProduct
  /** Rubrique sans produit précis : lien vers la catégorie. */
  category?: { to: string, image: string, note: string, name: string }
}

/**
 * Quatre gestes qui s'enchaînent, chacun réglé par
 * un produit. La corrélation est dans le récit — on ne vend pas quatre
 * articles, on vend une routine sans mauvaise surprise.
 */
export const winterRoutine: BundleStep[] = [
  {
    id: 'demarrer',
    step: '1 · Démarrer',
    title: 'Une batterie qui répond à −25 °C',
    pitch: 'Le froid prend d’abord la batterie. On la remplace avant la panne, et l’ancienne est reprise.',
    category: {
      to: '/categories/batteries',
      image: '/images/categories/imgdzuvo1.png',
      name: 'Batteries de démarrage',
      note: '15 $ offerts en bon d’achat pour la reprise de l’ancienne*',
    },
  },
  {
    id: 'voir',
    step: '2 · Voir',
    title: 'Un pare-brise net dès le premier coup',
    pitch: 'Des balais qui suivent la vitre, même sous la gadoue et le calcium.',
    product: {
      slug: 'essuie-glaces',
      name: 'Balais d’essuie-glace toutes saisons',
      to: '/produits/essuie-glaces',
      image: '/images/hero/essuieglasse2.png',
      price: '29,99 $',
      rating: 4.3,
      reviews: 654,
    },
  },
  {
    id: 'proteger',
    step: '3 · Protéger',
    title: 'Un habitacle qui garde la neige dehors',
    pitch: 'Les rebords surélevés retiennent l’eau de fonte. Un rinçage au jet et c’est fini.',
    product: {
      slug: 'tapis-toutes-saisons',
      name: 'Tapis toutes saisons à rebords, 4 pièces',
      to: '/produits/tapis-toutes-saisons',
      image: '/images/hero/tapisvoiture.png',
      price: '69,99 $',
      oldPrice: '89,99 $',
      rating: 4.5,
      reviews: 321,
    },
  },
  {
    id: 'gonfler',
    step: '4 · Rouler',
    title: 'Des pneus à la bonne pression, chez vous',
    pitch: 'Le froid fait chuter la pression. Dix minutes dans l’entrée, sans monnaie ni file d’attente.',
    product: {
      slug: 'gonfleur-12v',
      name: 'Gonfleur portatif 12 V à jauge numérique',
      to: '/produits/gonfleur-12v',
      image: '/images/hero/media.png',
      price: '49,99 $',
      rating: 4.6,
      reviews: 512,
    },
  },
]
