import type { CatalogProduct } from '#shared/types/catalog'
import type { HomeContent } from '#shared/types/home'
import { fetchWpHome } from '../utils/wp-home'
import { fetchProductsByIds, isConfigured } from '../utils/woocommerce'

/**
 * Contenu de la page d'accueil.
 *
 * Contrairement au menu, une absence de réponse n'est pas laissée visible : la
 * page d'accueil garde alors le contenu livré avec le site (`app/config/`).
 * Une navigation vide se remarque et se répare ; une page d'accueil vide fait
 * fuir le visiteur, et rien ne dit que la panne vient de WordPress plutôt que
 * du site lui-même.
 *
 * Le repli est décidé section par section, côté navigateur, dans
 * `useHomeContent()` : une boutique qui n'a saisi que son carrousel garde ainsi
 * le reste de la page, au lieu de devoir tout reprendre d'un coup.
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

/* Mêmes durées que la navigation : un contenu servi vaut une minute, un échec
   quinze secondes — le temps d'éviter une rafale d'appels, pas de faire durer
   la panne. Une minute parce que ce cache s'ajoute à celui de la page elle-même
   (`swr` dans nuxt.config) : deux caches de cinq minutes se cumuleraient. */
const cache = { value: null as HomeContent | null, expiresAt: 0 }
const TTL = 60 * 1000
const TTL_ERROR = 15 * 1000

export default defineEventHandler(async (): Promise<HomeContent> => {
  if (cache.value && cache.expiresAt > Date.now()) return cache.value

  let result: HomeContent = EMPTY

  try {
    const content = await fetchWpHome()

    if (content) {
      const { productIds, ...sections } = content
      result = { ...sections, products: await resolveProducts(productIds), source: 'wordpress' }
    }
  }
  catch (error) {
    // WordPress muet : la page se rend avec le contenu livré avec le site.
    console.error('[home] contenu WordPress indisponible', error)
  }

  cache.value = result
  cache.expiresAt = Date.now() + (result.source === 'wordpress' ? TTL : TTL_ERROR)
  return result
})

/**
 * Traduit les identifiants choisis dans WordPress en produits du catalogue.
 *
 * Le passage par `fetchProductsByIds` n'est pas un détour : c'est la même
 * fonction qui sert les fiches produit et les ventes croisées. Le carrousel
 * affiche donc les mêmes prix que le reste du site, et ses produits sont
 * ajoutables au panier tels quels.
 *
 * Un échec ici ne fait pas tomber le reste : le carrousel reprend la sélection
 * livrée avec le site, les autres sections gardent leur contenu WordPress.
 */
async function resolveProducts(ids: number[]): Promise<CatalogProduct[]> {
  if (!ids.length || !isConfigured()) return []

  try {
    const products = await fetchProductsByIds(ids)

    // WooCommerce répond dans son propre ordre : on rétablit celui choisi dans
    // l'administration, qui est celui du carrousel.
    const byId = new Map(products.map(product => [product.id, product]))

    return ids
      .map(id => byId.get(id))
      .filter((product): product is CatalogProduct => Boolean(product))
  }
  catch (error) {
    console.error('[home] produits mis en avant illisibles', error)
    return []
  }
}
