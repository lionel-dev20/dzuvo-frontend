<script setup lang="ts">
import type { CarouselProduct } from '~/composables/useHomeContent'
import { featuredProducts } from '~/config/products'
import { toCarouselProduct } from '~/composables/useHomeContent'

/**
 * Carrousel produits. Le défilement est natif (scroll horizontal + accroche) :
 * le swipe tactile fonctionne sans JS, les flèches ne font qu'avancer d'une
 * largeur de piste — soit exactement 4 produits sur desktop, 2 sur mobile.
 *
 * Il avance seul, et s'arrête dès que le visiteur s'y intéresse.
 */
const AUTOPLAY_MS = 5000

/*
 * Produits choisis dans WordPress, résolus par la couche catalogue — donc
 * ajoutables au panier. À défaut, la sélection livrée avec le site s'affiche,
 * mais sans identifiant de boutique : son bouton ne peut que renvoyer vers la
 * fiche produit.
 */
const { content, text } = useHomeContent()
const { add } = useCart()

const products = computed<CarouselProduct[]>(() =>
  content.value.products.length
    ? content.value.products.map(toCarouselProduct)
    : featuredProducts,
)

const title = text('productsTitle', 'Nos produits du moment')

/**
 * Ajout au panier depuis le carrousel.
 *
 * Deux cas où l'ajout direct n'a pas de sens, et où l'on ouvre la fiche
 * produit à la place : le produit vient de la sélection de secours, sans
 * identifiant de boutique — il n'y a rien à mettre au panier ; ou c'est un
 * produit à déclinaisons, dont la variation se choisit sur sa fiche.
 */
function addToCart(product: CarouselProduct) {
  if (product.catalog && product.purchasable) {
    add(product.catalog)
    return
  }

  navigateTo(product.to)
}
const root = useTemplateRef<HTMLElement>('root')
const track = useTemplateRef<HTMLElement>('track')
useScrollReveal(root, { y: 40 })

const atStart = ref(true)
const atEnd = ref(false)
const paused = ref(false)
const brokenImages = reactive(new Set<string>())

function updateBounds() {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}

let timer: ReturnType<typeof setInterval> | undefined

/** Une page = la largeur visible de la piste. */
function page(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * (track.value?.clientWidth ?? 0), behavior: 'smooth' })
}

/** Clic manuel : on avance et on repart d'un tour complet. */
function goTo(direction: 1 | -1) {
  page(direction)
  restart()
}

function advance() {
  const el = track.value
  if (!el) return
  // Arrivé au bout, on repart du début plutôt que de rester bloqué.
  if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
    el.scrollTo({ left: 0, behavior: 'smooth' })
    return
  }
  page(1)
}

function restart() {
  clearInterval(timer)
  if (paused.value) return
  timer = setInterval(() => {
    if (!paused.value && !document.hidden) advance()
  }, AUTOPLAY_MS)
}

watch(paused, restart)

onMounted(() => {
  updateBounds()
  window.addEventListener('resize', updateBounds)

  // Pas de défilement automatique si le visiteur a demandé moins d'animations.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) restart()

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateBounds)
    clearInterval(timer)
  })
})

const arrow = 'grid size-11 shrink-0 place-items-center rounded-full bg-tertiary-500/10 text-tertiary-500 transition-colors hover:bg-secondary hover:text-on-accent disabled:cursor-default disabled:opacity-30 disabled:hover:bg-tertiary-500/10 disabled:hover:text-tertiary-500'
</script>

<template>
  <section
    ref="root"
    class="px-2.5 md:px-5 lg:px-24"
    aria-label="Nos produits du moment"
    aria-roledescription="carrousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <div data-reveal-group>
      <div data-reveal class="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 class="text-h3 ">{{ title }}</h2>
          <span class="mt-3 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />
        </div>

        <div class="flex gap-2">
          <button type="button" :class="arrow" :disabled="atStart" aria-label="Produits précédents" @click="goTo(-1)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button type="button" :class="arrow" :disabled="atEnd" aria-label="Produits suivants" @click="goTo(1)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- La barre de défilement est masquée : les flèches et le swipe suffisent. -->
      <ul
        ref="track"
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="updateBounds"
      >
        <li
          v-for="product in products"
          :key="product.id"
          data-reveal
          class="w-[calc(50%-0.5rem)] shrink-0 snap-start lg:w-[calc(25%-0.75rem)]"
        >
          <article class="group flex h-full flex-col overflow-hidden rounded-2xl bg-primary">
            <!-- Visuel -->
            <NuxtLink :to="product.to" class="relative block aspect-square overflow-hidden">
              <span
                v-if="product.badge"
                class="absolute top-3 left-3 z-10 rounded-full border border-secondary bg-primary/70 px-2.5 py-1 text-[11px] font-bold text-secondary"
              >
                {{ product.badge }}
              </span>
              <img
                v-if="product.image && !brokenImages.has(product.id)"
                :src="product.image"
                :alt="product.name"
                class="size-full object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                width="360"
                height="360"
                loading="lazy"
                @error="brokenImages.add(product.id)"
              >
            </NuxtLink>

            <div class="flex flex-1 flex-col p-4">
              <NuxtLink :to="product.to" class="line-clamp-2 text-body font-medium text-tertiary-500 hover:text-secondary">
                {{ product.name }}
              </NuxtLink>

              <!-- Note : les étoiles sont décoratives, le texte porte l'information. -->
              <div class="mt-2 flex items-center gap-1.5">
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
                {{ product.availability }}
              </p>

              <div class="mt-auto pt-4">
                <div v-if="product.oldPrice" class="mb-1 flex items-center gap-2">
                  <span class="text-[11px] text-tertiary-800 line-through">{{ product.oldPrice }}</span>
                  <span v-if="product.discount" class="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-bold text-on-accent">
                    {{ product.discount }}
                  </span>
                </div>

                <p class="text-h3 font-bold" :class="product.oldPrice ? 'text-secondary' : 'text-tertiary-50'">
                  {{ product.price }}
                </p>
                <p v-if="product.note" class="mt-0.5 text-[11px] text-tertiary-800">{{ product.note }}</p>

                <button
                  type="button"
                  class="mt-4 w-full justify-center"
                  :class="product.inStock ? 'btn-primary' : 'btn-secondary'"
                  :disabled="!product.inStock"
                  @click="addToCart(product)"
                >
                  <!-- En stock : panier filaire. Épuisé : cloche de rappel. -->
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
        </li>
      </ul>
    </div>
  </section>
</template>
