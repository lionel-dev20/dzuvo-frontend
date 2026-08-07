interface MailOptions {
  to: string
  subject: string
  text: string
  replyTo?: string
}

/**
 * Point d'entrée unique pour l'envoi d'emails transactionnels.
 * En développement (ou sans clé API configurée), le message est simplement
 * journalisé — aucun envoi réel n'est effectué.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  const config = useRuntimeConfig()

  // En développement on simule l'envoi ; en production l'absence de clé est une
  // erreur de configuration, pas un succès silencieux.
  if (!config.mailApiKey) {
    if (import.meta.dev) {
      console.info('[mail] envoi simulé (MAIL_API_KEY absente) :', {
        to: options.to,
        subject: options.subject,
      })
      return
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Configuration email manquante',
      message: "L'envoi du message a échoué. Merci de nous écrire directement par email.",
    })
  }

  // TODO: remplacer par l'appel réel du fournisseur choisi.
  // Exemple avec Resend :
  // await $fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${config.mailApiKey}` },
  //   body: {
  //     from: config.mailFrom,
  //     to: options.to,
  //     reply_to: options.replyTo,
  //     subject: options.subject,
  //     text: options.text,
  //   },
  // })
  throw createError({
    statusCode: 501,
    statusMessage: 'Fournisseur email non configuré',
    message: "L'envoi d'email n'est pas encore branché sur un fournisseur.",
  })
}
