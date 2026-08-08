import { clearAuthCookie } from '../../utils/auth'

/** Déconnexion : supprime le jeton httpOnly. */
export default defineEventHandler((event) => {
  clearAuthCookie(event)
  return { success: true, message: 'Déconnexion réussie.' }
})
