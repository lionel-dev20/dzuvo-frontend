<script setup lang="ts">
import { composeHeroSlides, fallbackSlides } from '~/config/heroSlides'

const AUTOPLAY_MS = 7000

// Slides publiées dans WordPress, ou celles livrées avec le site.
const { list } = useHomeContent()
const available = list(content => content.slides, fallbackSlides)

/*
 * Rendu serveur : ordre canonique (hiver). La slide de marque ouvrant toujours
 * le carrousel, réordonner selon la saison réelle après hydratation ne produit
 * aucun saut visible.
 */
const month = ref(9)
const slides = computed(() => composeHeroSlides(available.value, month.value))
const index = ref(0)
const paused = ref(false)

/* Le carrousel peut rétrécir — une slide dépubliée, un repli qui prend la
   main : sans ce recalage, la position courante pointerait dans le vide. */
watch(() => slides.value.length, (total) => {
  if (index.value >= total) index.value = 0
})

const activeSlide = computed(() => slides.value[index.value] ?? slides.value[0]!)
// Tant qu'un visuel n'est pas livré, on affiche le halo plutôt qu'une image cassée.
const mediaFailed = ref(false)
watch(index, () => { mediaFailed.value = false })
/*
 * Le défilement ne se suspend qu'au focus clavier et en onglet masqué : le hero
 * couvrant 78vh, une pause au survol l'aurait figé en permanence.
 */
const running = computed(() => !paused.value)

let gsapRef: typeof import('gsap').gsap | null = null
let timer: ReturnType<typeof setInterval> | undefined

function restart() {
  clearInterval(timer)
  if (!running.value) return
  timer = setInterval(() => { index.value = (index.value + 1) % slides.value.length }, AUTOPLAY_MS)
}

function goTo(position: number) {
  const total = slides.value.length
  index.value = (position + total) % total
  restart()
}

const previous = () => goTo(index.value - 1)
const next = () => goTo(index.value + 1)

watch(running, restart)

onMounted(async () => {
  month.value = new Date().getMonth()
  restart()

  // L'autoplay ne tourne pas dans un onglet en arrière-plan.
  const onVisibility = () => { paused.value = document.hidden }
  document.addEventListener('visibilitychange', onVisibility)

  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })

  gsapRef = (await import('gsap')).gsap
})

/* Révélation : surtitre, titre, description, bouton montent depuis le bas ;
   le visuel arrive ensuite par la gauche. */
function onEnter(element: Element, done: () => void) {
  if (!gsapRef) return done()

  const timeline = gsapRef.timeline({ onComplete: done })

  // Le bloc glisse depuis la droite pendant que son contenu se révèle.
  timeline
    .fromTo(element, { x: 90 }, { x: 0, duration: 0.5, ease: 'expo.out' })
    .fromTo(
      element.querySelectorAll('[data-anim]'),
      { autoAlpha: 0, y: 34 },
      { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.06, ease: 'power2.out' },
      0,
    )

  const media = element.querySelector('[data-anim-media]')
  if (media) {
    timeline.fromTo(
      media,
      { autoAlpha: 0, x: -60 },
      { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power2.out' },
      0.18,
    )
  }
}

/* Passage d'une slide à l'autre : le bloc entier s'échappe vers la gauche. */
function onLeave(element: Element, done: () => void) {
  if (!gsapRef) return done()
  gsapRef.to(element, { autoAlpha: 0, x: -110, duration: 0.26, ease: 'power2.in', onComplete: done })
}
</script>

<template>
  <section
    class="relative isolate"
    aria-roledescription="carrousel"
    aria-label="Mises en avant DZUVO"
    @focusin="paused = true"
    @focusout="paused = false"
    @keydown.left.prevent="previous"
    @keydown.right.prevent="next"
  >
    <!-- Remonte au-delà du header (transparent) pour un fond d'un seul tenant. -->
    <FluidBackdrop class="-top-64! -z-10" />

    <div class="px-2.5 md:px-5 lg:px-24 relative flex min-h-[78vh] flex-col justify-between gap-16 py-20 lg:mt-5 lg:py-28">
      <Transition :css="false" mode="out-in" @enter="onEnter" @leave="onLeave">
        <div
          :key="activeSlide.id"
          class="grid items-center justify-between gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-3"
          role="group"
          aria-roledescription="diapositive"
          :aria-label="`${index + 1} sur ${slides.length}`"
        >
          <div>
            <p data-anim class="mb-5 text-xs font-bold tracking-[0.22em] text-secondary uppercase">
              {{ activeSlide.eyebrow }}
            </p>

            <h1 v-if="activeSlide.season === 'brand'" data-anim class="mb-6 text-balance lg:text-hero">
              {{ activeSlide.title }}
            </h1>
            <p
              v-else
              data-anim
              class="mb-6 text-h1 leading-tight font-bold text-balance text-tertiary-50  lg:text-hero"
            >
              {{ activeSlide.title }}
            </p>

            <p data-anim class="mb-9 max-w-xl text-pretty text-xl font-normal text-tertiary-700">
              {{ activeSlide.subtitle }}
            </p>

            <div data-anim class="flex flex-wrap gap-3">
              <NuxtLink
                v-for="(cta, position) in activeSlide.ctas"
                :key="cta.to"
                :to="cta.to"
                :class="position === 0 ? 'btn-primary' : 'btn-secondary'"
              >
                {{ cta.label }}
                <svg v-if="position === 0" width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
                  <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </NuxtLink>
            </div>
          </div>

          <div data-anim-media class="relative min-h-[220px] md:min-h-[320px]">
            <!-- Halo d'assise : détache le produit du décor animé. -->
            <div class="absolute inset-6 rounded-full bg-radial from-secondary/25 via-secondary-dark/10 to-transparent blur-2xl" />

            <img
              v-if="activeSlide.image && !mediaFailed"
              :src="activeSlide.image"
              :alt="activeSlide.title"
              class="relative block h-auto max-h-[62vh] w-full object-contain object-right drop-shadow-[0_30px_60px_rgba(247,2,5,0.3)]"
              width="720"
              height="540"
              fetchpriority="high"
              @error="mediaFailed = true"
            >
          </div>
        </div>
      </Transition>

      <!-- Pagination : tirets, à la façon d'un compteur de progression -->
      <div class="mt-4 flex items-center justify-center gap-1.5">
        <button
          v-for="(slide, position) in slides"
          :key="slide.id"
          type="button"
          class="group cursor-pointer px-1 py-3"
          :aria-label="`Voir : ${slide.eyebrow}`"
          :aria-current="position === index"
          @click="goTo(position)"
        >
          <span
            class="block h-1 w-6 rounded-full transition-colors sm:w-10"
            :class="position === index
              ? 'bg-secondary'
              : 'bg-tertiary-500/20 group-hover:bg-tertiary-500/50'"
          />
        </button>
      </div>
    </div>
  </section>
</template>
