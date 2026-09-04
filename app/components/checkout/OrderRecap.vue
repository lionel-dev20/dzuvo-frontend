<script setup lang="ts">
import type { ShippingMethod } from '#shared/types/checkout'
import { formatPrice } from '#shared/utils/format'

/** Récapitulatif figé de la commande, à droite du formulaire. */
defineProps<{ shipping: ShippingMethod | null, total: number }>()

const { state } = useCart()
const broken = reactive(new Set<number>())
</script>

<template>
  <aside class="rounded-2xl bg-primary p-5" aria-label="Récapitulatif de la commande">
    <h2 class="text-h4 font-bold text-tertiary-50">Votre commande</h2>
    <span class="mt-3 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />

    <ul class="mt-5 flex flex-col gap-3">
      <li v-for="line in state?.lines ?? []" :key="line.id" class="flex items-center gap-3">
        <span class="relative shrink-0">
          <span class="grid size-14 place-items-center overflow-hidden rounded-lg bg-primary-darker">
            <img
              v-if="line.image && !broken.has(line.id)"
              :src="line.image"
              :alt="line.name"
              class="size-full object-contain p-1.5"
              width="56"
              height="56"
              loading="lazy"
              @error="broken.add(line.id)"
            >
          </span>
          <span
            class="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-secondary text-[11px] font-bold text-on-accent"
            aria-hidden="true"
          >
            {{ line.quantity }}
          </span>
        </span>

        <p class="line-clamp-2 min-w-0 flex-1 text-[13px] text-tertiary-500">{{ line.name }}</p>
        <p class="shrink-0 text-[13px] font-bold text-tertiary-50 tabular-nums">
          {{ formatPrice(line.lineTotal) }}
        </p>
      </li>
    </ul>

    <hr class="my-5 border-tertiary-500/10">

    <dl class="flex flex-col gap-2 text-[13px]">
      <div class="flex items-baseline justify-between gap-4">
        <dt class="text-tertiary-800">Sous-total</dt>
        <dd class="text-tertiary-500 tabular-nums">{{ formatPrice(state?.totals.subtotal ?? 0) }}</dd>
      </div>

      <div v-if="state?.totals.discount" class="flex items-baseline justify-between gap-4">
        <dt class="text-tertiary-800">Code avantage</dt>
        <dd class="text-secondary tabular-nums">−{{ formatPrice(state.totals.discount) }}</dd>
      </div>

      <div class="flex items-baseline justify-between gap-4">
        <dt class="text-tertiary-800">Livraison</dt>
        <dd class="text-tertiary-500 tabular-nums">
          <template v-if="!shipping">À choisir</template>
          <template v-else-if="shipping.cost === 0">Offerte</template>
          <template v-else>{{ formatPrice(shipping.cost) }}</template>
        </dd>
      </div>

      <div class="mt-2 flex items-baseline justify-between gap-4 border-t border-tertiary-500/10 pt-4">
        <dt class="text-h4 font-bold text-tertiary-50">Total</dt>
        <dd class="text-h3 font-bold text-tertiary-50 tabular-nums">{{ formatPrice(total) }}</dd>
      </div>
    </dl>

    <NuxtLink to="/panier" class="mt-5 inline-block text-[13px] text-tertiary-800 underline underline-offset-4 hover:text-secondary">
      Modifier mon panier
    </NuxtLink>
  </aside>
</template>
