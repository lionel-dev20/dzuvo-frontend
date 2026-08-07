<script setup lang="ts">
/**
 * Deux bannières d'accès : l'espace revendeurs et le catalogue.
 * Le bouton est posé sur le visuel, aligné à droite.
 */
const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 40 })

const brokenImages = reactive(new Set<string>())

const banners = [
  {
    id: 'distributeurs',
    label: 'Pour les distributeurs',
    to: '/professionnels',
    image: '/images/bannieres/distributeurs.jpg',
    alt: 'Entrepôt DZUVO et préparation des commandes',
  },
  {
    id: 'produits',
    label: 'Nos produits',
    to: '/categories',
    image: '/images/bannieres/produits.jpg',
    alt: 'Gamme de pièces et accessoires DZUVO',
  },
]
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="Accès rapides">
    <ul data-reveal-group class="grid gap-4 lg:grid-cols-2">
      <li v-for="banner in banners" :key="banner.id" data-reveal>
        <NuxtLink
          :to="banner.to"
          class="group relative flex aspect-16/7 items-end justify-end overflow-hidden rounded-2xl bg-primary p-5 md:p-8"
        >
          <img
            v-if="!brokenImages.has(banner.id)"
            :src="banner.image"
            :alt="banner.alt"
            class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            width="920"
            height="400"
            loading="lazy"
            @error="brokenImages.add(banner.id)"
          >
          <!-- Voile : le libellé doit tenir quelle que soit la photo dessous. -->
          <span class="absolute inset-0 bg-primary/35" aria-hidden="true" />

          <span class="btn-primary relative text-h4 uppercase md:px-7 md:py-4">
            {{ banner.label }}
            <!-- Même flèche que les CTA du hero. -->
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
