/**
 * Cache des lectures WordPress.
 *
 * Un site headless a deux contraintes qui se contredisent : ne pas interroger
 * WordPress à chaque page vue, et montrer une correction dès qu'elle est
 * publiée. Un simple délai d'expiration ne sert qu'une des deux — d'où ce
 * cache, qui expire **et** se purge.
 *
 * Il remplace les compteurs `{ value, expiresAt }` que `/api/home` et
 * `/api/navigation` tenaient chacun de leur côté : deux copies de la même
 * mécanique, dont aucune ne pouvait être vidée.
 *
 * Portée volontairement limitée à un processus. Sur plusieurs instances,
 * chacune garde la sienne et chacune reçoit la purge — c'est correct, mais la
 * purge doit alors atteindre toutes les instances (répartiteur en `broadcast`,
 * ou un stockage partagé à la place de cette Map).
 */

interface Entry {
  value: unknown
  expiresAt: number
}

const entries = new Map<string, Entry>()

/*
 * En développement, le délai tombe à quelques secondes — mais ne disparaît pas.
 *
 * Il avait d'abord été supprimé : on modifie WordPress pour voir le résultat, et
 * un cache d'une minute transforme chaque essai en attente. C'était une
 * sur-correction, et elle s'est retournée contre le WordPress local. Chaque
 * page rendue coûte deux allers-retours REST, à ~0,5 s pièce sur MAMP ; sans le
 * moindre cache, une poignée de rechargements suffit à occuper tous les
 * processus PHP disponibles. Une requête d'administration tombée au milieu
 * attend son tour, dépasse le délai d'inactivité de 30 s d'Apache, et se solde
 * par un « Internal Server Error » qui n'a rien d'une erreur de code.
 *
 * Cinq secondes réconcilient les deux besoins : c'est trop court pour qu'un
 * éditeur le remarque — il publie, il recharge, il voit — et bien assez pour
 * qu'une rafale de chargements ne compte que pour un seul appel à WordPress.
 * La purge par `/api/revalidate` reste de toute façon le chemin exact.
 */
const TTL_DEV = 5 * 1000

export interface CacheTtl {
  /** Durée d'une lecture réussie, en millisecondes. */
  ttl: number
  /**
   * Durée d'un échec. Bien plus courte : elle évite une rafale d'appels vers
   * un WordPress en difficulté, sans faire durer la panne une fois réparée.
   */
  ttlOnError: number
}

/**
 * Lit `key` depuis le cache, ou appelle `load`.
 *
 * `isError` distingue une réponse de repli d'une vraie réponse : c'est ce qui
 * permet de ne garder un échec que quelques secondes.
 */
export async function cachedWp<T>(
  key: string,
  load: () => Promise<{ value: T, isError: boolean }>,
  { ttl, ttlOnError }: CacheTtl,
): Promise<T> {
  const hit = entries.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value as T

  const { value, isError } = await load()

  // Un échec ne se garde qu'un instant, en développement comme en ligne : c'est
  // le seul délai qu'il ne faut jamais rallonger.
  const lifetime = isError
    ? ttlOnError
    : (import.meta.dev ? TTL_DEV : ttl)

  entries.set(key, { value, expiresAt: Date.now() + lifetime })

  return value
}

/** Vide le cache, en entier ou pour une seule clé. Retourne le nombre d'entrées ôtées. */
export function purgeWpCache(key?: string): number {
  if (key) return entries.delete(key) ? 1 : 0

  const count = entries.size
  entries.clear()
  return count
}

/** Les clés existantes — le point de purge les nomme dans sa réponse. */
export function wpCacheKeys(): string[] {
  return [...entries.keys()]
}
