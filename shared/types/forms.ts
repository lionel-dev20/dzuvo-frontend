export interface ContactPayload {
  firstName: string
  lastName: string
  email: string
  company?: string
  phone?: string
  subject: string
  message: string
  consent: boolean
  /** Champ piège anti-spam : doit rester vide. */
  honeypot?: string
}

export interface NewsletterPayload {
  email: string
  consent: boolean
  honeypot?: string
}

export interface LoginPayload {
  email: string
  password: string
  /** Garde la session ouverte au-delà de la fermeture du navigateur. */
  remember?: boolean
  honeypot?: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  passwordConfirm: string
  /** Acceptation des conditions générales : obligatoire. */
  terms: boolean
  /** Inscription à la lettre d'information : facultative. */
  newsletter?: boolean
  honeypot?: string
}

export interface ApiResult {
  success: boolean
  message: string
}

/** Erreurs de validation indexées par nom de champ. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>
