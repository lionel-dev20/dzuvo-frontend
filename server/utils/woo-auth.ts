import { createHmac, randomBytes } from 'node:crypto'

/**
 * Authentification WooCommerce REST.
 *
 * WooCommerce n'accepte les clés en clair (Basic) que sur HTTPS. En HTTP —
 * typiquement un environnement local — il exige une signature OAuth 1.0a.
 * On choisit donc selon le protocole, sans configuration supplémentaire.
 *
 * Le détail qui fait tout échouer si on l'oublie : la clé de signature est
 * `consumer_secret` suivi d'un `&` (place du token secret, vide ici).
 * Voir WC_REST_Authentication::check_oauth_signature().
 */

/** `WOO_BASE_URL` doit être la racine du site ; on tolère l'URL complète de l'API. */
export function normalizeBaseUrl(raw: string) {
  return raw.trim().replace(/\/+$/, '').replace(/\/wp-json(\/wc\/v\d)?$/, '')
}

function rawEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

/**
 * Construit l'URL signée. Les paramètres métier participent à la signature :
 * les omettre invaliderait la requête.
 */
export function signOAuthUrl(
  url: string,
  query: Record<string, string | number | boolean>,
  key: string,
  secret: string,
  method = 'GET',
) {
  const params: Record<string, string> = {}
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params[k] = String(v)
  }

  Object.assign(params, {
    oauth_consumer_key: key,
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_nonce: randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA256',
  })

  /*
   * WooCommerce trie les clés, encode chaque clé et chaque valeur, puis
   * ré-encode la chaîne « clé=valeur » entière avant de joindre avec %26
   * (WC_REST_Authentication::join_with_equals_sign). Clés et valeurs sont donc
   * encodées DEUX fois dans la chaîne à signer.
   *
   * Sans caractère réservé, double encodage et simple encodage donnent le même
   * résultat — d'où une signature qui paraît correcte tant qu'aucune valeur ne
   * contient d'espace ou de virgule. Dès que c'en est une (`include=35,31`,
   * `search=tapis hiver`), l'omettre vaut un 401.
   */
  const normalized = Object.keys(params)
    .sort()
    .map(k => `${rawEncode(rawEncode(k))}%3D${rawEncode(rawEncode(params[k]!))}`)
    .join('%26')

  const stringToSign = `${method}&${rawEncode(url)}&${normalized}`
  params.oauth_signature = createHmac('sha256', `${secret}&`)
    .update(stringToSign)
    .digest('base64')

  return `${url}?${new URLSearchParams(params).toString()}`
}

/** En-tête Basic, utilisé dès que la boutique est servie en HTTPS. */
export function basicAuthHeader(key: string, secret: string) {
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`
}

export function isSecure(baseUrl: string) {
  return baseUrl.startsWith('https://')
}
