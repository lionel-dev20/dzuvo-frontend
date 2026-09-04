import type { H3Event } from 'h3'
import type { AuthUser } from '#shared/types/auth'
import { createCustomer, hasBaseUrl, isConfigured, wooConfig } from './woocommerce'

export const AUTH_COOKIE = 'dzuvo_token'

/*
 * Durée du cookie « rester connecté ».
 *
 * Elle est volontairement calée sur la durée de vie du jeton JWT (7 jours par
 * défaut dans l'extension, filtre `jwt_auth_expire`). Un cookie plus long ne
 * prolongerait rien : passé l'expiration du jeton, WordPress le refuse et le
 * visiteur se retrouve déconnecté sans l'avoir demandé, avec un cookie mort
 * que le navigateur continue d'envoyer. Si la durée du jeton change côté
 * WordPress, changer celle-ci en même temps.
 */
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 7 // 7 jours

interface JwtTokenResponse {
  token: string
  user_email: string
  user_nicename: string
  user_display_name: string
}

/**
 * Utilisateur WordPress en contexte `edit`.
 *
 * Le contexte compte : en `view` — le défaut — WordPress masque `email`,
 * `first_name` et `last_name`, y compris sur son propre profil. La réponse
 * reste un 200 parfaitement valide, simplement amputée, et l'espace client
 * affiche alors un courriel vide et « Bonjour, » sans prénom.
 */
interface WpUser {
  id: number
  email: string
  first_name: string
  last_name: string
  name: string
  username: string
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

/*
 * Panne d'installation, et non erreur de saisie.
 *
 * Les confondre coûte cher : un site dont la clé secrète manque dans
 * wp-config.php refuse toutes les connexions en affichant « mot de passe
 * incorrect » à des clients qui l'ont pourtant bien tapé, et rien dans
 * l'interface ne pointe vers la vraie cause.
 *
 * La comparaison est volontairement souple : selon la version, l'extension
 * préfixe ses codes (« [jwt_auth] bad_config ») ou les colle en un seul mot
 * (« jwt_auth_bad_config »). Chercher la racine couvre les deux, aujourd'hui
 * comme après une mise à jour.
 */
const JWT_CONFIG_ERROR_RE = /bad_config|bad_iss|bad_secret|invalid_package|not_configured/

function isJwtConfigError(code?: string) {
  return Boolean(code && JWT_CONFIG_ERROR_RE.test(code))
}

/** Authentifie via JWT Authentication for WP REST API. */
export async function authenticate(email: string, password: string, username?: string) {
  const { baseUrl } = wooConfig()
  const loginCandidates = [
    email.trim().toLowerCase(),
    ...(username && username !== email.trim().toLowerCase() ? [username] : []),
  ]

  let lastError: WooError | null = null

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
    catch (error: unknown) {
      // On tente le candidat suivant (courriel puis identifiant WooCommerce).
      lastError = extractWooError(error) ?? lastError
    }
  }

  if (import.meta.dev) {
    console.error('[login] refus JWT :', lastError ?? 'aucun détail')
  }

  // Une extension mal configurée n'est pas une erreur du visiteur : le dire.
  if (isJwtConfigError(lastError?.code)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Authentification non configurée',
      message: import.meta.dev
        ? `JWT mal configuré (${lastError?.code}). Vérifiez JWT_AUTH_SECRET_KEY dans wp-config.php.`
        : 'La connexion est momentanément indisponible. Merci de réessayer plus tard.',
    })
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

/**
 * Récupère le profil WordPress porté par le jeton.
 *
 * Un seul aller-retour, et non deux : `/wp/v2/users/me` exige déjà un jeton
 * valide pour répondre. L'appel préalable à `jwt-auth/v1/token/validate` ne
 * vérifiait rien de plus, il doublait simplement la latence de chaque affichage
 * de page — la session est lue à chaque chargement.
 *
 * `context=edit` est indispensable : voir `WpUser`.
 */
export async function fetchAuthUser(token: string): Promise<AuthUser | null> {
  const { baseUrl } = wooConfig()

  try {
    const user = await $fetch<WpUser>(`${baseUrl}/wp-json/wp/v2/users/me`, {
      query: { context: 'edit' },
      headers: { Authorization: `Bearer ${token}` },
    })

    return toAuthUser(user)
  }
  catch (error: unknown) {
    if (import.meta.dev) {
      console.error('[session] jeton refusé :', extractWooError(error) ?? error)
    }
    return null
  }
}

/**
 * WordPress nomme le compte d'après son identifiant tant que personne n'a
 * touché au profil — pour un client créé par la boutique, c'est un pseudo
 * fabriqué à partir du courriel, illisible dans « Bonjour, … ». Le prénom et le
 * nom saisis à l'inscription passent donc devant.
 */
function toAuthUser(user: WpUser): AuthUser {
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name ?? '',
    lastName: user.last_name ?? '',
    displayName: fullName || user.name || user.email,
  }
}

/**
 * Session du visiteur, ou `null`.
 *
 * Un jeton refusé (expiré, ou signé avec une clé secrète depuis changée) fait
 * effacer le cookie : sans cela le navigateur renverrait un jeton mort à chaque
 * requête, et le visiteur resterait bloqué dans un entre-deux — ni connecté,
 * ni proprement déconnecté — jusqu'à vider ses cookies à la main.
 */
export async function getSessionUser(event: H3Event): Promise<AuthUser | null> {
  const token = getAuthToken(event)
  if (!token) return null

  const user = await fetchAuthUser(token)
  if (!user) clearAuthCookie(event)

  return user
}
