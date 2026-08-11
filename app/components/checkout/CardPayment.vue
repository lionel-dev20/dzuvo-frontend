<script setup lang="ts">
/**
 * Champs de carte bancaire, fournis par Stripe Elements.
 *
 * Le numéro de carte est saisi dans une iframe appartenant à Stripe : il ne
 * touche ni ce composant, ni notre serveur. Seule l'apparence est à nous, via
 * l'API `appearance` — d'où l'habillage plutôt qu'un style CSS classique.
 *
 * Montage en mode différé : les champs existent avant qu'aucune commande ne
 * soit créée. Le parent orchestre — `submit()` valide la carte, puis il crée
 * la commande, puis `confirm()` débite.
 */
const props = defineProps<{
  amount: number
  currency: string
  /**
   * L'étape de paiement est-elle dépliée ? Stripe mesure ses champs au
   * montage : les créer dans un bloc en `display: none` donne une iframe de
   * hauteur nulle. On attend donc la première ouverture.
   */
  active?: boolean
}>()

/**
 * Seul Stripe sait si la carte est complète — les champs vivent dans son
 * iframe. Il prévient à chaque frappe, ce qui permet au bouton « Payer » de
 * ne s'activer qu'à bon escient.
 */
const emit = defineEmits<{ 'update:complete': [boolean] }>()

const config = useRuntimeConfig()
const mount = useTemplateRef<HTMLElement>('mount')

const status = ref<'loading' | 'ready' | 'unavailable' | 'failed'>('loading')
const loadError = ref('')

/* eslint-disable-next-line ts/no-explicit-any */
type Any = any
let stripe: Any = null
let elements: Any = null

/** Stripe raisonne en cents ; le parent, en dollars. */
const cents = (value: number) => Math.round(value * 100)

async function init() {
  if (elements) return

  if (!config.public.stripePublishableKey) {
    status.value = 'unavailable'
    return
  }

  try {
    const Stripe = await loadStripeJs()
    stripe = Stripe(config.public.stripePublishableKey)

    elements = stripe.elements({
      mode: 'payment',
      amount: Math.max(cents(props.amount), 1),
      currency: props.currency.toLowerCase(),
      paymentMethodTypes: ['card'],
      appearance: stripeAppearance(),
    })

    const payment = elements.create('payment', { layout: 'tabs' })
    payment.on('change', (event: { complete: boolean }) => emit('update:complete', event.complete))
    payment.mount(mount.value)

    status.value = 'ready'
  }
  catch (error) {
    status.value = 'failed'
    loadError.value = (error as Error).message
  }
}

// Montage à la première ouverture de l'étape, puis plus jamais démonté.
watch(() => props.active, (active) => {
  if (active) nextTick(init)
}, { immediate: true })

// Le montant bouge avec la livraison : Stripe doit rester au courant.
watch(() => props.amount, (value) => {
  if (elements) elements.update({ amount: Math.max(cents(value), 1) })
})

defineExpose({
  ready: () => status.value === 'ready',

  /** Valide les champs de carte. Renvoie un message d'erreur, ou null. */
  async submit(): Promise<string | null> {
    if (!elements) return 'Le module de paiement n’est pas prêt.'
    const { error } = await elements.submit()
    return error?.message ?? null
  },

  /**
   * Débite la carte. Renvoie l'identifiant du paiement, ou un message.
   * `redirect: 'if_required'` garde le visiteur sur le site : sans moyen à
   * redirection, il n'y a rien à quitter.
   */
  async confirm(clientSecret: string, returnUrl: string) {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })

    if (error) return { error: error.message as string }
    return { id: paymentIntent.id as string }
  },
})
</script>

<template>
  <div>
    <div v-show="status === 'ready'" ref="mount" />

    <p v-if="status === 'loading'" class="text-[13px] text-tertiary-800">
      Chargement du paiement sécurisé…
    </p>

    <div
      v-else-if="status !== 'ready'"
      class="rounded-xl border border-secondary/40 bg-secondary/8 p-4 text-[13px] text-tertiary-500"
      role="alert"
    >
      <p v-if="status === 'unavailable'">
        Le paiement par carte n’est pas encore activé sur ce site.
      </p>
      <p v-else>
        Le module de paiement n’a pas pu se charger. Vérifiez votre connexion, puis réessayez.
        <span v-if="loadError" class="mt-1 block text-tertiary-800">{{ loadError }}</span>
      </p>
    </div>
  </div>
</template>
