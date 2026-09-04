import type { AuthUser, LoginPayload, RegisterPayload } from '#shared/types'

interface AuthResponse {
  success: boolean
  message: string
  user: AuthUser
}

/**
 * Session client.
 *
 * Le jeton JWT n'apparaît nulle part ici : il vit dans un cookie httpOnly que
 * le JavaScript ne peut pas lire. Ce composable ne manipule que le profil
 * affiché, et laisse `/api/auth/*` parler à WordPress.
 *
 * L'état passe par `useState` : le bandeau, le menu mobile et l'espace client
 * lisent la même session, si bien qu'une connexion ou une déconnexion se voit
 * partout à l'instant même, sans rechargement.
 */
export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)

  // `useRequestFetch` transmet les cookies du visiteur pendant le rendu
  // serveur ; un `$fetch` nu partirait anonyme et croirait la session vide.
  const request = useRequestFetch()

  /*
   * La requête en cours vit sur l'instance Nuxt, pas dans `useState`.
   *
   * Deux raisons. Une promesse ne se sérialise pas : rangée dans `useState`,
   * elle casserait la charge utile envoyée au navigateur. Et l'instance Nuxt
   * est propre à chaque requête sur le serveur — une variable de module, elle,
   * serait partagée entre visiteurs, et le second attendrait la session du
   * premier.
   *
   * Sans ce partage, le bandeau et la page demandée au même instant réclamaient
   * chacun la session : deux allers-retours vers WordPress par chargement.
   */
  const nuxtApp = useNuxtApp() as unknown as { _authRequest?: Promise<void> }

  async function fetchUser() {
    if (nuxtApp._authRequest) return nuxtApp._authRequest

    nuxtApp._authRequest = (async () => {
      try {
        const { user: sessionUser } = await request<{ user: AuthUser | null }>('/api/auth/me')
        user.value = sessionUser
      }
      catch {
        user.value = null
      }
      finally {
        loaded.value = true
        nuxtApp._authRequest = undefined
      }
    })()

    return nuxtApp._authRequest
  }

  /** Charge la session une seule fois — à appeler quand seule sa présence importe. */
  async function ensureUser() {
    if (loaded.value) return
    await fetchUser()
  }

  async function login(payload: LoginPayload) {
    const response = await $fetch<AuthResponse>('/api/auth/login', { method: 'POST', body: payload })
    // Le profil vient avec la réponse : la session est à jour avant même la
    // redirection, et le bandeau n'affiche jamais « Se connecter » à un
    // visiteur qui vient de se connecter.
    user.value = response.user
    loaded.value = true
    return response
  }

  async function register(payload: RegisterPayload) {
    const response = await $fetch<AuthResponse>('/api/auth/register', { method: 'POST', body: payload })
    user.value = response.user
    loaded.value = true
    return response
  }

  /**
   * Déconnexion. L'état local est vidé quoi qu'il arrive : si l'appel réseau
   * échoue, laisser le bandeau afficher un nom alors que le visiteur croit être
   * sorti serait le pire des deux mondes.
   */
  async function logout(redirectTo = '/') {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    }
    finally {
      user.value = null
      loaded.value = true
    }

    if (redirectTo) await navigateTo(redirectTo)
  }

  const isLoggedIn = computed(() => Boolean(user.value))

  return { user, loaded, isLoggedIn, fetchUser, ensureUser, login, register, logout }
}
