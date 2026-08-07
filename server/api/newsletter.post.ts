import type { NewsletterPayload } from '#shared/types/forms'
import { hasErrors, validateNewsletter } from '#shared/utils/validation'
import { checkRateLimit } from '../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const body = await readBody<NewsletterPayload>(event)

  if (body?.honeypot) {
    return { success: true, message: 'Merci, votre inscription est enregistrée.' }
  }

  checkRateLimit(event, 'newsletter')

  const errors = validateNewsletter(body ?? {})
  if (hasErrors(errors)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: errors.email ?? errors.consent ?? 'Formulaire invalide.',
      data: { errors },
    })
  }

  const config = useRuntimeConfig()

  // TODO: brancher le fournisseur d'emailing (Brevo, Mailchimp, Resend…).
  // Exemple :
  // await $fetch(`${config.newsletterApiUrl}/contacts`, {
  //   method: 'POST',
  //   headers: { 'api-key': config.newsletterApiKey },
  //   body: { email: body.email, listIds: [Number(config.newsletterListId)] },
  // })
  if (!config.newsletterApiKey && import.meta.dev) {
    console.info('[newsletter] inscription simulée :', body.email)
  }

  return { success: true, message: 'Merci ! Vérifiez votre boîte mail pour confirmer votre inscription.' }
})
