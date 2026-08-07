<script setup lang="ts">
import type { CatalogProduct } from '#shared/types/catalog'

/** Carte produit, partagée entre la page catégorie, la recherche et le carrousel. */
defineProps<{ product: CatalogProduct }>()

const broken = ref(false)
const money = (value: number) => `${value.toFixed(2).replace('.', ',')} $`
</script>

<template>
  <article class="group flex h-full flex-col overflow-hidden rounded-2xl bg-primary">
    <NuxtLink :to="`/produits/${product.slug}`" class="relative block aspect-square overflow-hidden">
      <span
        v-if="product.badge"
        class="absolute top-3 left-3 z-10 rounded-full border border-secondary bg-primary/70 px-2.5 py-1 text-[11px] font-bold text-secondary"
      >
        {{ product.badge }}
      </span>
      <img
        v-if="product.images[0] && !broken"
        :src="product.images[0].src"
        :alt="product.images[0].alt"
        class="size-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
        width="360"
        height="360"
        loading="lazy"
        @error="broken = true"
      >
    </NuxtLink>

    <div class="flex flex-1 flex-col p-4">
      <NuxtLink
        :to="`/produits/${product.slug}`"
        class="line-clamp-2 text-body font-medium text-tertiary-500 hover:text-secondary"
      >
        {{ product.name }}
      </NuxtLink>

      <!-- Les étoiles sont décoratives : le texte porte la note. -->
      <div v-if="product.reviews" class="mt-2 flex items-center gap-1.5">
        <div class="flex" aria-hidden="true">
          <svg
            v-for="star in 5"
            :key="star"
            width="13" height="13" viewBox="0 0 20 20"
            :class="star <= Math.round(product.rating) ? 'fill-secondary' : 'fill-tertiary-500/20'"
          >
            <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
          </svg>
        </div>
        <span class="text-[11px] text-tertiary-800">
          {{ product.rating.toFixed(1).replace('.', ',') }} ({{ product.reviews }} avis)
        </span>
      </div>

      <p class="mt-2 flex items-center gap-1.5 text-[11px]" :class="product.inStock ? 'text-tertiary-600' : 'text-secondary'">
        <span class="size-1.5 rounded-full" :class="product.inStock ? 'bg-green-500' : 'bg-secondary'" aria-hidden="true" />
        {{ product.stockLabel }}
      </p>

      <div class="mt-auto pt-4">
        <div v-if="product.regularPrice" class="mb-1 flex items-center gap-2">
          <span class="text-[11px] text-tertiary-800 line-through">{{ money(product.regularPrice) }}</span>
          <span class="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-tertiary-50">
            -{{ Math.round((1 - product.price / product.regularPrice) * 100) }} %
          </span>
        </div>

        <p class="text-h3 font-bold" :class="product.regularPrice ? 'text-secondary' : 'text-tertiary-50'">
          {{ money(product.price) }}
        </p>

        <button
          type="button"
          class="mt-4 w-full justify-center"
          :class="product.inStock ? 'btn-primary' : 'btn-secondary'"
          :disabled="!product.inStock"
        >
          <svg v-if="product.inStock" width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 4h2l1.6 9.2a1.5 1.5 0 0 0 1.5 1.3h6.9a1.5 1.5 0 0 0 1.5-1.2L18 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="8.5" cy="17.4" r="1.3" stroke="currentColor" stroke-width="1.6" />
            <circle cx="15" cy="17.4" r="1.3" stroke="currentColor" stroke-width="1.6" />
          </svg>
          <svg v-else width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2.4a5 5 0 0 0-5 5v3.1l-1.4 2.4a.6.6 0 0 0 .5.9h11.8a.6.6 0 0 0 .5-.9L15 10.5V7.4a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            <path d="M8.1 16.4a2 2 0 0 0 3.8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          {{ product.inStock ? 'Ajouter' : 'Me prévenir' }}
        </button>
      </div>
    </div>
  </article>
</template>
