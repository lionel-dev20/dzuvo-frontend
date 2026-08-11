<script setup lang="ts">
import { CANADA_PROVINCES, formatPostcodeCA, validateAddress } from '#shared/utils/validation'
import { deliveryCities, findCity } from '#shared/config/cities'
import { formatPrice } from '#shared/utils/format'

/**
 * Tunnel de commande en trois étapes repliables, sur une seule page.
 *
 * Une étape remplie ouvre la suivante, mais rien n'est verrouillé : chaque
 * en-tête reste cliquable, y compris pour revenir en arrière ou sauter en
 * avant. On guide sans enfermer.
 *
 * La commande WooCommerce n'existe qu'à la validation, et c'est le serveur,
 * jamais le navigateur, qui décide qu'un paiement a abouti.
 */
const cart = useCart()
const {
  address, note, shippingId, methods, method, total,
  errors, formError, paying, honeypot,
  loadShipping, prefill, validate, openSession, confirm, reset,
} = useCheckout()
const { user, loaded, fetchUser } = useAuth()

const card = useTemplateRef<{
  ready: () => boolean
  submit: () => Promise<string | null>
  confirm: (secret: string, url: string) => Promise<{ id?: string, error?: string }>
}>('card')

await cart.sync()

/** Commande passée : le panier se vide, sans renvoyer vers la page panier. */
const completed = ref(false)

watchEffect(() => {
  if (import.meta.client && cart.isEmpty.value && !paying.value && !completed.value) {
    navigateTo('/panier')
  }
})

onMounted(async () => {
  if (!loaded.value) await fetchUser()
  prefill(user.value)
  await loadShipping()
})

// Le tarif dépend de la province : on recharge les méthodes à chaque changement.
watch(() => address.value.state, () => loadShipping())

/** Normalise le code postal à la sortie du champ : « h2x1y4 » → « H2X 1Y4 ». */
function normalizePostcode() {
  address.value.postcode = formatPostcodeCA(address.value.postcode)
}

/* ---------- Ville, quartier, province ---------- */

/*
 * La ville se choisit dans la liste des villes desservies : c'est elle qui
 * détermine les quartiers proposés et la province, qu'on cesse alors de
 * demander. L'option « Autre ville » garde la porte ouverte au reste du
 * Canada — la boutique y livre aussi, sans découpage par quartier.
 */
const OTHER_CITY = '__autre'
const otherCity = ref(false)

const citySelection = computed({
  get: () => (otherCity.value ? OTHER_CITY : (findCity(address.value.city)?.name ?? '')),
  set: (value: string) => {
    otherCity.value = value === OTHER_CITY
    // Changer de ville invalide le quartier : ceux d'ailleurs n'ont pas cours.
    address.value.district = ''

    const city = otherCity.value ? null : findCity(value)
    address.value.city = city?.name ?? ''
    if (city) address.value.state = city.province
  },
})

const currentCity = computed(() => findCity(address.value.city))
const provinceName = computed(() =>
  CANADA_PROVINCES.find(p => p.code === address.value.state)?.name ?? '',
)

const cityOptions = computed(() => [
  ...deliveryCities.map(city => ({ value: city.name, label: city.name })),
  { value: OTHER_CITY, label: 'Autre ville…' },
])

/* ---------- Étapes repliables ---------- */

const openStep = ref(1)

/** Complétude par étape, mesurée sur la validation partagée. */
const invalid = computed(() => validateAddress(address.value))

const contactDone = computed(() =>
  !invalid.value.firstName && !invalid.value.lastName && !invalid.value.email && !invalid.value.phone,
)
const deliveryDone = computed(() =>
  !invalid.value.address1 && !invalid.value.city && !invalid.value.district
  && !invalid.value.state && !invalid.value.postcode && Boolean(shippingId.value),
)

