import { getSessionUser, requireWooForLogin } from '../../utils/auth'

/**
 * Retourne l'utilisateur connecté, ou `null` si la session est absente ou
 * expirée. L'absence de session n'est pas une erreur : le visiteur anonyme est
 * un cas normal, il obtient un 200 avec `user: null`.
 *
 * `no-store` est essentiel : cette réponse nomme une personne. Un cache
 * intermédiaire qui la retiendrait servirait le profil du premier visiteur à
 * tous les suivants.
 */
export default defineEventHandler(async (event) => {
  requireWooForLogin()
  setHeader(event, 'cache-control', 'no-store')

  const user = await getSessionUser(event)
  return { user }
})
