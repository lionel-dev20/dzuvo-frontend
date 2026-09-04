import { createHash } from 'node:crypto'

/**
 * Jetons révoqués avant leur échéance.
 *
 * Un JWT est autoportant : WordPress le valide sur sa seule signature, sans
 * consulter quoi que ce soit. Se déconnecter en effaçant le cookie ne le rend
 * donc pas invalide — un jeton dérobé restait utilisable **sept jours**, quel
 * que soit le nombre de déconnexions. C'est le prix habituel du JWT, mais il ne
 * doit pas être payé sans le savoir.
 *
 * Cette liste ferme l'écart. On n'y range que l'**empreinte** du jeton : le
 * jeton lui-même n'a pas à séjourner en mémoire, et une empreinte suffit à le
 * reconnaître. Chaque entrée s'efface d'elle-même à l'échéance qu'elle porte —
 * passé ce moment, WordPress refuse le jeton de toute façon, et le garder ne
 * ferait que faire grossir la table.
 *
 * Portée : un processus. Sur plusieurs instances, une déconnexion ne vaudrait
 * que pour celle qui l'a reçue ; il faudrait alors un stockage partagé. C'est
 * la limite à connaître avant de passer à l'échelle.
 */

const revoked = new Map<string, number>()

/** Plafond de sûreté : la table ne peut pas croître indéfiniment. */
const MAX_ENTRIES = 50_000

function fingerprint(token: string) {
  return createHash('sha256').update(token).digest('base64url')
}

/** Échéance inscrite dans le jeton, en millisecondes. */
function expiryOf(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof exp === 'number' ? exp * 1000 : null
  }
  catch {
    return null
  }
}

function sweep(now: number) {
  for (const [key, expiresAt] of revoked) {
    if (now >= expiresAt) revoked.delete(key)
  }

  if (revoked.size >= MAX_ENTRIES) {
    for (const key of [...revoked.keys()].slice(0, revoked.size - MAX_ENTRIES + 1)) {
      revoked.delete(key)
    }
  }
}

/** Marque un jeton comme révoqué jusqu'à son échéance. */
export function revokeToken(token: string) {
  const now = Date.now()
  sweep(now)

  /* Jeton illisible : on le garde le temps maximal d'une session plutôt que de
     l'ignorer. Ne pas savoir lire une échéance n'est pas une raison de laisser
     passer le jeton. */
  const expiresAt = expiryOf(token) ?? now + 7 * 24 * 60 * 60 * 1000
  if (expiresAt > now) revoked.set(fingerprint(token), expiresAt)
}

export function isTokenRevoked(token: string) {
  const expiresAt = revoked.get(fingerprint(token))
  if (expiresAt === undefined) return false

  if (Date.now() >= expiresAt) {
    revoked.delete(fingerprint(token))
    return false
  }

  return true
}
