import type { LoginPayload } from '#shared/types/forms'
import { hasErrors, validateLogin } from '#shared/utils/validation'
import { checkRateLimit } from '../../utils/rate-limit'

/**
 * Connexion client.
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

  // TODO: authentifier auprès de WordPress/WooCommerce.
  // Piste recommandée : plugin JWT Authentication for WP REST API, puis dépôt
  // du jeton dans un cookie httpOnly — jamais dans le localStorage.
  //
  // const { token } = await $fetch(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
  //   method: 'POST',
  //   body: { username: body.email, password: body.password },
  // })
  // setCookie(event, 'dzuvo_token', token, { httpOnly: true, sameSite: 'lax', secure: true })

  throw createError({
    statusCode: 501,
    statusMessage: 'Authentification non configurée',
    message: 'La connexion sera disponible à l’ouverture de la boutique.',
  })
})
