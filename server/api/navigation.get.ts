import type { NavItem } from '#shared/types/navigation'
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

/* Un menu change rarement : le relire à chaque page serait un appel réseau de
   trop sur le chemin critique du rendu. Un échec, lui, ne se garde qu'un
   instant — le temps d'éviter une rafale d'appels, pas de faire durer la
   panne. */
const cache = { value: null as NavigationResult | null, expiresAt: 0 }
const TTL = 5 * 60 * 1000
const TTL_ERROR = 15 * 1000

export default defineEventHandler(async (): Promise<NavigationResult> => {
  if (cache.value && cache.expiresAt > Date.now()) return cache.value

  let result: NavigationResult = { items: [], source: 'indisponible' }

  try {
    const items = await fetchWpMenu('dzuvo-primary')
    if (items?.length) result = { items, source: 'wordpress' }
    else console.warn('[navigation] aucun menu assigné à l’emplacement dzuvo-primary')
  }
  catch (error) {
    // WordPress muet : la page se rend quand même, sans menu.
    console.error('[navigation] menu WordPress indisponible', error)
  }

  cache.value = result
  cache.expiresAt = Date.now() + (result.source === 'wordpress' ? TTL : TTL_ERROR)
  return result
})
