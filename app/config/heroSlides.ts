import type { HomeSlide } from '#shared/types/home'

/**
 * Carrousel de la page d'accueil — contenu livré avec le site.
 *
 * Il sert de repli : dès que des slides sont publiées dans WordPress
 * (« Page d'accueil > Carrousel principal »), ce sont elles qui s'affichent.
 * Ce fichier reste la version de secours, celle qui garantit qu'une page
 * d'accueil s'affiche même sans WordPress.
 *
 * La composition, elle, est commune aux deux sources : `composeHeroSlides()`.
 */

export type HeroSlide = HomeSlide

/**
 * Slide de marque : toujours en tête du carrousel et porteuse du <h1>.
 * Les autres slides sont rendues avec un <p> stylé en titre.
 */
export const brandSlide: HeroSlide = {
  id: 'marque',
  season: 'brand',
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
    season: 'always',
    eyebrow: 'N° 1 des ventes',
    title: 'Ne roulez plus jamais sous-gonflé',
    subtitle: 'Compresseur portatif DZUVO 12 V avec jauge numérique. Pneus d’auto, vélo, VUS — en quelques minutes, où que vous soyez.',
    ctas: [{ label: 'Voir les gonfleurs', to: '/categories/gonfleurs-de-pneus' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'essuie-glaces',
    season: 'always',
    eyebrow: 'Compatible toutes marques',
    title: 'Des essuie glaces qui s’adaptent à toutes les voitures',
    subtitle: 'Balais toutes saisons DZUVO, conçus pour la pluie, la neige et la gadoue. Installation en 2 minutes, sans outil.',
    ctas: [{ label: 'Trouver ma taille', to: '/categories/essuie-glaces' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'tapis',
    season: 'always',
    eyebrow: 'Intérieur',
    title: 'Neige, gadoue, calcium votre intérieur reste impeccable',
    subtitle: 'Tapis d’auto toutes saisons à rebords surélevés, ajustables à tout véhicule. Lavables au jet.',
    ctas: [{ label: 'Voir les tapis', to: '/categories/tapis-auto' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'filtres',
    season: 'always',
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
    season: 'winter',
    eyebrow: 'Essentiel de l’hiver',
    title: '–30 °C ? Votre moteur démarre quand même.',
    subtitle: 'Démarreur d’appoint lithium DZUVO : redémarrez seul, sans câbles ni deuxième véhicule. L’indispensable de l’hiver canadien.',
    ctas: [{ label: 'Voir les démarreurs', to: '/categories/demarreurs-d-appoint' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'trousse-hiver',
    season: 'winter',
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
    season: 'summer',
    eyebrow: 'Confort d’été',
    title: 'Retrouvez un habitacle frais après chaque arrêt',
    subtitle: 'Pare-soleil pliable DZUVO, ajustable à tout pare-brise. Se range en quelques secondes dans sa housse.',
    ctas: [{ label: 'Voir les pare-soleil', to: '/categories/pare-soleil' }],
    image: '/images/hero/essuieglasse2.png',
  },
  {
    id: 'organisateur-coffre',
    season: 'summer',
    eyebrow: 'Rangement',
    title: 'Un coffre rangé, du premier voyage au dernier',
    subtitle: 'Organisateur de coffre pliable DZUVO à compartiments renforcés. Épicerie, sport, camping : tout reste à sa place.',
    ctas: [{ label: 'Voir les organisateurs', to: '/categories/organisateurs-de-coffre' }],
    image: '/images/hero/essuieglasse2.png',
  },
]

/** Toutes les slides livrées, saisons confondues. */
export const fallbackSlides: HeroSlide[] = [
  brandSlide,
  ...winterSlides,
  ...summerSlides,
  ...evergreenSlides,
]

/**
 * Compose le carrousel : la slide de marque ouvre toujours, suivie des slides
 * de la saison en cours, puis de celles présentes toute l'année.
 *
 * Le tri se fait ici, et non dans WordPress, parce que la réponse de WordPress
 * est gardée en mémoire quelques minutes : une saison calculée à l'avance y
 * resterait figée, et une slide d'hiver pourrait s'afficher un 2 avril.
 *
 * @param slides toutes les slides disponibles, quelle que soit leur saison.
 * @param month  mois 0-indexé (0 = janvier), tel que renvoyé par Date#getMonth.
 */
export function composeHeroSlides(slides: readonly HeroSlide[], month: number): HeroSlide[] {
  // Octobre (9) à mars (2).
  const season = month >= 9 || month <= 2 ? 'winter' : 'summer'

  const brand = slides.filter(slide => slide.season === 'brand')
  const composed = [
    ...brand,
    ...slides.filter(slide => slide.season === season),
    ...slides.filter(slide => slide.season === 'always'),
  ]

  /*
   * Aucune slide de marque : la première prend ce rôle. Sans cela, la page
   * d'accueil n'aurait pas de <h1> — un oubli dans l'administration coûterait
   * son titre principal à la page la plus visitée du site.
   */
  if (!brand.length && composed[0]) {
    composed[0] = { ...composed[0], season: 'brand' }
  }

  return composed
}

/** Carrousel de secours, celui livré avec le site. */
export function getHeroSlides(month: number): HeroSlide[] {
  return composeHeroSlides(fallbackSlides, month)
}
