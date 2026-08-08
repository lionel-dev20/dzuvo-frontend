<script setup lang="ts">
import { categoryCards, categorySpotlights } from '~/config/featuredCategories'

const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root)

/* Les visuels arrivent au fil de la production : une image absente laisse
   simplement sa zone vide, jamais une vignette cassée. */
const brokenImages = reactive(new Set<string>())

/* Préchargement pour détecter les images cassées des spotlights
   (indispensable puisqu'on passe en background-image, donc plus d'événement @error natif). */
onMounted(() => {
  categorySpotlights.forEach((spotlight) => {
    if (!spotlight.image) return
    const img = new Image()
    img.onerror = () => brokenImages.add(spotlight.id)
    img.src = spotlight.image
  })
})

/* Habillage commun aux tuiles : surface surélevée sur le fond sombre. */
const tile = 'group relative flex h-full flex-col overflow-hidden rounded-2xl bg-primary transition-transform duration-300 hover:z-10 hover:scale-105'
const arrow = 'grid size-9 shrink-0 place-items-center rounded-full bg-tertiary-500/10 text-tertiary-500 transition-colors group-hover:bg-secondary group-hover:text-tertiary-50'
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="Nos meilleures catégories">
    <!-- Rangée 1 — quatre cartes catégorie (inchangée) -->
    <h3 class="text-center pb-4 md:pb-12">Nos offres du moment</h3>
    <ul data-reveal-group class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <li v-for="card in categoryCards" :key="card.id" data-reveal>
        <NuxtLink :to="card.to" :class="tile">
          <div class="relative aspect-4/3 overflow-hidden">
            <span
              v-if="card.badge"
              class="absolute top-4 left-4 z-10 rounded-full border border-secondary px-3 py-1 text-xs font-bold text-secondary"
            >
              {{ card.badge }}
            </span>
            <img
              v-if="card.image && !brokenImages.has(card.id)"
              :src="card.image"
              alt=""
              class="size-full object-contain p-6"
              width="480"
              height="360"
              loading="lazy"
              @error="brokenImages.add(card.id)"
            >
          </div>

          <div class="flex flex-1 flex-col p-5">
            <p v-if="card.fromLabel" class="text-body text-tertiary-800">{{ card.fromLabel }}</p>

            <div v-if="card.oldPrice" class="mt-1 flex items-center gap-2">
              <span class="text-body text-tertiary-800 line-through">{{ card.oldPrice }}</span>
              <span v-if="card.discount" class="rounded bg-secondary px-1.5 py-0.5 text-xs font-bold text-tertiary-50">
                {{ card.discount }}
              </span>
            </div>

            <p v-if="card.price || card.headline" class="mt-1 text-h2 font-bold text-tertiary-50">
              {{ card.price ?? card.headline }}
            </p>

            <p class="mt-2 font-medium text-pretty text-tertiary-500">{{ card.title }}</p>
            <p v-if="card.note" class="text-body text-tertiary-700">{{ card.note }}</p>
            <p v-if="card.fineprint" class="mt-1 text-xs text-tertiary-800">{{ card.fineprint }}</p>

            <div class="mt-auto flex items-end justify-between gap-3 pt-5">
              <p v-if="card.until" class="text-xs text-tertiary-800">{{ card.until }}</p>
              <span :class="arrow" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M5.5 3 10.5 8l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <!-- Rangée 2 — deux panneaux larges, images en background -->
    <ul data-reveal-group class="mt-4 grid gap-4 lg:grid-cols-2">
      <li v-for="spotlight in categorySpotlights" :key="spotlight.id" data-reveal>
        <NuxtLink :to="spotlight.to" :class="[tile, 'min-h-[320px] md:min-h-[380px]']">
          <!-- Panneau photo : le texte se pose sur l'image -->
          <template v-if="spotlight.cover">
            <div
              v-if="spotlight.image && !brokenImages.has(spotlight.id)"
              class="absolute inset-0 size-full bg-cover bg-center"
              :style="{ backgroundImage: `url(${spotlight.image})` }"
              role="img"
              aria-hidden="true"
            />
            <div class="absolute  bg-primary/55" />
            <div class="relative mt-auto p-6 md:p-8">
              <h3 class="max-w-lg text-h3 font-bold text-balance text-tertiary-50 uppercase">{{ spotlight.title }}</h3>
              <p v-if="spotlight.subtitle" class="mt-3 text-tertiary-600">{{ spotlight.subtitle }}</p>
            </div>
          </template>

          <!-- Panneau clair : texte à gauche, visuel détouré à droite -->
          <template v-else>
            <div class="relative grid flex-1 items-center gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:p-8">
              <div>
                <p
                  v-if="spotlight.ribbon"
                  class="mb-5 inline-block -rotate-2 rounded bg-secondary px-3 py-1.5 text-xs font-bold text-tertiary-50 uppercase"
                >
                  {{ spotlight.ribbon }}
                </p>
                <h3 class="text-h3 font-bold text-balance text-tertiary-50">{{ spotlight.title }}</h3>
                <p v-if="spotlight.subtitle" class="mt-2 font-medium text-tertiary-500">{{ spotlight.subtitle }}</p>
                <p v-if="spotlight.note" class="mt-4 inline-block border-t border-tertiary-500/20 pt-2 text-body text-tertiary-800">
                  {{ spotlight.note }}
                </p>
              </div>

              <div class="relative hidden aspect-square sm:block">
                <div
                  v-if="spotlight.image && !brokenImages.has(spotlight.id)"
                  class="size-full rounded-full bg-cover bg-center"
                  :style="{ backgroundImage: `url(${spotlight.image})` }"
                  role="img"
                  aria-hidden="true"
                />
              </div>
            </div>

            <span :class="[arrow, 'absolute right-6 bottom-6']" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 3 10.5 8l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </template>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>