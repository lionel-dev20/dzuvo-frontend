import type { LoginPayload } from '#shared/types/forms'
import { hasErrors, validateLogin } from '#shared/utils/validation'
import {
  authenticate,
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

  return { success: true, message: 'Connexion réussie.' }
})
