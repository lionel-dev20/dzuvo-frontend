import type { NavItem } from '#shared/types/navigation'

/**
 * Navigation du site, servie par /api/navigation — donc par WordPress.
 *
 * L'appel est mutualisé : header et menu mobile partagent la même donnée, et
 * elle voyage dans la charge utile du rendu serveur plutôt que d'être
 * redemandée à l'hydratation.
 */
export function useNavigation() {
  const { data } = useFetch<{ items: NavItem[], source: string }>('/api/navigation', {
    key: 'site-navigation',
    default: () => ({ items: [], source: 'indisponible' }),
    // La navigation ne dépend d'aucun paramètre : une seule requête par rendu.
    dedupe: 'defer',
  })

  const items = computed(() => data.value?.items ?? [])

  return { items, source: computed(() => data.value?.source) }
}
