import type { ContactPayload } from '#shared/types/forms'
import { hasErrors, validateContact } from '#shared/utils/validation'
import { sendMail } from '../utils/mail'
import { checkRateLimit } from '../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const body = await readBody<ContactPayload>(event)

  // Le honeypot est invisible pour un humain : s'il est rempli, c'est un bot.
  // On répond succès pour ne pas informer le robot qu'il a été détecté.
  if (body?.honeypot) {
    return { success: true, message: 'Merci, votre message a bien été envoyé.' }
  }

  checkRateLimit(event, 'contact')

  const errors = validateContact(body ?? {})
  if (hasErrors(errors)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: 'Merci de corriger les champs signalés.',
      data: { errors },
    })
  }

  const config = useRuntimeConfig()

  await sendMail({
    to: config.contactRecipient,
    replyTo: body.email,
    subject: `[Contact] ${body.subject} — ${body.firstName} ${body.lastName}`,
    text: [
      `Nom : ${body.firstName} ${body.lastName}`,
      `Email : ${body.email}`,
      `Téléphone : ${body.phone || '—'}`,
      `Entreprise : ${body.company || '—'}`,
      `Sujet : ${body.subject}`,
      '',
      body.message,
    ].join('\n'),
  })

  return { success: true, message: 'Merci, votre message a bien été envoyé. Nous revenons vers vous sous 24 h ouvrées.' }
})
