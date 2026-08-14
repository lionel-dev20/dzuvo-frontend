import type {
  HomeBanner,
  HomeOffer,
  HomeSettings,
  HomeSlide,
  HomeSpotlight,
  HomeTestimonial,
  SlideSeason,
  WpHomePayload,
} from '#shared/types/home'
import type { NavItem } from '#shared/types/navigation'
import { wooConfig } from './woocommerce'

/**
 * Contenu de la page d'accueil, lu dans WordPress.
 *
 * Il est servi par l'extension « DZUVO — page d'accueil »
 * (wp-content/mu-plugins/dzuvo-home/), en une seule requête : la page s'affiche
 * d'un bloc, la découper par section multiplierait les allers-retours sur le
 * chemin critique du rendu.
 *
 * Comme pour les menus, rien de ce qui arrive n'est cru sur parole. Ce contenu
 * est saisi à la main dans une administration : une fiche à moitié remplie ne
 * doit pas vider la page d'accueil, elle doit seulement disparaître de la
 * section qu'elle occupait.
 */

const SEASONS: SlideSeason[] = ['brand', 'always', 'winter', 'summer']

export async function fetchWpHome(): Promise<WpHomePayload | null> {
  const { baseUrl } = wooConfig()
  if (!baseUrl) return null

  const raw = await $fetch<Record<string, unknown>>(`${baseUrl}/wp-json/dzuvo/v1/home`, {
    // Un peu plus généreux que pour le menu : la réponse porte neuf sections,
    // et elle n'est demandée qu'une fois toutes les cinq minutes.
    timeout: 6000,
  })

  if (!raw || typeof raw !== 'object') return null

  return {
    slides: array(raw.slides).map(slide).filter(present),
    offers: array(raw.offers).map(offer).filter(present),
    spotlights: array(raw.spotlights).map(spotlight).filter(present),
    banners: array(raw.banners).map(banner).filter(present),
    testimonials: {
      top: array(record(raw.testimonials).top).map(testimonial).filter(present),
      bottom: array(record(raw.testimonials).bottom).map(testimonial).filter(present),
    },
    settings: settings(raw.settings),
    productIds: productIds(raw.productIds),
  }
}

/* ---------- Lecture défensive ---------- */

function array(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

/** Chaîne nettoyée, ou chaîne vide. */
function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

/**
 * Champ facultatif : absent plutôt que vide.
 *
 * Les composants testent la présence d'une clé pour décider d'afficher une
 * pastille ou un prix ; une chaîne vide y ferait apparaître un cadre sans
 * contenu.
 */
function optional<T extends object>(target: T, key: keyof T & string, value: unknown) {
  const cleaned = text(value)
  if (cleaned) (target as Record<string, unknown>)[key] = cleaned
}

function number(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(text(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

function present<T>(value: T | null): value is T {
  return value !== null
}

/* ---------- Une fonction par section ---------- */

function slide(raw: Record<string, unknown>): HomeSlide | null {
  const title = text(raw.title)
  if (!title) return null

  const season = text(raw.season) as SlideSeason
  const ctas: NavItem[] = array(raw.ctas)
    .map((cta) => {
      const label = text(cta.label)
      const to = text(cta.to)
      return label && to ? { label, to } : null
    })
    .filter(present)

  const result: HomeSlide = {
    id: text(raw.id) || title,
    eyebrow: text(raw.eyebrow),
    title,
    subtitle: text(raw.subtitle),
    season: SEASONS.includes(season) ? season : 'always',
    ctas,
  }

  optional(result, 'image', raw.image)
  return result
}

function offer(raw: Record<string, unknown>): HomeOffer | null {
  const title = text(raw.title)
  if (!title) return null

  const result: HomeOffer = { id: text(raw.id) || title, title }

  for (const key of ['to', 'badge', 'image', 'fromLabel', 'oldPrice', 'discount', 'price', 'headline', 'note', 'fineprint', 'until'] as const) {
    optional(result, key, raw[key])
  }

  return result
}

function spotlight(raw: Record<string, unknown>): HomeSpotlight | null {
  const title = text(raw.title)
  if (!title) return null

  const result: HomeSpotlight = { id: text(raw.id) || title, title }

  for (const key of ['to', 'ribbon', 'subtitle', 'note', 'image'] as const) {
    optional(result, key, raw[key])
  }
  if (raw.cover === true) result.cover = true

  return result
}

/** Une bannière sans image n'a rien à montrer : ce bloc n'est qu'une photo. */
function banner(raw: Record<string, unknown>): HomeBanner | null {
  const image = text(raw.image)
  const label = text(raw.label)
  if (!image || !label) return null

  return {
    id: text(raw.id) || label,
    label,
    to: text(raw.to) || '/',
    image,
    alt: text(raw.alt) || label,
  }
}

function testimonial(raw: Record<string, unknown>): HomeTestimonial | null {
  const quote = text(raw.quote)
  const author = text(raw.author)
  if (!quote || !author) return null

  const rating = Math.round(number(raw.rating, 5))

  return {
    id: text(raw.id) || author,
    quote,
    author,
    city: text(raw.city),
    rating: rating >= 1 && rating <= 5 ? rating : 5,
  }
}

/**
 * Identifiants des produits mis en avant.
 *
 * Les doublons sont écartés : le même produit deux fois dans le carrousel
 * ferait deux cartes identiques, et le second exemplaire volerait sa place à
 * un autre.
 */
function productIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  const ids = value
    .map(id => Math.trunc(number(id, 0)))
    .filter(id => id > 0)

  return [...new Set(ids)]
}

/**
 * Titres et textes.
 *
 * Seules les clés attendues sont reprises, et seulement si elles portent
 * quelque chose : une clé vide effacerait le texte livré avec le site, alors
 * qu'un champ laissé vide dans l'administration veut dire « ne pas y toucher ».
 */
function settings(raw: unknown): HomeSettings {
  const source = record(raw)
  const result: HomeSettings = {}

  const strings: (keyof HomeSettings)[] = [
    'partRequestTitle', 'partRequestIntro',
    'partRequestShortcut1Title', 'partRequestShortcut1Note', 'partRequestShortcut1To',
    'partRequestShortcut2Title', 'partRequestShortcut2Note', 'partRequestShortcut2To',
    'videoSrc', 'videoTitle', 'videoTitleAccent',
    'keyPoint1Title', 'keyPoint1Text',
    'keyPoint2Title', 'keyPoint2Text',
    'keyPoint3Title', 'keyPoint3Text',
    'offersTitle', 'productsTitle',
    'mapTitleTop', 'mapTitleBottom', 'mapCounterTitle', 'mapCounterText',
    'testimonialsTitleTop', 'testimonialsTitleBottom', 'testimonialsIntro',
  ]

  for (const key of strings) {
    const value = text(source[key])
    if (value) (result as Record<string, unknown>)[key] = value
  }

  const counter = Math.trunc(number(source.mapCounterValue, 0))
  if (counter > 0) result.mapCounterValue = counter

  return result
}
