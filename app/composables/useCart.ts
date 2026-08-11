import type { CatalogProduct } from '#shared/types/catalog'
import type { CartItem, CartState } from '#shared/types/cart'

/**
 * Panier du visiteur.
 *
 * Le navigateur ne retient qu'une liste d'identifiants et de quantités, dans
 * un cookie : le panier survit à la fermeture de l'onglet et il est déjà
 * connu du serveur au premier rendu, sans clignotement à l'hydratation.
 *
 * Tout ce qui a une valeur — prix, disponibilité, remise, total — est
 * recalculé par /api/cart à partir de WooCommerce à chaque modification.
 */

const CART_COOKIE = 'dzuvo_cart'
const COUPON_COOKIE = 'dzuvo_coupon'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 jours
/** Les clics répétés sur « + » ne déclenchent qu'un seul appel réseau. */
const SYNC_DEBOUNCE_MS = 250

export function useCart() {
  const items = useCookie<CartItem[]>(CART_COOKIE, {
    default: () => [],
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  })

  const couponCode = useCookie<string | null>(COUPON_COOKIE, {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    path: '/',
  })

  const state = useState<CartState | null>('cart:state', () => null)
  const pending = useState('cart:pending', () => false)
  const error = useState<string | null>('cart:error', () => null)

  /* Tiroir de confirmation, ouvert après une mise au panier. */
  const drawerOpen = useState('cart:drawer', () => false)
  const lastAdded = useState<CatalogProduct | null>('cart:last-added', () => null)
  const lastAddedQuantity = useState('cart:last-added-quantity', () => 1)

  /** Compteur optimiste : il suit le clic sans attendre la réponse serveur. */
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const isEmpty = computed(() => count.value === 0)

  /* Seule la dernière réponse compte : deux appels concurrents ne doivent pas
     se réécrire dans le désordre. */
  const requestId = useState('cart:request-id', () => 0)
  let debounce: ReturnType<typeof setTimeout> | undefined

  async function sync() {
    if (!items.value.length) {
      state.value = null
      error.value = null
      return
    }

    const ticket = ++requestId.value
    pending.value = true

    try {
      const result = await $fetch<CartState>('/api/cart', {
        method: 'POST',
        body: { items: items.value, coupon: couponCode.value ?? undefined },
      })

      if (ticket !== requestId.value) return

      state.value = result
      error.value = null

      // Le serveur fait foi : on aligne le cookie sur ce qu'il a retenu, pour
      // que le compteur cesse d'annoncer un article épuisé ou supprimé.
      reconcile(result)

      // Un code devenu invalide (panier modifié, code expiré) se retire seul.
      if (result.couponError) couponCode.value = null
    }
    catch (cause) {
      if (ticket !== requestId.value) return
      error.value = messageOf(cause)
    }
    finally {
      if (ticket === requestId.value) pending.value = false
    }
  }

  /** Aligne le cookie sur les lignes retenues par le serveur. */
  function reconcile(result: CartState) {
    const kept = new Map(result.lines.map(line => [line.id, line.quantity]))
    const next = items.value
      .filter(item => kept.has(item.id))
      .map(item => ({ id: item.id, quantity: kept.get(item.id)! }))

    const changed = next.length !== items.value.length
      || next.some((item, index) => item.quantity !== items.value[index]?.quantity)

    if (changed) items.value = next
  }

  function scheduleSync() {
    clearTimeout(debounce)
    debounce = setTimeout(sync, SYNC_DEBOUNCE_MS)
  }

  function write(next: CartItem[]) {
    items.value = next
    scheduleSync()
  }

  function add(product: CatalogProduct, quantity = 1) {
    const existing = items.value.find(item => item.id === product.id)
    const ceiling = product.stockQuantity ?? 99

    write(
      existing
        ? items.value.map(item =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, ceiling) }
              : item,
          )
        : [...items.value, { id: product.id, quantity: Math.min(quantity, ceiling) }],
    )

    lastAdded.value = product
    lastAddedQuantity.value = quantity
    drawerOpen.value = true
  }

  function setQuantity(id: number, quantity: number) {
    if (quantity < 1) return remove(id)
    write(items.value.map(item => (item.id === id ? { ...item, quantity } : item)))
  }

  function remove(id: number) {
    write(items.value.filter(item => item.id !== id))
    // Dernière ligne retirée : plus rien à résoudre, on vide tout de suite.
    if (!items.value.length) state.value = null
  }

  function clear() {
    items.value = []
    couponCode.value = null
    state.value = null
    error.value = null
  }

  async function applyCoupon(code: string) {
    couponCode.value = code.trim() || null
    await sync()
    return !state.value?.couponError
  }

  async function removeCoupon() {
    couponCode.value = null
    await sync()
  }

  function closeDrawer() {
    drawerOpen.value = false
  }

  /**
   * Départ vers le tunnel de commande. Le panier n'est pas vidé ici : tant
   * que le paiement n'a pas abouti, revenir en arrière doit le retrouver
   * intact.
   */
  function checkout() {
    return navigateTo('/commande')
  }

  return {
    items,
    state,
    pending,
    error,
    count,
    isEmpty,
    couponCode,
    drawerOpen,
    lastAdded,
    lastAddedQuantity,
    sync,
    add,
    setQuantity,
    remove,
    clear,
    applyCoupon,
    removeCoupon,
    closeDrawer,
    checkout,
  }
}

function messageOf(cause: unknown) {
  const err = cause as { data?: { message?: string }, message?: string }
  return err?.data?.message ?? 'Une erreur est survenue. Merci de réessayer.'
}
