import type { H3Event } from 'h3'
import { createCustomer, hasBaseUrl, isConfigured, wooConfig } from './woocommerce'

export const AUTH_COOKIE = 'dzuvo_token'
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
  displayName: string
}

interface JwtTokenResponse {
  token: string
  user_email: string
  user_nicename: string
  user_display_name: string
}

interface WpUser {
  id: number
  email: string
  first_name: string
  last_name: string
  name: string
}

interface WooError {
  code?: string
  message?: string
  data?: { status?: number }
}

/** Vérifie que WooCommerce est configuré pour la création de compte. */
export function requireWooForRegister() {
  if (!isConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Boutique non configurée',
      message: 'La création de compte n’est pas disponible pour le moment. Merci de réessayer plus tard.',
    })
  }
}

/** Vérifie que l’URL WordPress est renseignée pour la connexion JWT. */
export function requireWooForLogin() {
  if (!hasBaseUrl()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentification non configurée',
      message: 'La connexion n’est pas disponible pour le moment. Merci de réessayer plus tard.',
    })
  }
}

/** Crée le client WooCommerce et retourne ses informations. */
export async function registerCustomer(payload: {
  email: string
  firstName: string
  lastName: string
  password: string
}) {
  try {
    const customer = await createCustomer(payload)
    return {
      id: customer.id,
      email: customer.email,
      username: customer.username,
      firstName: customer.first_name,
      lastName: customer.last_name,
      displayName: `${customer.first_name} ${customer.last_name}`.trim() || customer.email,
    }
  }
  catch (error: unknown) {
    throw mapRegisterError(error)
  }
}

function mapRegisterError(error: unknown): never {
  const woo = extractWooError(error)

  if (import.meta.dev) {
    console.error('[register] erreur WooCommerce :', woo ?? error)
  }

  if (woo?.code === 'registration-error-email-exists' || woo?.code === 'rest_customer_invalid_email') {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: 'Un compte existe déjà avec ce courriel.',
      data: { errors: { email: 'Un compte existe déjà avec ce courriel.' } },
    })
  }

  if (
    woo?.code === 'registration-error-username-exists'
    || woo?.code === 'rest_user_invalid_username'
    || woo?.code === 'rest_invalid_param'
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Formulaire invalide',
      message: woo.message ?? 'Merci de vérifier les informations saisies.',
    })
  }

  if (
    woo?.code === 'woocommerce_rest_authentication_error'
    || woo?.code === 'rest_forbidden'
    || woo?.code === 'rest_cannot_create'
  ) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Boutique non configurée',
      message: 'La boutique n’accepte pas encore les inscriptions. Merci de réessayer plus tard.',
    })
  }

  throw createError({
    statusCode: 502,
    statusMessage: 'Erreur boutique',
    message: import.meta.dev && woo?.message
      ? woo.message
      : 'La création du compte a échoué. Merci de réessayer.',
  })
}

function extractWooError(error: unknown): WooError | null {
  if (!error || typeof error !== 'object') return null
  const err = error as {
    data?: WooError
    response?: { _data?: WooError }
    statusCode?: number
    statusMessage?: string
  }

  if (err.data?.code) return err.data
  if (err.response?._data?.code) return err.response._data

  // ofetch enveloppe parfois le corps WordPress dans data.data
  const nested = (err.data as { data?: WooError } | undefined)?.data
  if (nested?.code) return nested

  return null
}

/** Authentifie via JWT Authentication for WP REST API. */
export async function authenticate(email: string, password: string, username?: string) {
  const { baseUrl } = wooConfig()
  const loginCandidates = [
    email.trim().toLowerCase(),
    ...(username && username !== email.trim().toLowerCase() ? [username] : []),
  ]

  for (const login of loginCandidates) {
    try {
      const response = await $fetch<JwtTokenResponse>(`${baseUrl}/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        body: { username: login, password },
      })

      if (response?.token) {
        return response.token
      }
    }
    catch {
      // On tente le candidat suivant (courriel puis identifiant WooCommerce).
    }
  }

  // Message volontairement identique que le compte existe ou non.
  throw createError({
    statusCode: 401,
    statusMessage: 'Identifiants incorrects',
    message: 'Courriel ou mot de passe incorrect.',
  })
}

export function setAuthCookie(event: H3Event, token: string, remember = true) {
  const { baseUrl } = wooConfig()

  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: baseUrl.startsWith('https://'),
    path: '/',
    ...(remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE, { path: '/' })
}

export function getAuthToken(event: H3Event) {
  return getCookie(event, AUTH_COOKIE)
}

/** Valide le jeton JWT et récupère le profil WordPress. */
export async function fetchAuthUser(token: string): Promise<AuthUser | null> {
  const { baseUrl } = wooConfig()

  try {
    await $fetch(`${baseUrl}/wp-json/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    const user = await $fetch<WpUser>(`${baseUrl}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.name || user.email,
    }
  }
  catch {
    return null
  }
}

export async function getSessionUser(event: H3Event): Promise<AuthUser | null> {
  const token = getAuthToken(event)
  if (!token) return null
  return fetchAuthUser(token)
}
