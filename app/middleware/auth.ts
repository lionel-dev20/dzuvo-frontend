/**
 * Réserve une page aux clients connectés.
 *
 * S'applique par `definePageMeta({ middleware: 'auth' })`. Le contrôle a lieu
 * avant l'affichage, rendu serveur compris : la page protégée n'apparaît donc
 * jamais, même une fraction de seconde, à qui n'y a pas droit — contrairement à
 * une redirection posée dans `onMounted`, qui laisse le contenu s'afficher le
 * temps que le navigateur réagisse.
 *
 * À n'utiliser que sur des pages absentes de `routeRules` : une page mise en
 * cache (`swr`) garderait la redirection du premier visiteur pour tous les
 * suivants.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { user, ensureUser } = useAuth()

  await ensureUser()

  if (!user.value) {
    // `redirect` ramène le visiteur où il allait une fois connecté.
    return navigateTo({ path: '/connexion', query: { redirect: to.fullPath } })
  }
})
