<script setup lang="ts">
/**
 * Panier vide. Un seul message, une seule sortie : on ne laisse pas le
 * visiteur devant une page morte.
 */
withDefaults(defineProps<{ title?: string, to?: string, cta?: string }>(), {
  title: 'Votre panier est vide !',
  to: '/categories',
  cta: 'Continuer mes achats',
})
</script>

<template>
  <div class="flex flex-col items-center px-4 py-20 text-center">
    <!-- Le pictogramme porte l'émotion, le titre porte l'information. -->
    <span class="grid size-40 place-items-center rounded-full bg-primary md:size-48" aria-hidden="true">
      <svg width="72" height="72" viewBox="0 0 48 48" fill="none" class="text-tertiary-500">
        <path
          d="M6 9h4l3.4 19.2a2.6 2.6 0 0 0 2.6 2.2h15.4a2.6 2.6 0 0 0 2.6-2.1L38 16H12"
          stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
        />
        <circle cx="18" cy="38" r="2.6" stroke="currentColor" stroke-width="2.4" />
        <circle cx="31" cy="38" r="2.6" stroke="currentColor" stroke-width="2.4" />
        <path d="M20.5 44a5 5 0 0 1 8 0" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
    </span>

    <h1 class="mt-10 text-h2 font-bold text-tertiary-50">{{ title }}</h1>
    <span class="mt-4 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />

    <NuxtLink :to="to" class="btn-primary mt-8 w-full max-w-[320px] justify-center">
      {{ cta }}
    </NuxtLink>
  </div>
</template>
