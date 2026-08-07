import type { H3Event } from 'h3'

interface Bucket { count: number, resetAt: number }

const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_REQUESTS = 5

/**
 * Limitation de débit en mémoire, suffisante pour un site marketing sur une
 * instance unique. Sur un déploiement multi-instances ou serverless, remplacer
 * le Map par un stockage partagé (KV, Redis).
 */
const buckets = new Map<string, Bucket>()

export function checkRateLimit(event: H3Event, scope: string): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const key = `${scope}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  bucket.count += 1

  if (bucket.count > MAX_REQUESTS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de requêtes',
      message: 'Vous avez effectué trop de tentatives. Merci de réessayer dans quelques minutes.',
    })
  }
}
