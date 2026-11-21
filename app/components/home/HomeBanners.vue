<script setup lang="ts">
/**
 * Deux bannières d'accès : le catalogue pour les particuliers, l'espace
 * professionnel pour les revendeurs. Le texte est posé sur un voile uni, pas
 * sur le visuel nu — il reste lisible quelle que soit l'image.
 */
const root = useTemplateRef<HTMLElement>('root')
useReveal(root)

const banners = [
  {
    id: 'produits',
    kicker: 'Particuliers',
    title: 'Tout pour votre auto, au petit prix',
    to: '/categories',
    cta: 'Voir le catalogue',
    image: '/images/bannieres/imgdzuvo7.jpeg',
  },
  {
    id: 'pro',
    kicker: 'Distributeurs et ateliers',
    title: 'Un espace pensé pour les professionnels',
    to: '/professionnels',
    cta: 'Découvrir l’espace pro',
    image: '/images/bannieres/imgdzuvo8.jpeg',
  },
]

const broken = reactive(new Set<string>())
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="Accès rapides">
    <ul class="grid gap-4 lg:grid-cols-2">
      <li v-for="(banner, index) in banners" :key="banner.id" data-r :style="{ '--i': index }">
        <NuxtLink
          :to="banner.to"
          class="group relative isolate flex min-h-[260px] items-end overflow-hidden rounded-3xl bg-[#14141a] p-6 text-white md:min-h-[320px] md:p-9"
        >
          <img
            v-if="!broken.has(banner.id)"
            :src="banner.image"
            alt=""
            class="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            width="920"
            height="400"
            loading="lazy"
            @error="broken.add(banner.id)"
          >
          <div class="absolute inset-0 -z-10 bg-black/45 transition-colors duration-300 group-hover:bg-black/35" />

          <div>
            <p class="mb-2 text-xs font-bold tracking-[0.2em] text-white/80 uppercase">{{ banner.kicker }}</p>
            <h2 class="max-w-sm text-h2 leading-tight font-bold text-balance text-white">{{ banner.title }}</h2>
            <span class="mt-5 inline-flex items-center gap-2 rounded-btn bg-white px-4.5 py-2.5 text-sm font-bold text-[#14141a] transition-colors group-hover:bg-secondary group-hover:text-white">
              {{ banner.cta }}
              <svg width="15" height="11" viewBox="0 0 17 12" fill="none" aria-hidden="true">
                <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
