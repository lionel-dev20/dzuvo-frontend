<script setup lang="ts">
import type { CatalogProduct } from '#shared/types/catalog'
import { formatPrice } from '#shared/utils/format'

/**
 * Ventes croisées compactes : image, note, prix, ajout en un clic.
 * Format pensé pour une colonne étroite — le tiroir de confirmation.
 */
withDefaults(defineProps<{ products: CatalogProduct[], title?: string }>(), {
  title: 'Ces produits peuvent aussi vous intéresser',
})

const { add } = useCart()
const broken = reactive(new Set<number>())
</script>

<template>
  <section v-if="products.length" aria-labelledby="cart-suggestions">
    <h2 id="cart-suggestions" class="text-h4 font-bold text-tertiary-50">{{ title }}</h2>
    <span class="mt-3 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />

    <ul class="mt-5 grid gap-3 xl:grid-cols-2">
      <li v-for="product in products" :key="product.id" class="flex gap-3 rounded-xl bg-primary p-3">
        <NuxtLink
          :to="`/produits/${product.slug}`"
          class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-darker"
        >
          <img
            v-if="product.images[0] && !broken.has(product.id)"
            :src="product.images[0].src"
            :alt="product.images[0].alt"
            class="size-full object-contain p-1.5"
            width="64"
            height="64"
            loading="lazy"
            @error="broken.add(product.id)"
          >
        </NuxtLink>

        <div class="flex min-w-0 flex-1 flex-col">
          <NuxtLink
            :to="`/produits/${product.slug}`"
            class="line-clamp-2 text-[13px] font-medium text-tertiary-500 hover:text-secondary"
          >
            {{ product.name }}
          </NuxtLink>

          <div v-if="product.reviews" class="mt-1 flex items-center gap-1.5">
            <div class="flex" aria-hidden="true">
              <svg
                v-for="star in 5"
                :key="star"
                width="11" height="11" viewBox="0 0 20 20"
                :class="star <= Math.round(product.rating) ? 'fill-secondary' : 'fill-tertiary-500/20'"
              >
                <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
              </svg>
            </div>
            <span class="text-[11px] text-tertiary-800">
              {{ product.rating.toFixed(1).replace('.', ',') }} ({{ product.reviews }})
            </span>
          </div>

          <div class="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
            <p class="text-body font-bold" :class="product.regularPrice ? 'text-secondary' : 'text-tertiary-50'">
              {{ formatPrice(product.price) }}
            </p>
            <button
              type="button"
              class="btn-primary !px-3 !py-1.5 !text-[12px]"
              @click="add(product)"
            >
              Ajouter
            </button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
