/**
 * Profil de session, tel qu'il traverse le réseau.
 *
 * Volontairement pauvre : ce que le navigateur reçoit, il l'affiche. Le jeton
 * JWT, lui, ne quitte jamais le cookie httpOnly — aucun champ ici ne le porte.
 */
export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
  displayName: string
}

/** Réponse commune à /api/auth/login, /register et /me. */
export interface AuthResult {
  success: boolean
  message: string
  /** Le profil connecté, pour que le bandeau se mette à jour sans second appel. */
  user: AuthUser
}
