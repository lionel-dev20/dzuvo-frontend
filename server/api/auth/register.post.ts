import type { RegisterPayload } from '#shared/types/forms'
import { hasErrors, validateRegister } from '#shared/utils/validation'
import { checkRateLimit } from '../../utils/rate-limit'

/** Création de compte client. */
export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterPayload>(event)

  if (body?.honeypot) {
    return { success: true, message: 'Compte créé.' }
  }

  checkRateLimit(event, 'register')

  const errors = validateRegister(body ?? {})
  if (hasErrors(errors)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: Object.values(errors)[0] ?? 'Formulaire invalide.',
      data: { errors },
    })
  }

  // TODO: créer le client dans WooCommerce (POST /wp-json/wc/v3/customers),
  // puis enchaîner sur la connexion pour éviter une double saisie.

  throw createError({
    statusCode: 501,
    statusMessage: 'Création de compte non configurée',
    message: 'La création de compte sera disponible à l’ouverture de la boutique.',
  })
})
