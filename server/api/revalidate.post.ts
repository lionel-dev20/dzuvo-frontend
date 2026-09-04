import { createHash, timingSafeEqual } from 'node:crypto'
import { checkRateLimit } from '../utils/rate-limit'
import { purgeWpCache, wpCacheKeys } from '../utils/wp-cache'

/**
 * Comparaison de secrets à temps constant.
 *
 * `!==` s'arrête au premier caractère différent : le temps de réponse trahit
 * alors le nombre de caractères devinés, et le secret se reconstitue lettre à
 * lettre. Le passage par un condensé de longueur fixe évite en plus de fuiter
 * la longueur elle-même, `timingSafeEqual` exigeant deux tampons de même
 * taille.
 */
function secretMatches(provided: string, expected: string) {
  const a = createHash('sha256').update(provided).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/**
 * Purge des caches de contenu, appelée par WordPress à chaque publication.
 *
 * C'est la pièce qui manquait à ce site headless. Sans elle, la seule façon de
 * faire paraître une modification était d'attendre l'expiration d'un délai —
 * un éditeur qui clique « Mettre à jour », recharge et ne voit rien conclut
 * que le site est cassé, et le délai ne lui dit rien de ce qu'il doit attendre.
 *
 * Le secret partagé est indispensable : cette adresse est publique, et sans
 * lui n'importe qui pourrait vider les caches en boucle et faire retomber
 * chaque page sur WordPress. Ce n'est pas une authentification de personne,
 * c'est un laissez-passer de machine à machine.
 */
export default defineEventHandler(async (event) => {
  const { revalidateSecret } = useRuntimeConfig()

  // Sans secret configuré, la purge reste fermée. Ouvrir par défaut ferait de
  // l'oubli d'une variable d'environnement une porte ouverte silencieuse.
  if (!revalidateSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Purge non configurée',
      message: 'NUXT_REVALIDATE_SECRET n’est pas renseigné.',
    })
  }

  // L'adresse est publique : sans plafond, elle offrirait à la fois un banc
  // d'essai pour deviner le secret et un moyen de vider le cache en boucle,
  // renvoyant chaque page vers WordPress.
  checkRateLimit(event, 'revalidate')

  const provided = getHeader(event, 'x-dzuvo-revalidate')
    ?? (await readBody<{ secret?: string }>(event).catch(() => null))?.secret

  if (!provided || !secretMatches(provided, revalidateSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const keys = wpCacheKeys()
  const purged = purgeWpCache()

  /*
   * Les routes du catalogue passent par `defineCachedEventHandler`, dont les
   * entrées vivent dans le stockage `cache` de Nitro et non dans notre Map.
   * Les oublier laisserait les catégories périmées jusqu'à dix minutes après
   * une modification dans WooCommerce.
   */
  const storage = useStorage('cache')
  const stored = await storage.getKeys('nitro:handlers')
  await Promise.all(stored.map(key => storage.removeItem(key)))

  console.info(`[revalidate] ${purged} contenu(s) et ${stored.length} route(s) purgés`)

  return {
    success: true,
    purged: { content: keys, routes: stored.length },
  }
})
