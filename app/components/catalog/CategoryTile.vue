<script setup lang="ts">
import type { CatalogCategory } from '#shared/types/catalog'

/** Tuile de rubrique : visuel, intitulé, et compte de références. */
withDefaults(defineProps<{ category: CatalogCategory, compact?: boolean }>(), { compact: false })

const broken = ref(false)
</script>

<template>
  <NuxtLink
    :to="`/categories/${category.slug}`"
    class="group flex h-full flex-col overflow-hidden rounded-2xl bg-primary transition-transform duration-300 hover:z-10 hover:scale-105"
  >
    <div class="relative overflow-hidden" :class="compact ? 'aspect-4/3' : 'aspect-square'">
      <img
        v-if="category.image && !broken"
        :src="category.image"
        :alt="category.name"
        class="size-full object-contain p-5"
        width="360"
        height="360"
        loading="lazy"
        @error="broken = true"
      >
      <!-- Sans visuel, la tuile garde sa surface plutôt que de s'écraser. -->
      <span v-else class="absolute inset-6 rounded-full bg-radial from-secondary/20 to-transparent blur-2xl" aria-hidden="true" />
    </div>

    <div class="flex flex-1 flex-col p-4">
      <h3 class="text-h4 font-bold text-tertiary-50 group-hover:text-secondary">{{ category.name }}</h3>
      <p v-if="!compact && category.description" class="mt-1.5 line-clamp-2 text-body text-tertiary-800">
        {{ category.description }}
      </p>
      <p class="mt-auto pt-3 text-[11px] text-tertiary-800">
        {{ category.count }} référence{{ category.count > 1 ? 's' : '' }}
      </p>
    </div>
  </NuxtLink>
</template>
