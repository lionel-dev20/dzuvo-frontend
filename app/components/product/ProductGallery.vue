<script setup lang="ts">
import type { ProductImage } from '#shared/types/catalog'

/**
 * Galerie : miniatures en colonne à gauche, grande image à droite.
 *
 * - Survoler une miniature l'affiche dans la grande image (au toucher, un appui
 *   suffit ; au clavier, la prendre au focus ou au « Entrée »).
 * - Survoler la grande image fait apparaître les flèches précédent / suivant,
 *   qui bouclent d'une extrémité à l'autre. Sur un écran tactile, sans survol
 *   possible, les flèches restent visibles.
 *
 * La colonne de miniatures a la hauteur de la grande image et défile d'elle-même
 * quand il y a plus de visuels qu'il n'en tient : elle ne rallonge jamais la
 * galerie, qui reste collée à l'écran pendant la lecture de la fiche.
 */
const props = defineProps<{ images: ProductImage[], badge?: string }>()

const active = ref(0)
const broken = reactive(new Set<number>())
const list = useTemplateRef<HTMLElement>('list')

const many = computed(() => props.images.length > 1)

function show(index: number) {
  active.value = (index + props.images.length) % props.images.length
}

/* Un autre produit : on repart de la première image. */
watch(() => props.images, () => {
  active.value = 0
  broken.clear()
})

/* La miniature active reste visible dans la colonne, y compris quand on avance
   avec les flèches. Le défilement est posé à la main : `scrollIntoView`
   déplacerait aussi la page entière. */
watch(active, async () => {
  await nextTick()
  const column = list.value
  const thumb = column?.children[active.value] as HTMLElement | undefined
  if (!column || !thumb) return

  if (thumb.offsetTop < column.scrollTop) column.scrollTop = thumb.offsetTop
  else if (thumb.offsetTop + thumb.offsetHeight > column.scrollTop + column.clientHeight) {
    column.scrollTop = thumb.offsetTop + thumb.offsetHeight - column.clientHeight
  }
})

const arrow = 'absolute top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-tertiary-500/10 bg-primary/90 text-tertiary-50 shadow-panel opacity-0 transition-opacity hover:text-secondary focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100'
</script>

<template>
  <div class="grid gap-3" :class="many ? 'grid-cols-[auto_minmax(0,1fr)]' : ''">
    <!-- Miniatures : seulement s'il y a de quoi choisir. -->
    <div v-if="many" class="relative w-14 sm:w-[72px]">
      <ul ref="list" class="absolute inset-0 flex flex-col gap-3 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li v-for="(image, index) in images" :key="image.src" class="shrink-0">
          <button
            type="button"
            class="aspect-square w-full overflow-hidden rounded-xl bg-primary p-1.5 transition-colors"
            :class="index === active ? 'ring-2 ring-secondary' : 'hover:ring-1 hover:ring-tertiary-500/30'"
            :aria-label="`Voir le visuel ${index + 1} sur ${images.length}`"
            :aria-current="index === active"
            @mouseenter="show(index)"
            @focus="show(index)"
            @click="show(index)"
          >
            <img :src="image.src" :alt="image.alt" class="size-full object-contain" loading="lazy">
          </button>
        </li>
      </ul>
    </div>

    <!-- Grande image. La hauteur est plafonnée à l'écran : sur un petit portable,
         une galerie plus haute que la fenêtre serait coupée par le bas pendant
         qu'elle est collée. -->
    <div
      class="group relative aspect-square overflow-hidden rounded-2xl bg-primary lg:max-h-[calc(100dvh-var(--spacing-header)-3rem)]"
      @keydown.left.prevent="many && show(active - 1)"
      @keydown.right.prevent="many && show(active + 1)"
    >
      <span
        v-if="badge"
        class="absolute top-4 left-4 z-10 rounded-full border border-secondary bg-primary/70 px-3 py-1 text-xs font-bold text-secondary"
      >
        {{ badge }}
      </span>

      <img
        v-if="images[active] && !broken.has(active)"
        :src="images[active].src"
        :alt="images[active].alt"
        class="size-full object-contain p-5"
        width="720"
        height="720"
        fetchpriority="high"
        @error="broken.add(active)"
      >
      <span v-else class="absolute inset-12 rounded-full bg-radial from-secondary/20 to-transparent blur-2xl" aria-hidden="true" />

      <template v-if="many">
        <button type="button" :class="[arrow, 'left-3']" aria-label="Image précédente" @click="show(active - 1)">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m12.5 4.5-5.5 5.5 5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button type="button" :class="[arrow, 'right-3']" aria-label="Image suivante" @click="show(active + 1)">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <p class="sr-only" aria-live="polite">Image {{ active + 1 }} sur {{ images.length }}</p>
      </template>
    </div>
  </div>
</template>
