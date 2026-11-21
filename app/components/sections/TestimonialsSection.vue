<script setup lang="ts">
import type { Testimonial } from '~/config/testimonials'
import { testimonialsBottom, testimonialsTop } from '~/config/testimonials'

/**
 * Témoignages en deux bandes défilant en sens inverse. Le défilement est une
 * animation CSS : elle tourne sur le compositeur, sans coût de calcul par image.
 */
const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 40 })

/* Avis publiés dans WordPress, ou ceux livrés avec le site. Les deux bandes
   se replient ensemble : WordPress coupe sa liste en deux, et une seule bande
   d'origine mêlée à une bande saisie donnerait des avis de provenances
   différentes de part et d'autre. */
const { list, text } = useHomeContent()
const top = list(content => content.testimonials.top, testimonialsTop)
const bottom = list(content => content.testimonials.bottom, testimonialsBottom)

const titleTop = text('testimonialsTitleTop', 'Ce que disent nos clients')
const titleBottom = text('testimonialsTitleBottom', 'd’un océan à l’autre')
const intro = text(
  'testimonialsIntro',
  'Des milliers d’automobilistes équipent leur véhicule chez DZUVO. Voici ce qu’ils en retiennent.',
)

/** La piste porte les cartes en double : la boucle se referme sans saut. */
const topTrack = computed(() => [...top.value, ...top.value])
const bottomTrack = computed(() => [...bottom.value, ...bottom.value])

const initials = (author: string) =>
  author.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()

const card = 'flex w-[280px] shrink-0 flex-col gap-3 rounded-2xl bg-primary p-5 sm:w-[340px]'
/* Les bords s'effacent : les cartes entrent et sortent sans arête franche. */
const mask = 'overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]'
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="Témoignages clients">
    <div data-reveal-group>
      <div data-reveal class="mx-auto mb-10 max-w-2xl text-center">
        <h2 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
          <span class="text-tertiary-700">{{ titleTop }}</span><br>
          <span class="text-tertiary-50">{{ titleBottom }}</span>
        </h2>
        <p class="mt-4 text-pretty text-tertiary-800">{{ intro }}</p>
      </div>

      <!-- Bande du haut -->
      <div data-reveal :class="mask">
        <ul class="flex w-max gap-4 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
          <li v-for="(item, position) in topTrack" :key="`${item.id}-${position}`" :class="card">
            <div class="flex gap-0.5" aria-hidden="true">
              <svg
                v-for="star in 5"
                :key="star"
                width="14" height="14" viewBox="0 0 20 20"
                :class="star <= item.rating ? 'fill-secondary' : 'fill-tertiary-500/20'"
              >
                <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
              </svg>
            </div>

            <blockquote class="text-body text-pretty text-tertiary-600">{{ item.quote }}</blockquote>

            <figcaption class="mt-auto flex items-center gap-2.5 pt-1">
              <span class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary/15 text-[11px] font-bold text-secondary">
                {{ initials(item.author) }}
              </span>
              <span class="text-[13px] text-tertiary-800">{{ item.author }} — {{ item.city }}</span>
            </figcaption>
          </li>
        </ul>
      </div>

      <!-- Bande du bas, en sens inverse -->
      <div data-reveal class="mt-4" :class="mask">
        <ul class="flex w-max gap-4 animate-marquee-reverse hover:[animation-play-state:paused] motion-reduce:animate-none">
          <li v-for="(item, position) in bottomTrack" :key="`${item.id}-${position}`" :class="card">
            <div class="flex gap-0.5" aria-hidden="true">
              <svg
                v-for="star in 5"
                :key="star"
                width="14" height="14" viewBox="0 0 20 20"
                :class="star <= item.rating ? 'fill-secondary' : 'fill-tertiary-500/20'"
              >
                <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
              </svg>
            </div>

            <blockquote class="text-body text-pretty text-tertiary-600">{{ item.quote }}</blockquote>

            <figcaption class="mt-auto flex items-center gap-2.5 pt-1">
              <span class="grid size-8 shrink-0 place-items-center rounded-full bg-secondary/15 text-[11px] font-bold text-secondary">
                {{ initials(item.author) }}
              </span>
              <span class="text-[13px] text-tertiary-800">{{ item.author }} — {{ item.city }}</span>
            </figcaption>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
