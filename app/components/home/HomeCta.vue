<script setup lang="ts">
/**
 * Dernier appel avant le pied de page : le visiteur qui a tout lu sans cliquer
 * trouve ici une seule porte, vers le catalogue.
 */
const { text } = useHomeContent()
const title = text('ctaTitle', 'Trouvez l’accessoire qui vous simplifie la vie')
const lead = text('ctaText', 'Tout le catalogue, à petit prix, livré partout au Canada.')
const cta = reactive({ label: text('ctaLabel', 'Voir nos produits'), to: text('ctaTo', '/categories') })

const root = useTemplateRef<HTMLElement>('root')
useReveal(root)
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-labelledby="cta-titre">
    <div class="flex flex-col items-start justify-between gap-6 rounded-3xl bg-secondary p-8 text-on-accent md:flex-row md:items-center md:p-12 lg:p-14">
      <div class="max-w-xl">
        <h2 id="cta-titre" data-r class="text-h2 leading-tight font-bold text-balance text-on-accent lg:text-h2-lg">
          {{ title }}
        </h2>
        <p data-r style="--i: 1" class="mt-3 text-[15px] text-pretty text-white/85">
          {{ lead }}
        </p>
      </div>

      <NuxtLink
        data-r
        style="--i: 2"
          :to="cta.to"
        class="inline-flex shrink-0 items-center gap-2 rounded-btn bg-white px-6 py-3.5 text-sm font-bold text-[#14141a] transition-colors hover:bg-[#14141a] hover:text-white"
      >
        {{ cta.label }}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
          <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </NuxtLink>
    </div>
  </section>
</template>
