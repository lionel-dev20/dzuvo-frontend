import type { CatalogProduct } from '#shared/types/catalog'
import type { NavItem } from '#shared/types/navigation'

/**
 * Contenu de la page d'accueil servi par WordPress.
 *
 * Ces formes reprennent celles des fichiers de `app/config/` : le site sait
 * déjà les afficher, et le contenu venu de WordPress prend simplement leur
 * place. C'est ce qui permet au repli — la version livrée avec le site — de
 * rester exact au champ près.
 *
 * Vit dans `shared/` parce que le serveur en a besoin : c'est lui qui lit
 * WordPress et vérifie la forme reçue avant de la servir au navigateur.
 */

/** Période d'affichage d'une slide. `brand` porte le titre principal (h1). */
export type SlideSeason = 'brand' | 'always' | 'winter' | 'summer'

export interface HomeSlide {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  season: SlideSeason
  ctas: NavItem[]
  image?: string
}

/** Carte promotionnelle de la section « Nos offres du moment ». */
export interface HomeOffer {
  id: string
  title: string
  to?: string
  badge?: string
  image?: string
  fromLabel?: string
  oldPrice?: string
  discount?: string
  price?: string
  headline?: string
  note?: string
  fineprint?: string
  until?: string
}

/** Panneau large qui ferme la section des offres. */
export interface HomeSpotlight {
  id: string
  title: string
  to?: string
  ribbon?: string
  subtitle?: string
  note?: string
  image?: string
  cover?: boolean
}

export interface HomeBanner {
  id: string
  label: string
  to: string
  image: string
  alt: string
}

export interface HomeTestimonial {
  id: string
  quote: string
  author: string
  city: string
  rating: number
}

/**
 * Titres et textes fixes des sections.
 *
 * Toutes les clés sont facultatives : une clé absente veut dire « garder le
 * texte livré avec le site », ce qui évite qu'un champ laissé vide dans
 * l'administration efface un titre.
 */
export interface HomeSettings {
  partRequestTitle?: string
  partRequestIntro?: string
  partRequestShortcut1Title?: string
  partRequestShortcut1Note?: string
  partRequestShortcut1To?: string
  partRequestShortcut2Title?: string
  partRequestShortcut2Note?: string
  partRequestShortcut2To?: string
  videoSrc?: string
  videoTitle?: string
  videoTitleAccent?: string
  keyPoint1Title?: string
  keyPoint1Text?: string
  keyPoint2Title?: string
  keyPoint2Text?: string
  keyPoint3Title?: string
  keyPoint3Text?: string
  offersTitle?: string
  productsTitle?: string
  mapTitleTop?: string
  mapTitleBottom?: string
  mapCounterTitle?: string
  mapCounterText?: string
  mapCounterValue?: number
  testimonialsTitleTop?: string
  testimonialsTitleBottom?: string
  testimonialsIntro?: string
}

/** Ce que WordPress renvoie, tel quel. */
export interface WpHomePayload {
  slides: HomeSlide[]
  offers: HomeOffer[]
  spotlights: HomeSpotlight[]
  banners: HomeBanner[]
  testimonials: { top: HomeTestimonial[], bottom: HomeTestimonial[] }
  settings: HomeSettings
  /**
   * Produits du carrousel — des identifiants, rien de plus.
   *
   * WordPress choisit *lesquels*, la couche catalogue dit *ce qu'ils sont* :
   * nom, prix, promotion et stock arrivent par le même chemin que les fiches
   * produit et le panier. Un prix ne peut donc pas différer d'une page à
   * l'autre, et le carrousel sait enfin ajouter au panier.
   */
  productIds: number[]
}

/** Ce que le site consomme, une fois les produits résolus. */
export interface HomeContent extends Omit<WpHomePayload, 'productIds'> {
  products: CatalogProduct[]
  /** D'où vient ce contenu : utile pour diagnostiquer une configuration. */
  source: 'wordpress' | 'indisponible'
}
