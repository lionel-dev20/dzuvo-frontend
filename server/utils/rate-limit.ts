import type { H3Event } from 'h3'

interface Bucket { count: number, resetAt: number }

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

/** Plafond par portée : une tentative de plus est refusée jusqu'à la fenêtre suivante. */
const LIMITS: Record<string, number> = {
  login: 5,
  register: 5,
  contact: 5,
  newsletter: 5,
  // Chaque appel crée une vraie commande WooCommerce : le plafond protège la
  // boutique d'un flot de commandes fantômes, tout en laissant place aux
  // reprises légitimes (carte refusée, changement d'adresse, hésitation).
  checkout: 15,
  revalidate: 30,
}
const DEFAULT_LIMIT = 5

/**
 * Nombre maximal de compteurs gardés en mémoire.
 *
 * Sans plafond, chaque adresse vue laissait une entrée définitive : il suffisait
 * de faire varier l'adresse d'une requête à l'autre pour faire grossir la table
 * sans fin, jusqu'à épuiser la mémoire du processus. La limite de débit
 * devenait elle-même le moyen de mettre le site à genoux.
 */
const MAX_BUCKETS = 10_000

const buckets = new Map<string, Bucket>()

/**
 * Adresse du demandeur.
 *
 * `X-Forwarded-For` n'est pas une information de confiance : c'est un en-tête
 * que **le client écrit lui-même**. Le lire sans condition rendait la limite
 * inopérante — une valeur différente à chaque requête, et chaque tentative
 * repartait d'un compteur neuf. Mesuré : douze connexions ratées d'affilée sans
 * jamais déclencher le moindre refus, là où cinq suffisent sans l'en-tête.
 *
 * Il n'a de sens que derrière un répartiteur de confiance, qui écrase ce que le
 * client a écrit et ajoute la vraie adresse **en fin de liste**. D'où deux
 * choses : la lecture n'a lieu que si l'hébergement est déclaré comme tel
 * (`NUXT_TRUST_PROXY`), et c'est la **dernière** valeur qui est retenue, la
 * seule que le client ne contrôle pas.
 */
function requesterIp(event: H3Event): string {
  const { trustProxy } = useRuntimeConfig()

  if (trustProxy) {
    const header = getRequestHeader(event, 'x-forwarded-for')
    const chain = header?.split(',').map(part => part.trim()).filter(Boolean) ?? []
    const nearest = chain.at(-1)
    if (nearest) return nearest
  }

  // Adresse de la connexion TCP : la seule que personne ne peut réécrire.
  return event.node.req.socket?.remoteAddress ?? 'unknown'
}

/** Retire les compteurs expirés, et fait de la place si la table déborde. */
function evict(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }

  // Toujours pleine après le ménage : on sacrifie les plus anciennes entrées.
  // Perdre un compteur revient à offrir une fenêtre de plus à un attaquant,
  // ce qui reste préférable à un processus qui tombe.
  if (buckets.size >= MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS + 1
    for (const key of [...buckets.keys()].slice(0, excess)) buckets.delete(key)
  }
}

/**
 * Limitation de débit en mémoire, suffisante pour une instance unique. Sur un
 * déploiement multi-instances ou serverless, remplacer la Map par un stockage
 * partagé (KV, Redis) : sinon chaque instance applique sa propre limite, et le
 * plafond réel est multiplié par leur nombre.
 */
export function checkRateLimit(event: H3Event, scope: string): void {
  const now = Date.now()
  evict(now)

  const key = `${scope}:${requesterIp(event)}`
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  bucket.count += 1

  if (bucket.count > (LIMITS[scope] ?? DEFAULT_LIMIT)) {
    // `Retry-After` dit au client honnête quand revenir, plutôt que de le
    // laisser réessayer en aveugle.
    setHeader(event, 'retry-after', String(Math.ceil((bucket.resetAt - now) / 1000)))

    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de requêtes',
      message: 'Vous avez effectué trop de tentatives. Merci de réessayer dans quelques minutes.',
    })
  }
}
