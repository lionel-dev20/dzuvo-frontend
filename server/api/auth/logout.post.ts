import { clearAuthCookie, getAuthToken } from '../../utils/auth'
import { revokeToken } from '../../utils/token-denylist'

/**
 * Déconnexion.
 *
 * Effacer le cookie ne suffisait pas : le JWT reste valide côté WordPress
 * jusqu'à son échéance, sept jours plus tard. Un jeton dérobé survivait donc à
 * toutes les déconnexions, et le visiteur qui cliquait « Se déconnecter » sur
 * un poste partagé n'obtenait pas ce qu'il croyait.
 *
 * Le jeton est désormais révoqué avant que le cookie ne soit retiré — dans cet
 * ordre, puisqu'il faut encore pouvoir le lire.
 */
export default defineEventHandler((event) => {
  const token = getAuthToken(event)
  if (token) revokeToken(token)

  clearAuthCookie(event)
  return { success: true, message: 'Déconnexion réussie.' }
})