/** Résumés affichés une fois l'étape repliée. */
const contactSummary = computed(() => {
  const a = address.value
  return [`${a.firstName} ${a.lastName}`.trim(), a.email, a.phone].filter(Boolean).join(' · ')
})
const deliverySummary = computed(() => {
  const a = address.value
  const line = [a.address1, a.district, a.city, [a.state, a.postcode].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ')
  return [line, method.value?.label].filter(Boolean).join(' · ')
})

const contactPanel = useTemplateRef<HTMLElement>('contactPanel')
const deliveryPanel = useTemplateRef<HTMLElement>('deliveryPanel')

/* Chaque étape ne s'ouvre d'elle-même qu'une fois : passé ce premier coup de
   pouce, la navigation appartient au visiteur. */
const advanced = reactive(new Set<number>())

/**
 * Ouvre l'étape suivante — mais jamais pendant que le visiteur écrit encore
 * dans celle-ci : un champ qui devient valide au milieu d'une saisie ferait
 * disparaître le formulaire sous les doigts.
 */
function maybeAdvance(step: 1 | 2) {
  if (openStep.value !== step || advanced.has(step)) return
  if (!(step === 1 ? contactDone.value : deliveryDone.value)) return

  const panel = step === 1 ? contactPanel.value : deliveryPanel.value
  if (panel?.contains(document.activeElement)) return

  advanced.add(step)
  openStep.value = step + 1
}

/** Saisie terminée puis sortie de l'étape : c'est le moment d'avancer. */
function onLeave(step: 1 | 2) {
  // Le temps que le focus se pose sur sa nouvelle cible.
  setTimeout(() => maybeAdvance(step), 0)
}

// Remplissage automatique du navigateur : rien ne perd le focus, on surveille.
watch([contactDone, deliveryDone], () => {
  setTimeout(() => {
    maybeAdvance(1)
    maybeAdvance(2)
  }, 400)
})

/**
 * Ouvre ou replie une étape à la demande. Aucune étape n'en marque une autre
 * comme « déjà avancée » : les garde-fous de `maybeAdvance` suffisent, et
 * marquer ici priverait l'étape ouverte de son propre enchaînement.
 */
function toggle(step: number) {
  openStep.value = openStep.value === step ? 0 : step
}

/** Bouton « Continuer » : on passe à la suite et on renonce à l'automatisme. */
function continueFrom(step: 1 | 2) {
  advanced.add(step)
  openStep.value = step + 1
}

/* ---------- Conditions de paiement ---------- */

/** Complétude de la carte : Stripe seul la connaît, il nous la signale. */
const cardDone = ref(false)

const canPay = computed(() => contactDone.value && deliveryDone.value && cardDone.value)

/**
 * Un bouton désactivé sans explication est une impasse : on nomme ce qui
 * manque encore, dans l'ordre des étapes.
 */
const missing = computed(() => {
  const gaps: string[] = []
  if (!contactDone.value) gaps.push('vos coordonnées')
  if (!deliveryDone.value) gaps.push(shippingId.value ? 'votre adresse de livraison' : 'votre adresse et votre mode de livraison')
  if (!cardDone.value) gaps.push('vos informations de carte')

  if (!gaps.length) return ''
  const last = gaps.pop()
  return gaps.length ? `${gaps.join(', ')} et ${last}` : last!
})

async function pay() {
  if (paying.value) return
  formError.value = null

  if (!validate()) {
    // Une erreur dans une étape repliée resterait invisible : on la déplie.
    openStep.value = contactDone.value ? 2 : 1
    await nextTick()
    document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  if (!card.value?.ready()) {
    openStep.value = 3
    formError.value = 'Le paiement par carte n’est pas disponible pour le moment.'
    return
  }

  paying.value = true

  try {
    // 1. Stripe valide la carte avant qu'aucune commande ne soit créée.
    const invalidCard = await card.value.submit()
    if (invalidCard) {
      openStep.value = 3
      formError.value = invalidCard
      return
    }

    // 2. Le serveur crée la commande WooCommerce et arrête le montant.
    const session = await openSession()

    // 3. Débit de la carte.
    const result = await card.value.confirm(
      session.clientSecret,
      `${window.location.origin}/commande/confirmation?order=${session.orderId}&key=${session.orderKey}`,
    )
    if (result.error || !result.id) {
      formError.value = result.error ?? 'Le paiement n’a pas abouti.'
      return
    }

    // 4. Le serveur revérifie auprès de Stripe et encaisse la commande.
    const order = await confirm(result.id)

    completed.value = true
    cart.clear()
    reset()
    await navigateTo(`/commande/confirmation?order=${order.id}&key=${session.orderKey}`)
  }
  catch (error) {
    const data = (error as { data?: { data?: { errors?: Record<string, string> } } }).data?.data
    if (data?.errors) errors.value = data.errors
    formError.value = checkoutErrorMessage(error)
  }
  finally {
    paying.value = false
  }
}

useSeo({
  title: 'Finaliser ma commande',
  description: 'Coordonnées, livraison et paiement sécurisé par carte bancaire.',
  noindex: true,
})
</script>

<template>
  <div class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <nav aria-label="Étapes" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/panier" class="hover:text-secondary">Panier</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="step" class="font-medium text-tertiary-500">Commande</li>
        <li aria-hidden="true">/</li>
        <li>Confirmation</li>
      </ol>
    </nav>

    <h1 class="text-h2 font-bold text-tertiary-50">Finaliser ma commande</h1>
    <span class="mt-3 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />

    <form class="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10" novalidate @submit.prevent="pay">
      <div class="flex flex-col gap-4">
        <!-- 1. Coordonnées -->
        <CheckoutStep
          :step="1"
          title="Vos coordonnées"
          :summary="contactSummary"
          :complete="contactDone"
          :open="openStep === 1"
          @toggle="toggle(1)"
        >
          <div ref="contactPanel" @focusout="onLeave(1)">
            <div class="grid gap-4 sm:grid-cols-2">
              <CheckoutField
                v-model="address.firstName"
                label="Prénom" name="firstName" autocomplete="given-name" :error="errors.firstName"
              />
              <CheckoutField
                v-model="address.lastName"
                label="Nom" name="lastName" autocomplete="family-name" :error="errors.lastName"
              />
              <CheckoutField
                v-model="address.email"
                label="Courriel" name="email" type="email" inputmode="email" autocomplete="email"
                placeholder="vous@exemple.ca" :error="errors.email"
              />
              <CheckoutField
                v-model="address.phone"
                label="Téléphone" name="phone" type="tel" inputmode="tel" autocomplete="tel"
                placeholder="514 555 0199" :error="errors.phone"
              />
            </div>

            <p class="mt-3 text-[11px] text-tertiary-800">
              Le téléphone sert au transporteur pour vous prévenir à la livraison.
            </p>

            <button type="button" class="btn-primary mt-5" @click="continueFrom(1)">
              Continuer
            </button>
          </div>
        </CheckoutStep>

        <!-- 2. Livraison -->
        <CheckoutStep
          :step="2"
          title="Adresse de livraison"
          :summary="deliverySummary"
          :complete="deliveryDone"
          :open="openStep === 2"
          @toggle="toggle(2)"
        >
          <div ref="deliveryPanel" @focusout="onLeave(2)">
            <div class="grid gap-4">
              <CheckoutField
                v-model="address.address1"
                label="Adresse" name="address1" autocomplete="address-line1"
                placeholder="1250 rue Sainte-Catherine O" :error="errors.address1"
              />
              <CheckoutField
                v-model="address.address2"
                label="Appartement, bureau" name="address2" autocomplete="address-line2" optional
              />

              <div class="grid gap-4 sm:grid-cols-3">
                <!-- Ville desservie : elle fixe la province et les quartiers. -->
                <CheckoutSelect
                  v-model="citySelection"
                  label="Ville" name="city" :options="cityOptions" :error="errors.city"
                  :hint="currentCity ? provinceName : undefined"
                />

                <!-- Quartiers de cette ville-là, et d'aucune autre. -->
                <CheckoutSelect
                  v-if="currentCity"
                  v-model="address.district"
                  label="Quartier" name="district" :options="currentCity.districts" :error="errors.district"
                />

                <CheckoutField
                  v-model="address.postcode"
                  label="Code postal" name="postcode" autocomplete="postal-code"
                  placeholder="H2X 1Y4" :error="errors.postcode"
                  @blur="normalizePostcode"
                />
              </div>

              <!-- Hors des villes desservies : saisie libre, province à préciser. -->
              <div v-if="otherCity" class="grid gap-4 sm:grid-cols-2">
                <CheckoutField
                  v-model="address.city"
                  label="Votre ville" name="city-libre" autocomplete="address-level2" :error="errors.city"
                />
                <CheckoutSelect
                  v-model="address.state"
                  label="Province" name="state" autocomplete="address-level1"
                  :options="CANADA_PROVINCES.map(p => ({ value: p.code, label: p.name }))"
                  :error="errors.state"
                />
              </div>

              <CheckoutField
                v-model="address.company"
                label="Entreprise" name="company" autocomplete="organization" optional
              />
            </div>

            <h3 class="mt-7 text-[13px] font-bold text-tertiary-50">Mode de livraison</h3>

            <p v-if="!methods.length" class="mt-3 text-[13px] text-tertiary-800">
              Choisissez d’abord votre province pour voir les options de livraison.
            </p>

            <ul v-else class="mt-3 flex flex-col gap-2">
              <li v-for="option in methods" :key="option.id">
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-btn border p-4 transition-colors"
                  :class="shippingId === option.id
                    ? 'border-secondary bg-secondary/8'
                    : 'border-tertiary-500/14 hover:border-tertiary-500/30'"
                >
                  <input v-model="shippingId" type="radio" name="shipping" :value="option.id" class="size-4 accent-secondary">
                  <span class="min-w-0 flex-1">
                    <span class="block text-[13px] font-bold text-tertiary-50">{{ option.label }}</span>
                    <span class="block text-[11px] text-tertiary-800">{{ option.description }}</span>
                  </span>
                  <span class="shrink-0 text-[13px] font-bold" :class="option.cost ? 'text-tertiary-50' : 'text-secondary'">
                    {{ option.cost ? formatPrice(option.cost) : 'Offerte' }}
                  </span>
                </label>
              </li>
            </ul>

            <div class="mt-5">
              <label for="note" class="mb-1.5 block text-[13px] font-medium text-tertiary-600">
                Consigne de livraison <span class="text-tertiary-800">(facultatif)</span>
              </label>
              <textarea
                id="note" v-model="note" name="note" rows="2" class="field resize-y"
                placeholder="Code d’entrée, étage, point de dépôt…"
              />
            </div>

            <button type="button" class="btn-primary mt-5" @click="continueFrom(2)">
              Continuer
            </button>
          </div>
        </CheckoutStep>

        <!-- 3. Paiement -->
        <CheckoutStep
          :step="3"
          title="Paiement par carte"
          summary="Carte bancaire"
          :open="openStep === 3"
          @toggle="toggle(3)"
        >
          <p class="flex items-start gap-2 text-[11px] text-tertiary-800">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" class="mt-0.5 shrink-0 text-secondary" aria-hidden="true">
              <path d="M10 1.8 3.5 4.4v4.9c0 4 2.8 7.2 6.5 8.9 3.7-1.7 6.5-4.9 6.5-8.9V4.4L10 1.8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
            Vos données bancaires sont transmises chiffrées à notre prestataire de paiement. Ce site ne les voit jamais.
          </p>

          <div class="mt-5">
            <CardPayment
              ref="card"
              :amount="total"
              currency="CAD"
              :active="openStep === 3"
              @update:complete="cardDone = $event"
            />
          </div>
        </CheckoutStep>

        <!-- Champ piège anti-robot : hors écran, jamais rempli par un humain. -->
        <div class="absolute left-[-9999px]" aria-hidden="true">
          <label for="company-extra">Ne pas remplir</label>
          <input id="company-extra" v-model="honeypot" type="text" tabindex="-1" autocomplete="off">
        </div>

        <p
          v-if="formError"
          class="rounded-xl border border-secondary/40 bg-secondary/8 p-4 text-body text-tertiary-50"
          role="alert"
        >
          {{ formError }}
        </p>

        <button
          type="submit"
          class="btn-primary mt-2 w-full justify-center py-3.5"
          :disabled="paying || !canPay"
        >
          {{ paying ? 'Paiement en cours…' : `Payer ${formatPrice(total)}` }}
        </button>

        <!-- Ce qui retient encore le paiement, nommé plutôt que deviné. -->
        <p v-if="missing" class="text-center text-[11px] text-tertiary-800" aria-live="polite">
          Il reste à renseigner {{ missing }}.
        </p>
        <p v-else class="text-center text-[11px] text-tertiary-800">
          En validant, vous acceptez nos conditions générales de vente.
        </p>
      </div>

      <OrderRecap
        class="lg:sticky lg:top-[calc(var(--spacing-header)+1rem)]"
        :shipping="method"
        :total="total"
      />
    </form>
  </div>
</template>
