import type { CheckoutAddress, CheckoutSession, OrderSummary, ShippingMethod } from '#shared/types/checkout'
import type { FieldErrors } from '#shared/types/forms'
import { hasErrors, validateAddress } from '#shared/utils/validation'
import { findCity } from '#shared/config/cities'

/**
 * Tunnel de commande.
 *
 * Le paiement suit le mode différé de Stripe : les champs de carte sont montés
 * sans commande derrière eux, et la commande WooCommerce n'est créée qu'au
 * moment où le visiteur valide. Un panier abandonné ne laisse donc aucune
 * commande fantôme dans la boutique.
 */

const emptyAddress = (): CheckoutAddress => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  district: '',
  state: '',
  postcode: '',
  company: '',
})

export function useCheckout() {
  const cart = useCart()

  const address = useState<CheckoutAddress>('checkout:address', emptyAddress)
  const billing = useState<CheckoutAddress>('checkout:billing', emptyAddress)
  const separateBilling = useState('checkout:separate-billing', () => false)
  const note = useState('checkout:note', () => '')
  const shippingId = useState('checkout:shipping', () => '')

  const methods = useState<ShippingMethod[]>('checkout:methods', () => [])
  const errors = useState<FieldErrors<CheckoutAddress>>('checkout:errors', () => ({}))
  const formError = useState<string | null>('checkout:form-error', () => null)
  const paying = useState('checkout:paying', () => false)

  const honeypot = ref('')

  const method = computed(() => methods.value.find(m => m.id === shippingId.value) ?? null)
  const shippingCost = computed(() => method.value?.cost ?? 0)
  const total = computed(() => (cart.state.value?.totals.total ?? 0) + shippingCost.value)

  /* ---------- Livraison ---------- */

  /** Les tarifs dépendent de la province : on recharge dès qu'elle change. */
  async function loadShipping() {
    try {
      const { methods: list } = await $fetch<{ methods: ShippingMethod[] }>('/api/checkout/shipping', {
        query: { state: address.value.state },
      })
      methods.value = list
      // Le choix précédent peut ne plus être proposé dans la nouvelle province.
      if (!list.some(m => m.id === shippingId.value)) shippingId.value = list[0]?.id ?? ''
    }
    catch {
      methods.value = []
    }
  }

  /* ---------- Pré-remplissage ---------- */

  /** Un client connecté ne ressaisit pas ce que la boutique connaît déjà. */
  function prefill(user: { firstName?: string, lastName?: string, email?: string } | null) {
    if (!user) return
    address.value.firstName ||= user.firstName ?? ''
    address.value.lastName ||= user.lastName ?? ''
    address.value.email ||= user.email ?? ''
  }

  /*
   * La ville retenue dans le header vaut proposition de livraison : le visiteur
   * l'a déjà indiquée, la redemander serait une question de trop. `||=` la pose
   * sans jamais écraser une saisie en cours — le choix du formulaire prime.
   */
  const { city: selectedCity } = useCitySelector()

  watch(selectedCity, (name) => {
    const city = findCity(name)
    if (!city) return
    address.value.city ||= city.name
    address.value.state ||= city.province
  }, { immediate: true })

  /* ---------- Validation ---------- */

  function validate() {
    errors.value = validateAddress(address.value)

    if (!shippingId.value) {
      formError.value = 'Merci de choisir un mode de livraison.'
      return false
    }
    if (hasErrors(errors.value)) {
      formError.value = 'Merci de corriger les informations signalées.'
      return false
    }

    formError.value = null
    return true
  }

  /** Ouvre le paiement : commande WooCommerce créée, PaymentIntent prêt. */
  async function openSession() {
    return $fetch<CheckoutSession>('/api/checkout/session', {
      method: 'POST',
      body: {
        items: cart.items.value,
        coupon: cart.couponCode.value ?? undefined,
        address: address.value,
        billing: separateBilling.value ? billing.value : undefined,
        shipping: shippingId.value,
        note: note.value,
        honeypot: honeypot.value,
      },
    })
  }

  /** Enregistre le paiement côté serveur, seule source de vérité du succès. */
  async function confirm(paymentIntentId: string) {
    const { order } = await $fetch<{ order: OrderSummary }>('/api/checkout/confirm', {
      method: 'POST',
      body: { paymentIntentId },
    })
    return order
  }

  function reset() {
    address.value = emptyAddress()
    billing.value = emptyAddress()
    separateBilling.value = false
    note.value = ''
    shippingId.value = ''
    errors.value = {}
    formError.value = null
  }

  return {
    address,
    billing,
    separateBilling,
    note,
    shippingId,
    methods,
    method,
    shippingCost,
    total,
    errors,
    formError,
    paying,
    honeypot,
    loadShipping,
    prefill,
    validate,
    openSession,
    confirm,
    reset,
  }
}

/** Message lisible tiré d'une erreur d'API ou de Stripe. */
export function checkoutErrorMessage(cause: unknown) {
  const err = cause as {
    data?: { message?: string, data?: { errors?: Record<string, string> } }
    message?: string
  }
  return err?.data?.message ?? err?.message ?? 'Le paiement n’a pas abouti. Merci de réessayer.'
}
