import type { RegisterPayload } from '#shared/types/forms'
import { hasErrors, validateRegister } from '#shared/utils/validation'
import {
  authenticate,
  registerCustomer,
  requireWooForRegister,
  setAuthCookie,
} from '../../utils/auth'
import { checkRateLimit } from '../../utils/rate-limit'

/** Création de compte client via WooCommerce, puis connexion automatique. */
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

  requireWooForRegister()

  const customer = await registerCustomer({
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    password: body.password,
  })

  // Connexion immédiate : courriel d'abord, puis identifiant WooCommerce si besoin.
  const token = await authenticate(body.email, body.password, customer.username)
  setAuthCookie(event, token, true)

  if (body.newsletter) {
    const config = useRuntimeConfig()
    if (!config.newsletterApiKey && import.meta.dev) {
      console.info('[register] inscription newsletter simulée :', body.email)
    }
    // TODO: brancher le fournisseur newsletter si configuré.
  }

  return { success: true, message: 'Compte créé avec succès.' }
})
