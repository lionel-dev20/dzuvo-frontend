import type { NavItem } from '#shared/types/navigation'
import { wooConfig } from './woocommerce'

/**
 * Menus WordPress.
 *
 * Ils sont servis par le bloc « DZUVO — menus headless » monté en fin de
 * wp-config.php, qui traduit déjà les permaliens WordPress en routes du
 * front : une catégorie WooCommerce arrive en « /categories/slug », pas en
 * « /categorie-produit/slug ».
 *
 * La lecture est publique et non authentifiée : les routes natives
 * /wp/v2/menus exigent une session d'administration, ce qu'un site public ne
 * peut pas fournir.
 */

export interface WpMenuResponse {
  location: string
  assigned: boolean
  items: NavItem[]
}

/** Emplacements déclarés par l'extension. */
export type MenuLocation = 'dzuvo-primary' | 'dzuvo-footer'

/**
 * De quoi traverser les caches intermédiaires.
 *
 * L'hébergement de WordPress répond `Cache-Control: public, max-age=604800` sur
 * *toutes* les adresses, y compris l'API REST : sept jours. Un proxy sur le
 * trajet peut donc servir un menu vieux d'une semaine, et une correction
 * paraîtrait ici sans jamais atteindre le serveur du site.
 *
 * L'en-tête de requête ne suffit pas — beaucoup de caches l'ignorent — d'où
 * l'horodatage, qui rend chaque adresse unique. Ce n'est pas un appel de plus :
 * la réponse est déjà gardée une minute côté site, WordPress voit donc au pire
 * une requête par minute.
 */
export function noCache() {
  return {
    headers: { 'cache-control': 'no-cache' },
    query: { _: Date.now() },
  }
}

export async function fetchWpMenu(location: MenuLocation): Promise<NavItem[] | null> {
  const { baseUrl } = wooConfig()
  if (!baseUrl) return null

  const response = await $fetch<WpMenuResponse>(`${baseUrl}/wp-json/dzuvo/v1/menus/${location}`, {
    // Un menu ne justifie pas de retarder l'affichage de la page.
    timeout: 4000,
    ...noCache(),
  })

  // Emplacement sans menu assigné : ce n'est pas une erreur, mais rien à servir.
  if (!response?.assigned || !response.items?.length) return null

  return sanitize(response.items)
}

/**
 * On ne fait pas confiance à la forme reçue : un menu est saisi à la main dans
 * l'administration, et une entrée mal remplie ne doit pas casser le header.
 */
function sanitize(items: unknown, depth = 0): NavItem[] {
  if (!Array.isArray(items) || depth > 2) return []

  return items
    .filter((item): item is NavItem => Boolean(item && typeof item === 'object'))
    .map((item): NavItem | null => {
      const label = String(item.label ?? '').trim()
      const to = String(item.to ?? '').trim()
      if (!label || !to) return null

      const children = sanitize(item.children, depth + 1)

      return {
        label,
        to,
        ...(item.description ? { description: String(item.description).trim() } : {}),
        ...(item.external ? { external: true } : {}),
        ...(children.length ? { children } : {}),
      }
    })
    .filter((item): item is NavItem => item !== null)
}
