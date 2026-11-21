<script setup lang="ts">
import type { ProductImage } from '#shared/types/catalog'

/**
 * Galerie : grande image carrée et vignettes dessous. Reprise telle quelle de
 * l'ancienne fiche — c'est la partie que le client appréciait.
 */
defineProps<{ images: ProductImage[], badge?: string }>()

const active = ref(0)
const broken = reactive(new Set<number>())
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="relative aspect-square overflow-hidden rounded-2xl bg-primary">
      <span
        v-if="badge"
        class="absolute top-4 left-4 z-10 rounded-full border border-secondary bg-primary/70 px-3 py-1 text-xs font-bold text-secondary"
      >
        {{ badge }}
      </span>
      <img
        v-if="images[active] && !broken.has(active)"
        :src="images[active].src"
        :alt="images[active].alt"
        class="size-full object-contain p-8"
        width="720"
        height="720"
        fetchpriority="high"
        @error="broken.add(active)"
      >
      <span v-else class="absolute inset-12 rounded-full bg-radial from-secondary/20 to-transparent blur-2xl" aria-hidden="true" />
    </div>

    <!-- Vignettes : seulement s'il y a de quoi choisir. -->
    <ul v-if="images.length > 1" class="grid grid-cols-4 gap-3">
      <li v-for="(image, index) in images" :key="image.src">
        <button
          type="button"
          class="aspect-square w-full overflow-hidden rounded-xl bg-primary p-2 transition-colors"
          :class="index === active ? 'ring-2 ring-secondary' : 'hover:ring-1 hover:ring-tertiary-500/30'"
          :aria-label="`Visuel ${index + 1}`"
          :aria-current="index === active"
          @click="active = index"
        >
          <img :src="image.src" :alt="image.alt" class="size-full object-contain" loading="lazy">
        </button>
      </li>
    </ul>
  </div>
</template>
