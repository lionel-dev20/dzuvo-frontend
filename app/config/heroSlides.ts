import type { NavItem } from '#shared/types/navigation'

export interface HeroSlide {
  id: string
  /** Surtitre court affiché au-dessus du titre. */
  eyebrow: string
  title: string
  subtitle: string
  /** Le premier CTA est primaire, les suivants secondaires. */
  ctas: NavItem[]
  /**
   * Visuel produit détouré, déposé dans public/images/hero/.
   * Tant que le fichier est absent, le carrousel retombe sur un halo de marque.
   */
  image?: string
}

/**
 * Slide de marque : toujours en tête du carrousel et porteuse du <h1>.
 * Les autres slides sont rendues avec un <p> stylé en titre.
 */
export const brandSlide: HeroSlide = {
  id: 'marque',
  eyebrow: 'DZUVO',
  title: 'Pièces auto et accessoires, livrés partout au Canada',
  subtitle: 'Une seule marque, tous les véhicules. Livraison programmée d’une ville à l’autre.',
  ctas: [
    { label: 'Explorer le catalogue', to: '/categories' },
    { label: 'Espace professionnel', to: '/professionnels' },
  ],
  image: '/images/hero/essuieglasse2.png',
}

/** Slides présentes toute l'année. */
export const evergreenSlides: HeroSlide[] = [
  {
    id: 'gonfleur',
    eyebrow: 'N° 1 des ventes',
    title: 'Ne roulez plus jamais sous-gonflé',
    subtitle: 'Compresseur portatif DZUVO 12 V avec jauge numérique. Pneus d’auto, vélo, VUS — en quelques minutes, où que vous soyez.',
    ctas: [{ label: 'Voir les gonfleurs', to: '/categories/gonfleurs-de-pneus' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'essuie-glaces',
    eyebrow: 'Compatible toutes marques',
    title: 'Des essuie glaces qui s’adaptent à toutes les voitures',
    subtitle: 'Balais toutes saisons DZUVO, conçus pour la pluie, la neige et la gadoue. Installation en 2 minutes, sans outil.',
    ctas: [{ label: 'Trouver ma taille', to: '/categories/essuie-glaces' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'tapis',
    eyebrow: 'Intérieur',
    title: 'Neige, gadoue, calcium votre intérieur reste impeccable',
    subtitle: 'Tapis d’auto toutes saisons à rebords surélevés, ajustables à tout véhicule. Lavables au jet.',
    ctas: [{ label: 'Voir les tapis', to: '/categories/tapis-auto' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'filtres',
    eyebrow: 'Entretien',
    title: 'Un air pur dans l’habitacle, un moteur qui respire',
    subtitle: 'Filtres à air et filtres d’habitacle DZUVO. Remplacez-les vous-même et économisez sur l’entretien.',
    ctas: [{ label: 'Voir les filtres', to: '/categories/filtres' }],
    image: '/images/hero/essuieglasse2.png',
  },
]

/** Mises en avant d'octobre à mars. */
export const winterSlides: HeroSlide[] = [
  {
    id: 'demarreur',
    eyebrow: 'Essentiel de l’hiver',
    title: '–30 °C ? Votre moteur démarre quand même.',
    subtitle: 'Démarreur d’appoint lithium DZUVO : redémarrez seul, sans câbles ni deuxième véhicule. L’indispensable de l’hiver canadien.',
    ctas: [{ label: 'Voir les démarreurs', to: '/categories/demarreurs-d-appoint' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'trousse-hiver',
    eyebrow: 'Trousse d’urgence',
    title: 'L’hiver canadien ne prévient pas. Vous, oui.',
    subtitle: 'Balai à neige, gratte-glace, câbles, couverture : la trousse d’urgence complète DZUVO, prête pour la route.',
    ctas: [{ label: 'Préparer mon hiver', to: '/categories/trousse-hiver' }],
    image: '/images/hero/essuieglasse2.png',
  },
]

/** Prennent la place des slides hiver d'avril à septembre. */
export const summerSlides: HeroSlide[] = [
  {
    id: 'pare-soleil',
    eyebrow: 'Confort d’été',
    title: 'Retrouvez un habitacle frais après chaque arrêt',
    subtitle: 'Pare-soleil pliable DZUVO, ajustable à tout pare-brise. Se range en quelques secondes dans sa housse.',
    ctas: [{ label: 'Voir les pare-soleil', to: '/categories/pare-soleil' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'organisateur-coffre',
    eyebrow: 'Rangement',
    title: 'Un coffre rangé, du premier voyage au dernier',
    subtitle: 'Organisateur de coffre pliable DZUVO à compartiments renforcés. Épicerie, sport, camping : tout reste à sa place.',
    ctas: [{ label: 'Voir les organisateurs', to: '/categories/organisateurs-de-coffre' }],
    image: '/images/hero/essuieglasse2.png',
  },
]

/**
 * Compose le carrousel : la slide de marque ouvre toujours, suivie des deux
 * slides de la saison en cours, puis du reste du catalogue.
 * @param month mois 0-indexé (0 = janvier), tel que renvoyé par Date#getMonth.
 */
export function getHeroSlides(month: number): HeroSlide[] {
  // Octobre (9) à mars (2).
  const isWinter = month >= 9 || month <= 2
  return [brandSlide, ...(isWinter ? winterSlides : summerSlides), ...evergreenSlides]
}
