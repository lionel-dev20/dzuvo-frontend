import type { NavItem } from '#shared/types/navigation'
import { cachedWp } from '../utils/wp-cache'
import { fetchWpMenu } from '../utils/wp-menu'

/**
 * Navigation principale du site.
 *
 * WordPress est la seule source. Le menu se gère dans « Apparence > Menus », à
 * l'emplacement « DZUVO — navigation principale ». Rien n'est inventé ici : si
 * l'emplacement est vide ou WordPress muet, la navigation est vide et
 * l'anomalie se voit, plutôt que d'être masquée par des liens de démonstration
 * qui mèneraient vers des pages inexistantes.
 */

interface NavigationResult {
  items: NavItem[]
  /** D'où vient ce menu : utile pour diagnostiquer une configuration. */
  source: 'wordpress' | 'indisponible'
}

/*
 * Un menu change rarement : le relire à chaque page serait un appel réseau de
 * trop sur le chemin critique du rendu. Un échec, lui, ne se garde qu'un
 * instant — le temps d'éviter une rafale d'appels, pas de faire durer la panne.
 *
 * Cinq minutes plutôt qu'une, désormais : ce cache ne se cumule plus avec
 * celui des pages, qui n'existe plus (voir nuxt.config), et WordPress purge
 * lui-même par `/api/revalidate` dès qu'un menu change. Le délai n'est donc
 * plus ce qui décide du temps d'apparition d'une correction — il ne sert qu'à
 * borner le trafic vers WordPress si la purge n'arrive jamais.
 */
export const NAVIGATION_CACHE_KEY = 'navigation'
const TTL = 5 * 60 * 1000
const TTL_ERROR = 15 * 1000

export default defineEventHandler(async (): Promise<NavigationResult> => {
  return cachedWp<NavigationResult>(NAVIGATION_CACHE_KEY, async () => {
    try {
      const items = await fetchWpMenu('dzuvo-primary')
      if (items?.length) return { value: { items, source: 'wordpress' }, isError: false }

      console.warn('[navigation] aucun menu assigné à l’emplacement dzuvo-primary')
    }
    catch (error) {
      // WordPress muet : la page se rend quand même, sans menu.
      console.error('[navigation] menu WordPress indisponible', error)
    }

    return { value: { items: [], source: 'indisponible' }, isError: true }
  }, { ttl: TTL, ttlOnError: TTL_ERROR })
})
