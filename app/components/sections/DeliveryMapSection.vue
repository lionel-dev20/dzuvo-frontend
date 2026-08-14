<script setup lang="ts">
import { deliveryCitiesMap, MAP_DOTS, MAP_HEIGHT, MAP_WIDTH } from '~/config/deliveryMap'

/**
 * Carte de livraison en points. Une ville reste mise en avant : au survol
 * c'est celle que vise le visiteur, sinon elles défilent au hasard.
 */
const ROTATION_MS = 2600

// Titres et compteur réglés dans « Page d'accueil > Titres et textes ».
const { text, count } = useHomeContent()
const titleTop = text('mapTitleTop', 'Livraison programmée')
const titleBottom = text('mapTitleBottom', 'D’une ville à l’autre, partout au Canada')
const counterTitle = text('mapCounterTitle', 'Ils nous font confiance')
const counterText = text('mapCounterText', 'Nous avons livré, ils ont testé et ont été satisfaits.')
const clientsTotal = count('mapCounterValue', 300)

const root = useTemplateRef<HTMLElement>('root')
const counter = useTemplateRef<HTMLElement>('counter')
useScrollReveal(root, { y: 40 })

const hovered = ref<string | null>(null)
const auto = ref(deliveryCitiesMap[0]!.id)
const clients = ref(0)

/** Le survol prend le pas sur la rotation automatique. */
const activeId = computed(() => hovered.value ?? auto.value)
const active = computed(() => deliveryCitiesMap.find(c => c.id === activeId.value)!)

let timer: ReturnType<typeof setInterval> | undefined

function pickRandom() {
  // Toujours changer de ville : sans ce filtre, un tirage peut « bégayer ».
  const others = deliveryCitiesMap.filter(c => c.id !== auto.value)
  auto.value = others[Math.floor(Math.random() * others.length)]!.id
}

onMounted(async () => {
  timer = setInterval(() => {
    if (!hovered.value && !document.hidden) pickRandom()
  }, ROTATION_MS)

  onBeforeUnmount(() => clearInterval(timer))

  // Le compteur ne s'élance qu'une fois le bloc atteint.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clients.value = clientsTotal.value
    return
  }

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  const context = gsap.context(() => {
    const compte = { valeur: 0 }
    gsap.to(compte, {
      valeur: clientsTotal.value,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => { clients.value = Math.round(compte.valeur) },
      scrollTrigger: { trigger: counter.value, start: 'top 85%', once: true },
    })
  }, root.value!)

  onBeforeUnmount(() => context.revert())
})
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="Zones de livraison">
    <div data-reveal-group class="p-4 md:p-8">
      <div data-reveal class="mx-auto mb-10 max-w-2xl text-center">
        <h2 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
          <span class="text-tertiary-700">{{ titleTop }}</span><br>
          <span class="text-tertiary-50">{{ titleBottom }}</span>
        </h2>
      </div>

      <div data-reveal class="relative">
        <svg
          :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
          class="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-5xl"
          role="img"
          aria-label="Carte du Canada et villes desservies"
        >
          <!-- Trame de fond : un seul tracé pour 872 points. -->
          <path :d="MAP_DOTS" class="fill-tertiary-500/15" />

          <g v-for="city in deliveryCitiesMap" :key="city.id">
            <circle
              :cx="city.x"
              :cy="city.y"
              :r="city.id === activeId ? 8 : 5"
              class="transition-all duration-300"
              :class="city.id === activeId ? 'fill-secondary' : 'fill-tertiary-500/50'"
            />
            <!-- Cible de survol élargie : le point seul serait trop petit à viser. -->
            <circle
              :cx="city.x"
              :cy="city.y"
              r="24"
              class="cursor-pointer fill-transparent"
              tabindex="0"
              role="button"
              :aria-label="`${city.name} — livraison en ${city.delay}`"
              @mouseenter="hovered = city.id"
              @mouseleave="hovered = null"
              @focus="hovered = city.id"
              @blur="hovered = null"
            />
          </g>

          <!-- Infobulle dans le repère du SVG : elle reste soudée à son point,
               quelle que soit la taille d'affichage de la carte. -->
          <g
            :key="active.id"
            :transform="`translate(${active.x} ${active.y - 16})`"
            class="pointer-events-none"
            style="animation: bulle 180ms ease-out"
          >
            <rect x="-62" y="-56" width="124" height="52" rx="8" class="fill-secondary" />
            <path d="M-7 -5 L0 3 L7 -5 Z" class="fill-secondary" />
            <text text-anchor="middle" y="-36" class="fill-tertiary-50 text-[16px] font-bold">{{ active.name }}</text>
            <text text-anchor="middle" y="-16" class="fill-tertiary-50/85 text-[12px]">{{ active.delay }}</text>
          </g>
        </svg>

        <!-- Preuve sociale, flottante sur le bord droit de la carte -->
        <div
          ref="counter"
          class="mt-6 rounded-2xl  p-6 lg:absolute lg:top-24 lg:right-12 lg:mt-0 lg:max-w-xs lg:-translate-y-1/2"
        >
          <h3 class="text-5xl font-bold text-tertiary-50">{{ counterTitle }}</h3>
          <p class="mt-2 text-base text-pretty text-tertiary-800">{{ counterText }}</p>
          <p class="mt-5 flex items-baseline gap-2">
            <span class="text-8xl leading-none font-bold text-secondary tabular-nums">+{{ clients }}</span>
            <span class="text-base font-medium text-tertiary-600">clients</span>
          </p>
        </div>
      </div>

      <!-- Repli textuel : la carte seule n'est pas lisible sans la vue. -->
      <ul class="sr-only">
        <li v-for="city in deliveryCitiesMap" :key="city.id">
          {{ city.name }} ({{ city.region }}) — livraison en {{ city.delay }}
        </li>
      </ul>
    </div>
  </section>
</template>

<style>
/*
 * Apparition sur place, en opacité seule : animer `transform` en CSS
 * écraserait l'attribut `transform` du <g>, qui porte la position.
 */
@keyframes bulle {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
