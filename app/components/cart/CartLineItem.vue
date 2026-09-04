<script setup lang="ts">
import type { CartLine } from '#shared/types/cart'
import { formatPrice } from '#shared/utils/format'

/** Une ligne du panier : le produit, son prix, sa quantité, sa suppression. */
const props = defineProps<{ line: CartLine }>()

const emit = defineEmits<{
  quantity: [quantity: number]
  remove: []
}>()

const broken = ref(false)

const ceiling = computed(() => props.line.maxQuantity ?? 99)
const atMax = computed(() => props.line.quantity >= ceiling.value)

/** Prix barré et remise ne s'affichent que si le produit est réellement soldé. */
const discount = computed(() =>
  props.line.regularPrice
    ? Math.round((1 - props.line.price / props.line.regularPrice) * 100)
    : 0,
)

const stepper = 'grid size-9 place-items-center text-tertiary-500 transition-colors hover:text-secondary disabled:cursor-default disabled:opacity-30 disabled:hover:text-tertiary-500'
</script>

<template>
  <article class="flex gap-4 rounded-2xl bg-primary p-4">
    <NuxtLink
      :to="`/produits/${line.slug}`"
      class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-darker md:size-24"
    >
      <img
        v-if="line.image && !broken"
        :src="line.image"
        :alt="line.name"
        class="size-full object-contain p-2"
        width="96"
        height="96"
        loading="lazy"
        @error="broken = true"
      >
      <svg v-else width="26" height="26" viewBox="0 0 20 20" fill="none" class="text-tertiary-800" aria-hidden="true">
        <path d="M3 4h2l1.6 9.2a1.5 1.5 0 0 0 1.5 1.3h6.9a1.5 1.5 0 0 0 1.5-1.2L18 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </NuxtLink>

    <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-between sm:gap-6">
      <div class="min-w-0">
        <NuxtLink
          :to="`/produits/${line.slug}`"
          class="line-clamp-2 text-body font-bold text-tertiary-50 hover:text-secondary"
        >
          {{ line.name }}
        </NuxtLink>
        <p v-if="line.sku" class="mt-1 text-[11px] text-tertiary-800">Réf. {{ line.sku }}</p>
        <p v-if="line.quantity > 1" class="mt-1 text-[11px] text-tertiary-800">
          {{ formatPrice(line.price) }} l’unité
        </p>
      </div>

      <div class="flex shrink-0 items-end justify-between gap-4 sm:flex-col sm:items-end">
        <div class="text-right">
          <div v-if="line.regularPrice" class="flex items-center justify-end gap-2">
            <span class="text-[11px] text-tertiary-800 line-through">
              {{ formatPrice(line.regularPrice * line.quantity) }}
            </span>
            <span class="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-on-accent">
              -{{ discount }} %
            </span>
          </div>
          <p class="text-h3 leading-tight font-bold" :class="line.regularPrice ? 'text-secondary' : 'text-tertiary-50'">
            {{ formatPrice(line.lineTotal) }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="grid size-9 place-items-center rounded-btn border border-tertiary-500/15 text-tertiary-800 transition-colors hover:border-secondary hover:text-secondary"
            :aria-label="`Retirer ${line.name} du panier`"
            @click="emit('remove')"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.7 9.2a1 1 0 0 0 1 .8h4.6a1 1 0 0 0 1-.8L12 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <div class="flex items-center rounded-btn border border-tertiary-500/15">
            <button
              type="button"
              :class="stepper"
              :aria-label="`Retirer une unité de ${line.name}`"
              @click="emit('quantity', line.quantity - 1)"
            >
              −
            </button>
            <span class="w-9 text-center text-tertiary-50 tabular-nums" aria-live="polite">{{ line.quantity }}</span>
            <button
              type="button"
              :class="stepper"
              :disabled="atMax"
              :aria-label="`Ajouter une unité de ${line.name}`"
              @click="emit('quantity', line.quantity + 1)"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- Le plafond de stock s'annonce au moment où il bloque, pas avant. -->
  <p v-if="atMax && line.maxQuantity" class="mt-1.5 pl-1 text-[11px] text-tertiary-800">
    Stock limité : {{ line.maxQuantity }} exemplaire{{ line.maxQuantity > 1 ? 's' : '' }} disponible{{ line.maxQuantity > 1 ? 's' : '' }}.
  </p>
</template>
