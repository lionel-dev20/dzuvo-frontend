import type { ContactPayload, FieldErrors, LoginPayload, NewsletterPayload, RegisterPayload } from '#shared/types/forms'
import type { CheckoutAddress } from '#shared/types/checkout'
import { findCity } from '#shared/config/cities'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const PHONE_RE = /^[+\d][\d\s().-]{6,}$/
/** Code postal canadien : A1A 1A1, espace facultatif. Les lettres D, F, I, O, Q et U n'y figurent jamais. */
const POSTCODE_CA_RE = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i

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

export function isPostcodeCA(value: string): boolean {
  return POSTCODE_CA_RE.test(value.trim())
}

/** Met un code postal canadien au format officiel : « h2x1y4 » → « H2X 1Y4 ». */
export function formatPostcodeCA(value: string): string {
  const clean = value.replace(/[\s-]/g, '').toUpperCase()
  return clean.length === 6 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean
}

/** Provinces et territoires, avec le code attendu par WooCommerce. */
export const CANADA_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'Colombie-Britannique' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'Nouveau-Brunswick' },
  { code: 'NL', name: 'Terre-Neuve-et-Labrador' },
  { code: 'NS', name: 'Nouvelle-Écosse' },
  { code: 'NT', name: 'Territoires du Nord-Ouest' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Île-du-Prince-Édouard' },
  { code: 'QC', name: 'Québec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
] as const

const PROVINCE_CODES = new Set(CANADA_PROVINCES.map(p => p.code))

/**
 * Adresse de livraison ou de facturation.
 *
 * Le téléphone est exigé : les transporteurs canadiens en ont besoin pour
 * prévenir à la livraison.
 */
export function validateAddress(payload: Partial<CheckoutAddress>): FieldErrors<CheckoutAddress> {
  const errors: FieldErrors<CheckoutAddress> = {}

  if (!payload.firstName?.trim()) errors.firstName = 'Le prénom est requis.'
  if (!payload.lastName?.trim()) errors.lastName = 'Le nom est requis.'

  if (!payload.email?.trim()) errors.email = 'Le courriel est requis.'
  else if (!isEmail(payload.email)) errors.email = 'Format de courriel invalide.'

  if (!payload.phone?.trim()) errors.phone = 'Le téléphone est requis pour la livraison.'
  else if (!isPhone(payload.phone)) errors.phone = 'Numéro de téléphone invalide.'

  if (!payload.address1?.trim()) errors.address1 = 'L’adresse est requise.'
  if (!payload.city?.trim()) errors.city = 'La ville est requise.'

  if (!payload.state?.trim()) errors.state = 'La province est requise.'
  else if (!PROVINCE_CODES.has(payload.state.trim().toUpperCase() as never)) {
    errors.state = 'Province inconnue.'
  }

  /*
   * Ville desservie : le quartier est alors demandé, et la province découle de
   * la ville — le formulaire ne la pose plus, on vérifie seulement qu'elle n'a
   * pas été contredite en chemin. Ville non desservie : ni quartier à proposer,
   * ni quartier à exiger.
   */
  const city = findCity(payload.city)

  if (city) {
    if (!payload.district?.trim()) errors.district = 'Le quartier est requis.'
    else if (!city.districts.includes(payload.district.trim())) {
      errors.district = 'Ce quartier n’est pas desservi dans cette ville.'
    }

    // Formulation neutre : « en Ontario » mais « au Québec », autant l'éviter.
    if (payload.state?.trim().toUpperCase() !== city.province) {
      errors.state = `La province ne correspond pas à ${city.name}.`
    }
  }

  if (!payload.postcode?.trim()) errors.postcode = 'Le code postal est requis.'
  else if (!isPostcodeCA(payload.postcode)) errors.postcode = 'Code postal invalide (format A1A 1A1).'

  return errors
}

export function hasErrors(errors: Record<string, unknown>): boolean {
  return Object.keys(errors).length > 0
}
