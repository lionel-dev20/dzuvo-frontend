import { getSessionUser, requireWooForLogin } from '../../utils/auth'

/** Retourne l'utilisateur connecté, ou null si la session est absente ou expirée. */
export default defineEventHandler(async (event) => {
  requireWooForLogin()

  const user = await getSessionUser(event)
  return { user }
})
