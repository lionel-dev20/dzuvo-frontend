<script setup lang="ts">
import type { QuantityOffer } from '#shared/types/catalog'
import { formatPrice } from '#shared/utils/format'
import { offerFor, priceLine } from '#shared/utils/offers'

/**
 * Choix du lot, à la manière des boutiques Shopify : « 1 article », puis
 * « 2 articles, -10 % »… Choisir un lot règle la quantité ; la quantité saisie
 * au clavier (ou au « + ») active, de son côté, le lot qui lui correspond.
 *
 * Les prix viennent de `priceLine`, la fonction que le serveur rejoue pour le
 * panier : ce qui s'affiche ici est ce qui sera facturé.
 */
const props = defineProps<{
  unitPrice: number
  offers: QuantityOffer[]
  modelValue: number
}>()

const emit = defineEmits<{ 'update:modelValue': [quantity: number] }>()

const id = useId()

/** Un lot « 1 article » sans offre, puis un lot par offre. */
const tiers = computed(() => [
  { quantity: 1, percent: 0 },
  ...props.offers,
].map((tier) => {
  const priced = priceLine(props.unitPrice, tier.quantity, props.offers)
  return { ...tier, ...priced, each: priced.total / tier.quantity }
}))

const current = computed(() => offerFor(props.modelValue, props.offers)?.quantity ?? 1)
</script>

<template>
  <fieldset class="mt-6">
    <legend class="mb-3 text-body font-bold text-tertiary-50">Choisissez votre quantité</legend>

    <div class="grid gap-3">
      <label
        v-for="tier in tiers"
        :key="tier.quantity"
        class="relative flex cursor-pointer items-center gap-4 rounded-2xl border bg-primary p-4 transition-colors focus-within:ring-2 focus-within:ring-secondary"
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
          class="grid size-5 shrink-0 place-items-center rounded-full border-2"
          :class="current === tier.quantity ? 'border-secondary' : 'border-tertiary-500/30'"
          aria-hidden="true"
        >
          <span v-if="current === tier.quantity" class="size-2.5 rounded-full bg-secondary" />
        </span>

        <span class="min-w-0 flex-1">
          <span class="flex flex-wrap items-center gap-2">
            <span class="font-bold text-tertiary-50">
              {{ tier.quantity === 1 ? '1 article' : `${tier.quantity} articles` }}
            </span>
            <span
              v-if="tier.percent"
              class="rounded bg-secondary px-2 py-0.5 text-[11px] font-bold text-on-accent"
            >
              -{{ String(tier.percent).replace('.', ',') }} %
            </span>
          </span>
          <span v-if="tier.saving" class="mt-0.5 block text-[13px] text-tertiary-600">
            Vous économisez {{ formatPrice(tier.saving) }} · {{ formatPrice(tier.each) }} l’unité
          </span>
          <span v-else class="mt-0.5 block text-[13px] text-tertiary-800">Prix à l’unité</span>
        </span>

        <span class="shrink-0 text-right">
          <span v-if="tier.saving" class="block text-[12px] text-tertiary-800 line-through">{{ formatPrice(tier.fullTotal) }}</span>
          <span class="block font-bold text-tertiary-50 tabular-nums">{{ formatPrice(tier.total) }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
