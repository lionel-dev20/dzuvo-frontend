import type { LoginPayload } from '#shared/types/forms'
import { hasErrors, validateLogin } from '#shared/utils/validation'
import {
  authenticate,
  fetchAuthUser,
  requireWooForLogin,
  setAuthCookie,
} from '../../utils/auth'
import { checkRateLimit } from '../../utils/rate-limit'

/**
 * Connexion client via JWT WordPress.
 *
 * La validation est rejouée ici : le client peut être contourné. Le message
 * d'erreur reste volontairement identique que le compte existe ou non, pour ne
 * pas révéler quelles adresses sont enregistrées.
 *
 * Le jeton part dans un cookie httpOnly et n'apparaît jamais dans la réponse :
 * un script tiers ou une extension du navigateur ne peut donc pas le lire, là
 * où un jeton rangé dans `localStorage` s'offrirait à la première faille XSS.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<LoginPayload>(event)

  if (body?.honeypot) {
    return { success: true, message: 'Connexion réussie.' }
  }

  checkRateLimit(event, 'login')

  const errors = validateLogin(body ?? {})
  if (hasErrors(errors)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: errors.email ?? errors.password ?? 'Formulaire invalide.',
      data: { errors },
    })
  }

  requireWooForLogin()

  const token = await authenticate(body.email, body.password)
  setAuthCookie(event, token, body.remember ?? true)

  // Le profil accompagne la réponse : le bandeau affiche le prénom dès la
  // redirection, sans repasser par /api/auth/me.
  const user = await fetchAuthUser(token)
  if (!user) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Erreur d’authentification',
      message: 'La session n’a pas pu être ouverte. Merci de réessayer.',
    })
  }

  return { success: true, message: 'Connexion réussie.', user }
})
