<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'

/**
 * Récapitulatif : ce que le visiteur paie, et le bouton qui l'y emmène.
 * Les montants viennent tous de /api/cart — rien n'est recalculé ici.
 */
const { state, pending, error, applyCoupon, removeCoupon, checkout } = useCart()
const { user, loaded, fetchUser } = useAuth()

const draftCoupon = ref('')
const couponPending = ref(false)

const totals = computed(() => state.value?.totals)

async function submitCoupon() {
  const code = draftCoupon.value.trim()
  if (!code || couponPending.value) return

  couponPending.value = true
  const ok = await applyCoupon(code)
  couponPending.value = false

  // Code accepté : le champ se vide, la ligne de remise prend le relais.
  if (ok) draftCoupon.value = ''
}

onMounted(() => {
  if (!loaded.value) fetchUser()
})
</script>

<template>
  <aside class="flex flex-col gap-4" aria-label="Récapitulatif de la commande">
    <h2 class="text-h3 font-bold text-tertiary-50">Récapitulatif</h2>

    <!-- Fidélité : proposée seulement à qui n'est pas encore identifié. -->
    <div v-if="loaded && !user" class="rounded-2xl bg-primary p-5 text-center">
      <p class="text-[11px] font-bold tracking-[0.14em] text-tertiary-800 uppercase">
        Programme de fidélité
      </p>
      <p class="mt-3 text-body font-bold text-tertiary-50">Club DZUVO</p>
      <p class="mt-2 text-[13px] text-tertiary-800">
        Connectez-vous pour utiliser votre cagnotte dès maintenant.
      </p>
      <NuxtLink to="/connexion" class="mt-3 inline-block text-[13px] font-bold text-secondary underline underline-offset-4">
        Me connecter
      </NuxtLink>
    </div>

    <div class="rounded-2xl bg-primary p-5">
      <!-- Code avantage -->
      <p class="text-body font-bold text-tertiary-50">Un code avantage ?</p>

      <form v-if="!state?.coupon" class="mt-3 flex items-center gap-2" @submit.prevent="submitCoupon">
        <input
          v-model="draftCoupon"
          type="text"
          name="coupon"
          autocomplete="off"
          spellcheck="false"
          placeholder="Saisir le code"
          aria-label="Code avantage"
          class="field flex-1 !py-2.5 uppercase"
          :class="state?.couponError ? 'field-invalid' : ''"
        >
        <button
          type="submit"
          class="shrink-0 cursor-pointer px-1 text-[13px] font-bold text-secondary disabled:opacity-50"
          :disabled="couponPending || !draftCoupon.trim()"
        >
          {{ couponPending ? '…' : 'Appliquer' }}
        </button>
      </form>

      <div v-else class="mt-3 flex items-center justify-between gap-3 rounded-btn border border-secondary/40 bg-secondary/8 px-3 py-2.5">
        <span class="min-w-0 truncate text-[13px] font-bold text-tertiary-50 uppercase">{{ state.coupon.code }}</span>
        <span class="shrink-0 text-[13px] font-bold text-secondary">{{ state.coupon.label }}</span>
        <button
          type="button"
          class="shrink-0 cursor-pointer text-tertiary-800 transition-colors hover:text-secondary"
          aria-label="Retirer le code avantage"
          @click="removeCoupon()"
        >
          ✕
        </button>
      </div>

      <p v-if="state?.couponError" class="mt-2 text-[11px] text-secondary">{{ state.couponError }}</p>

      <hr class="my-5 border-tertiary-500/10">

      <!-- Totaux -->
      <dl class="flex flex-col gap-2 text-body">
        <div class="flex items-baseline justify-between gap-4">
          <dt class="text-tertiary-800">Sous-total</dt>
          <dd class="font-medium text-tertiary-500 tabular-nums">{{ formatPrice(totals?.subtotal ?? 0) }}</dd>
        </div>

        <div v-if="totals?.discount" class="flex items-baseline justify-between gap-4">
          <dt class="text-tertiary-800">Code avantage</dt>
          <dd class="font-medium text-secondary tabular-nums">−{{ formatPrice(totals.discount) }}</dd>
        </div>

        <div class="mt-2 flex items-baseline justify-between gap-4 border-t border-tertiary-500/10 pt-4">
          <dt class="text-h4 font-bold text-tertiary-50">Total</dt>
          <dd class="text-h3 font-bold text-tertiary-50 tabular-nums">{{ formatPrice(totals?.total ?? 0) }}</dd>
        </div>
      </dl>

      <p v-if="(totals?.savings ?? 0) + (totals?.discount ?? 0) > 0" class="mt-3 border-l-2 border-secondary pl-3 text-[13px] text-tertiary-600">
        Avec cet achat, vous économisez
        <strong class="font-bold text-tertiary-50">{{ formatPrice((totals?.savings ?? 0) + (totals?.discount ?? 0)) }}</strong>
      </p>

      <p class="mt-3 text-[11px] text-tertiary-800">
        Livraison calculée à l’étape suivante.
      </p>

      <button
        type="button"
        class="btn-primary mt-4 w-full justify-center"
        :disabled="pending || !totals?.count"
        @click="checkout()"
      >
        {{ pending ? 'Un instant…' : 'Passer la commande' }}
      </button>

      <p v-if="error" class="mt-3 text-[13px] text-secondary" role="alert">{{ error }}</p>
    </div>

    <div class="flex items-start gap-3 rounded-2xl bg-primary p-5">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="mt-0.5 shrink-0 text-secondary" aria-hidden="true">
        <path d="M10 1.8 3.5 4.4v4.9c0 4 2.8 7.2 6.5 8.9 3.7-1.7 6.5-4.9 6.5-8.9V4.4L10 1.8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="m7.2 10 2 2 3.6-3.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div>
        <p class="text-[13px] font-bold text-tertiary-50">Paiement sécurisé</p>
        <p class="mt-1 text-[11px] text-tertiary-800">
          Le règlement s’effectue sur notre plateforme de paiement. Aucune donnée bancaire n’est conservée par le site.
        </p>
      </div>
    </div>
  </aside>
</template>
