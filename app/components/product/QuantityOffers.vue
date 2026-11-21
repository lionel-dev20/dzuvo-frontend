<script setup lang="ts">
import type { QuantityOffer } from '#shared/types/catalog'
import { formatPrice } from '#shared/utils/format'
import { offerFor, priceLine } from '#shared/utils/offers'

/**
 * Choix du lot, en options radio illustrées : « Acheter 1 » au prix actuel,
 * puis « Acheter 2 » et « Acheter 3 » avec leur remise. Chaque carte montre
 * autant d'exemplaires du produit que d'articles du lot, côte à côte et reliés
 * par un « + » : le client voit que les articles s'additionnent.
 *
 * Choisir un lot règle la quantité ; la quantité modifiée au « + » active, de
 * son côté, le lot qui lui correspond. Les remises se règlent dans WooCommerce,
 * fiche produit, onglet Général.
 *
 * Les prix viennent de `priceLine`, la fonction que le serveur rejoue pour le
 * panier : ce qui s'affiche ici est ce qui sera facturé.
 */
const props = defineProps<{
  unitPrice: number
  offers: QuantityOffer[]
  modelValue: number
  /** Visuel du produit, répété sur chaque carte. */
  image?: string
  /** Texte alternatif : le nom du produit. */
  name?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [quantity: number] }>()

const id = useId()
const broken = ref(false)

/** Un lot « Acheter 1 » sans remise, puis un lot par offre. */
const tiers = computed(() => [
  { quantity: 1, percent: 0 },
  ...props.offers,
].map((tier) => {
  const priced = priceLine(props.unitPrice, tier.quantity, props.offers)
  return { ...tier, ...priced, each: priced.total / tier.quantity }
}))

const current = computed(() => offerFor(props.modelValue, props.offers)?.quantity ?? 1)

/** Au plus trois visuels : au-delà, la rangée déborderait de la carte (« × N » prend le relais). */
const MAX_VISIBLE = 3
const copies = (quantity: number) => Math.min(quantity, MAX_VISIBLE)
</script>

<template>
  <fieldset class="mt-6">
    <legend class="mb-3 text-body font-bold text-tertiary-50">Choisissez votre offre</legend>

    <div class="grid gap-3">
      <label
        v-for="tier in tiers"
        :key="tier.quantity"
        class="relative flex cursor-pointer items-start gap-3 rounded-2xl border bg-primary p-3 transition-colors focus-within:ring-2 focus-within:ring-secondary sm:gap-4 sm:p-4"
        :class="current === tier.quantity ? 'border-secondary' : 'border-tertiary-500/15 hover:border-tertiary-500/40'"
      >
        <input
          type="radio"
          :name="`lot-${id}`"
          class="sr-only"
          :value="tier.quantity"
          :checked="current === tier.quantity"
          @change="emit('update:modelValue', tier.quantity)"
        >

        <!-- Pastille de sélection -->
        <span
          class="mt-3 grid size-5 shrink-0 place-items-center rounded-full border-2 sm:mt-[18px]"
          :class="current === tier.quantity ? 'border-secondary' : 'border-tertiary-500/30'"
          aria-hidden="true"
        >
          <span v-if="current === tier.quantity" class="size-2.5 rounded-full bg-secondary" />
        </span>

        <span class="min-w-0 flex-1">
          <!-- Le produit, autant de fois que d'articles, séparé par des « + ». -->
          <span class="flex items-center gap-1.5 sm:gap-2" aria-hidden="true">
            <template v-for="n in copies(tier.quantity)" :key="n">
              <span v-if="n > 1" class="text-lg leading-none font-bold text-tertiary-800">+</span>
              <span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-tertiary-500/10 bg-primary-darker sm:size-14">
                <img
                  v-if="image && !broken"
                  :src="image"
                  :alt="name ?? ''"
                  class="size-full object-contain p-1"
                  width="56"
                  height="56"
                  loading="lazy"
                  @error="broken = true"
                >
              </span>
            </template>
            <span v-if="tier.quantity > MAX_VISIBLE" class="text-[13px] font-bold text-tertiary-800">× {{ tier.quantity }}</span>
          </span>

          <span class="mt-2 flex flex-wrap items-center gap-2">
            <span class="font-bold text-tertiary-50">Acheter {{ tier.quantity }}</span>
            <span
              v-if="tier.percent"
              class="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-on-accent"
            >
              -{{ String(tier.percent).replace('.', ',') }} %
            </span>
          </span>
          <span v-if="tier.saving" class="mt-0.5 block text-[13px] leading-snug text-tertiary-600">
            Économisez {{ formatPrice(tier.saving) }} · {{ formatPrice(tier.each) }} l’unité
          </span>
          <span v-else class="mt-0.5 block text-[13px] text-tertiary-800">Prix actuel</span>
        </span>

        <span class="mt-1.5 shrink-0 text-right sm:mt-3.5">
          <span v-if="tier.saving" class="block text-[12px] text-tertiary-800 line-through">{{ formatPrice(tier.fullTotal) }}</span>
          <span class="block font-bold text-tertiary-50 tabular-nums">{{ formatPrice(tier.total) }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
