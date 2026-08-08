export interface AuthUser {
  id: number
  email: string
  firstName: string
  lastName: string
  displayName: string
}

/** Session client : lecture via /api/auth/me, déconnexion via /api/auth/logout. */
export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loaded = useState('auth-loaded', () => false)

  async function fetchUser() {
    try {
      const { user: sessionUser } = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = sessionUser
    }
    catch {
      user.value = null
    }
    finally {
      loaded.value = true
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/connexion')
  }

  const isLoggedIn = computed(() => Boolean(user.value))

  return { user, loaded, isLoggedIn, fetchUser, logout }
}
