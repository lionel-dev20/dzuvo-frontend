import type { ContactPayload, FieldErrors, LoginPayload, NewsletterPayload, RegisterPayload } from '#shared/types/forms'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const PHONE_RE = /^[+\d][\d\s().-]{6,}$/

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function isPhone(value: string): boolean {
  return PHONE_RE.test(value.trim())
}

/**
 * Validation partagée client/serveur : le formulaire l'utilise pour l'affichage
 * immédiat, l'API la rejoue pour ne jamais faire confiance au client.
 */
export function validateContact(payload: Partial<ContactPayload>): FieldErrors<ContactPayload> {
  const errors: FieldErrors<ContactPayload> = {}

  if (!payload.firstName?.trim()) errors.firstName = 'Le prénom est requis.'
  if (!payload.lastName?.trim()) errors.lastName = 'Le nom est requis.'
  if (!payload.email?.trim()) errors.email = 'L\'email est requis.'
  else if (!isEmail(payload.email)) errors.email = 'Format d\'email invalide.'
  if (payload.phone?.trim() && !isPhone(payload.phone)) errors.phone = 'Numéro de téléphone invalide.'
  if (!payload.subject?.trim()) errors.subject = 'Le sujet est requis.'
  if (!payload.message?.trim()) errors.message = 'Le message est requis.'
  else if (payload.message.trim().length < 20) errors.message = 'Merci de détailler un peu plus (20 caractères minimum).'
  if (!payload.consent) errors.consent = 'Votre consentement est nécessaire.'

  return errors
}

export function validateNewsletter(payload: Partial<NewsletterPayload>): FieldErrors<NewsletterPayload> {
  const errors: FieldErrors<NewsletterPayload> = {}

  if (!payload.email?.trim()) errors.email = 'L\'email est requis.'
  else if (!isEmail(payload.email)) errors.email = 'Format d\'email invalide.'
  if (!payload.consent) errors.consent = 'Votre consentement est nécessaire.'

  return errors
}

/** Longueur minimale du mot de passe, alignée sur la politique WordPress. */
export const PASSWORD_MIN = 8

export function validateLogin(payload: Partial<LoginPayload>): FieldErrors<LoginPayload> {
  const errors: FieldErrors<LoginPayload> = {}

  if (!payload.email?.trim()) errors.email = 'Le courriel est requis.'
  else if (!isEmail(payload.email)) errors.email = 'Format de courriel invalide.'
  if (!payload.password) errors.password = 'Le mot de passe est requis.'

  return errors
}

export function validateRegister(payload: Partial<RegisterPayload>): FieldErrors<RegisterPayload> {
  const errors: FieldErrors<RegisterPayload> = {}

  if (!payload.firstName?.trim()) errors.firstName = 'Le prénom est requis.'
  if (!payload.lastName?.trim()) errors.lastName = 'Le nom est requis.'
  if (!payload.email?.trim()) errors.email = 'Le courriel est requis.'
  else if (!isEmail(payload.email)) errors.email = 'Format de courriel invalide.'

  if (!payload.password) errors.password = 'Le mot de passe est requis.'
  else if (payload.password.length < PASSWORD_MIN) {
    errors.password = `Au moins ${PASSWORD_MIN} caractères.`
  }
  // Comparé ici plutôt qu'à la saisie : le message reste stable à l'envoi.
  else if (payload.password !== payload.passwordConfirm) {
    errors.passwordConfirm = 'Les deux mots de passe diffèrent.'
  }

  if (!payload.terms) errors.terms = 'Vous devez accepter les conditions générales.'

  return errors
}

export function hasErrors(errors: Record<string, unknown>): boolean {
  return Object.keys(errors).length > 0
}
