import type { CatalogProduct } from '#shared/types/catalog'
import type { HomeContent, HomeSettings } from '#shared/types/home'
import type { Product } from '~/config/products'
import { formatPrice } from '#shared/utils/format'

/**
 * Contenu de la page d'accueil, WordPress d'abord, contenu livré ensuite.
 *
 * Le repli se décide **section par section** : une boutique qui n'a saisi que
 * son carrousel garde le reste de la page telle qu'elle a été livrée, au lieu
 * de devoir tout reprendre d'un coup pour ne rien perdre. C'est aussi ce qui
 * rend la reprise progressive : on remplit une section, on la voit changer, on
 * passe à la suivante.
 *
 * Une seule requête sert toute la page : les neuf sections appellent ce
 * composable, et la clé partagée fait que Nuxt ne la joue qu'une fois.
 */

const EMPTY: HomeContent = {
  slides: [],
  offers: [],
  spotlights: [],
  banners: [],
  products: [],
  testimonials: { top: [], bottom: [] },
  settings: {},
  source: 'indisponible',
}

export function useHomeContent() {
  const { data } = useFetch<HomeContent>('/api/home', {
    key: 'home-content',
    default: () => EMPTY,
    // Le contenu est le même pour tout le monde : inutile de le redemander en
    // arrivant sur l'accueil depuis une autre page, la charge utile du rendu
    // serveur fait déjà foi.
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })

  const content = computed(() => data.value ?? EMPTY)

  /**
   * Liste venue de WordPress, ou celle livrée avec le site.
   *
   * Une section vide côté WordPress n'est jamais servie telle quelle : cela
   * voudrait dire afficher un trou dans la page à la moindre fiche dépubliée.
   */
  function list<T>(pick: (c: HomeContent) => readonly T[], fallback: readonly T[]) {
    return computed<readonly T[]>(() => {
      const items = pick(content.value)
      return items.length ? items : fallback
    })
  }

  /** Texte réglé dans l'administration, ou celui livré avec le site. */
  function text(key: keyof HomeSettings, fallback: string) {
    return computed(() => {
      const value = content.value.settings[key]
      return typeof value === 'string' && value ? value : fallback
    })
  }

  /** Nombre réglé dans l'administration, ou celui livré avec le site. */
  function count(key: keyof HomeSettings, fallback: number) {
    return computed(() => {
      const value = content.value.settings[key]
      return typeof value === 'number' && Number.isFinite(value) ? value : fallback
    })
  }

  return { content, list, text, count }
}

/**
 * Produit du carrousel : de quoi l'afficher, et de quoi l'acheter.
 *
 * Le carrousel a été écrit autour de prix déjà mis en forme (« 49,99 $ »),
 * alors que le catalogue manipule des nombres. On adapte donc ici, en gardant
 * le produit d'origine sous le coude : c'est lui, et lui seul, que le panier
 * sait accepter.
 */
export interface CarouselProduct extends Product {
  catalog?: CatalogProduct
}

export function toCarouselProduct(product: CatalogProduct): CarouselProduct {
  const regular = product.regularPrice
  const discounted = regular !== undefined && regular > product.price

  return {
    id: product.slug,
    wooId: product.id,
    name: product.name,
    to: `/produits/${product.slug}`,
    image: product.images[0]?.src,
    // Le badge saisi dans WooCommerce prime ; à défaut, la promotion parle
    // d'elle-même.
    badge: product.badge ?? (product.onSale ? 'Promo' : undefined),
    rating: product.rating,
    reviews: product.reviews,
    availability: product.stockLabel,
    inStock: product.inStock,
    /* Un produit à déclinaisons ne s'ajoute pas au panier tel quel : il faut
       d'abord choisir une variation sur sa fiche. */
    purchasable: product.purchasable !== false && !product.variable,
    price: formatPrice(product.price),
    ...(discounted
      ? {
          oldPrice: formatPrice(regular),
          discount: `-${formatPrice(regular - product.price)}`,
        }
      : {}),
    catalog: product,
  }
}
