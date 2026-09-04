<script setup lang="ts">
/**
 * Champs de carte bancaire, fournis par Stripe.
 *
 * Le numéro de carte est saisi dans une iframe appartenant à Stripe : il ne
 * touche ni ce composant, ni notre serveur. Le site ne manipule qu'un
 * identifiant de paiement, ce qui le garde dans le périmètre PCI SAQ-A.
 *
 * Trois champs séparés — numéro, échéance, cryptogramme — et non le « Payment
 * Element » d'un seul bloc. Ce dernier impose sa propre mise en page et lui
 * ajoute deux choses qu'aucune option ne retire : la proposition Link
 * (« Enregistrer mes informations pour un paiement plus rapide ») et un bloc
 * d'adresse de facturation avec sélecteur de pays. Les deux sont demandées
 * ailleurs dans le tunnel ou n'ont pas lieu d'être ; les laisser, c'est
 * détourner l'attention au moment le plus délicat du parcours.
 *
 * Avec les champs séparés, la mise en page nous appartient : le numéro occupe
 * une ligne, l'échéance et le cryptogramme se partagent la suivante — la même
 * disposition sur mobile et sur ordinateur, sans point de rupture.
 *
 * Montage en mode différé : les champs existent avant qu'aucune commande ne
 * soit créée. Le parent orchestre — `submit()` vérifie la saisie, puis il crée
 * la commande, puis `confirm()` débite.
 */
const props = defineProps<{
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

const numberMount = useTemplateRef<HTMLElement>('numberMount')
const expiryMount = useTemplateRef<HTMLElement>('expiryMount')
const cvcMount = useTemplateRef<HTMLElement>('cvcMount')

const status = ref<'loading' | 'ready' | 'unavailable' | 'failed'>('loading')
const loadError = ref('')

/** Message d'erreur par champ, tel que Stripe le formule. */
const fieldError = reactive<Record<Slot, string>>({ number: '', expiry: '', cvc: '' })
/** Complétude par champ : la carte n'est prête que lorsque les trois le sont. */
const filled = reactive<Record<Slot, boolean>>({ number: false, expiry: false, cvc: false })

type Slot = 'number' | 'expiry' | 'cvc'

/* eslint-disable-next-line ts/no-explicit-any */
type Any = any
let stripe: Any = null
let elements: Any = null
let cardNumber: Any = null

async function init() {
  if (elements) return

  if (!config.public.stripePublishableKey) {
    status.value = 'unavailable'
    return
  }

  try {
    const Stripe = await loadStripeJs()
    stripe = Stripe(config.public.stripePublishableKey)
    elements = stripe.elements()

    const style = stripeCardStyle()

    /*
     * `showIcon` affiche la marque de la carte dans le champ dès que Stripe la
     * reconnaît : c'est la confirmation la plus immédiate que la saisie est
     * comprise, et elle évite d'avoir à afficher une rangée de logos.
     */
    cardNumber = elements.create('cardNumber', { style, showIcon: true, placeholder: '1234 1234 1234 1234' })
    const expiry = elements.create('cardExpiry', { style, placeholder: 'MM / AA' })
    const cvc = elements.create('cardCvc', { style, placeholder: '123' })

    watchField(cardNumber, 'number')
    watchField(expiry, 'expiry')
    watchField(cvc, 'cvc')

    cardNumber.mount(numberMount.value)
    expiry.mount(expiryMount.value)
    cvc.mount(cvcMount.value)

    status.value = 'ready'
  }
  catch (error) {
    status.value = 'failed'
    loadError.value = (error as Error).message
  }
}

/** Un champ Stripe rapporte son état à chaque frappe ; on le relaie au parent. */
function watchField(element: Any, slot: Slot) {
  element.on('change', (event: { complete: boolean, error?: { message: string } }) => {
    filled[slot] = event.complete
    // L'erreur ne s'affiche qu'une fois la saisie posée : Stripe la signale dès
    // le premier caractère, ce qui reviendrait à reprocher une carte en cours
    // de frappe.
    fieldError[slot] = event.error?.message ?? ''
    emit('update:complete', complete.value)
  })
}

const complete = computed(() => filled.number && filled.expiry && filled.cvc)

// Montage à la première ouverture de l'étape, puis plus jamais démonté.
watch(() => props.active, (active) => {
  if (active) nextTick(init)
}, { immediate: true })

/** Cadre commun aux trois champs : le même que les champs du formulaire. */
const box = 'field'
const label = 'mb-1.5 block text-[13px] font-medium text-tertiary-600'

defineExpose({
  ready: () => status.value === 'ready',

  /** Vérifie la saisie avant qu'aucune commande ne soit créée. */
  async submit(): Promise<string | null> {
    if (status.value !== 'ready') return 'Le module de paiement n’est pas prêt.'

    const first = fieldError.number || fieldError.expiry || fieldError.cvc
    if (first) return first
    if (!complete.value) return 'Merci de compléter les informations de votre carte.'

    return null
  },

  /**
   * Débite la carte. Renvoie l'identifiant du paiement, ou un message.
   *
   * `return_url` n'est fourni que pour les cartes qui imposent une
   * authentification 3-D Secure hors page ; sans elle, le visiteur ne quitte
   * jamais le site.
   */
  async confirm(clientSecret: string, returnUrl: string) {
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardNumber },
      return_url: returnUrl,
    })

    if (error) return { error: error.message as string }
    return { id: paymentIntent.id as string }
  },
})
</script>

<template>
  <div>
    <div v-show="status === 'ready'" class="flex flex-col gap-4">
      <!-- Le numéro seul sur sa ligne : c'est le champ le plus long, et le
           couper le rendrait pénible à relire. -->
      <div>
        <label :class="label" for="card-number">Numéro de carte</label>
        <div id="card-number" ref="numberMount" :class="box" />
        <p v-if="fieldError.number" class="mt-1.5 text-[11px] text-secondary" role="alert">
          {{ fieldError.number }}
        </p>
      </div>

      <!-- Échéance et cryptogramme côte à côte : deux champs courts, une seule
           ligne, à toutes les largeurs. Pas de point de rupture — sur un
           téléphone, les empiler ferait défiler une saisie de six caractères. -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label :class="label" for="card-expiry">Expiration</label>
          <div id="card-expiry" ref="expiryMount" :class="box" />
          <p v-if="fieldError.expiry" class="mt-1.5 text-[11px] text-secondary" role="alert">
            {{ fieldError.expiry }}
          </p>
        </div>

        <div>
          <label :class="label" for="card-cvc">Cryptogramme</label>
          <div id="card-cvc" ref="cvcMount" :class="box" />
          <p v-if="fieldError.cvc" class="mt-1.5 text-[11px] text-secondary" role="alert">
            {{ fieldError.cvc }}
          </p>
        </div>
      </div>
    </div>

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
