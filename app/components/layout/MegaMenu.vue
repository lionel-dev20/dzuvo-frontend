<script setup lang="ts">
import type { NavItem } from '#shared/types/navigation'

/**
 * Navigation principale avec méga-menu, sur le modèle du NavigationMenu de
 * shadcn/ui : déclencheur à chevron, panneau animé, grille de liens portant
 * un intitulé et une ligne de contexte, et une carte mise en avant.
 *
 * Le motif d'ouverture est celui d'un « disclosure » (bouton + région), pas
 * d'un menu applicatif : ce sont des liens de navigation, et les rôles ARIA de
 * menu feraient annoncer aux lecteurs d'écran une sémantique qui n'est pas la
 * bonne.
 */
const props = defineProps<{ items: NavItem[] }>()

/** Index du panneau ouvert ; -1 quand tout est replié. */
const open = ref(-1)
const root = useTemplateRef<HTMLElement>('root')
const triggers = ref<HTMLButtonElement[]>([])

/* Ouverture au survol, avec intention : sans ces délais, un simple passage de
   souris vers le panier ferait clignoter chaque panneau au passage.

   La fermeture est plus patiente que l'ouverture : le trajet du déclencheur
   vers un lien du panneau est rarement une ligne droite, et une souris qui
   ralentit en chemin ne doit pas faire disparaître ce qu'elle vise. */
const OPEN_DELAY = 110
const CLOSE_DELAY = 260
let timer: ReturnType<typeof setTimeout> | undefined

function schedule(fn: () => void, delay: number) {
  clearTimeout(timer)
  timer = setTimeout(fn, delay)
}

function hoverOpen(index: number) {
  // Un panneau déjà ouvert : on bascule sans attendre, comme shadcn.
  schedule(() => (open.value = index), open.value === -1 ? OPEN_DELAY : 0)
}

function hoverClose() {
  schedule(() => (open.value = -1), CLOSE_DELAY)
}

/** Le pointeur a rejoint le panneau : on annule la fermeture en attente. */
function keepOpen() {
  clearTimeout(timer)
}

function toggle(index: number) {
  clearTimeout(timer)
  open.value = open.value === index ? -1 : index
}

function close(refocus = false) {
  clearTimeout(timer)
  const index = open.value
  open.value = -1
  if (refocus && index >= 0) triggers.value[index]?.focus()
}

/** Le panneau se referme dès que le focus quitte l'ensemble de la navigation. */
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && root.value?.contains(next)) return
  open.value = -1
}

onMounted(() => {
  const onPointerDown = (event: PointerEvent) => {
    if (!root.value?.contains(event.target as Node)) open.value = -1
  }

  /* Échap est écouté sur la fenêtre, pas sur la navigation : un panneau ouvert
     au survol n'a reçu aucun focus, et un écouteur local ne verrait jamais la
     touche. Le focus n'est rendu que s'il était déjà dans la barre — sinon on
     le déplacerait sans que personne l'ait demandé. */
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || open.value === -1) return
    close(root.value?.contains(document.activeElement) ?? false)
  }

  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('keydown', onKeydown)

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('keydown', onKeydown)
    clearTimeout(timer)
  })
})

// Changer de page referme le panneau resté ouvert.
const route = useRoute()
watch(() => route.fullPath, () => (open.value = -1))

/** Colonnes du panneau : au-delà de six rubriques, on passe sur trois colonnes. */
function columns(item: NavItem) {
  return (item.children?.length ?? 0) > 6 ? 'md:grid-cols-3' : 'md:grid-cols-2'
}

const trigger = 'flex items-center gap-1.5 rounded-btn px-3 py-2 text-[15px] font-medium uppercase underline-offset-8 decoration-2 transition-colors'
const idle = 'text-tertiary-500 hover:bg-tertiary-500/6 [&.router-link-exact-active]:text-tertiary-50 [&.router-link-exact-active]:underline [&.router-link-exact-active]:decoration-tertiary-50'
</script>

<template>
  <nav
    ref="root"
    class="relative hidden items-center gap-0.5 nav:flex"
    aria-label="Navigation principale"
    @focusout="onFocusOut"
    @pointerleave="hoverClose"
  >
    <template v-for="(item, index) in props.items" :key="item.to">
      <!-- Rubrique à sous-menu : bouton, car elle ouvre un panneau. -->
      <!-- La fermeture est confiée au <nav> : quitter le déclencheur pour
           entrer dans le panneau ne doit rien déclencher, alors que quitter
           la barre entière doit tout refermer. -->
      <div
        v-if="item.children?.length"
        @pointerenter="hoverOpen(index)"
      >
        <button
          :ref="el => { if (el) triggers[index] = el as HTMLButtonElement }"
          type="button"
          :class="[trigger, open === index ? 'bg-tertiary-500/8 text-tertiary-50' : idle]"
          :aria-expanded="open === index"
          :aria-controls="`megamenu-${index}`"
          @click="toggle(index)"
        >
          {{ item.label }}
          <svg
            class="transition-transform duration-200"
            :class="open === index ? 'rotate-180' : ''"
            width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <NuxtLink
        v-else
        :to="item.to"
        :class="[trigger, idle]"
        :target="item.external ? '_blank' : undefined"
        :rel="item.external ? 'noopener' : undefined"
        @pointerenter="hoverClose"
      >
        {{ item.label }}
      </NuxtLink>
    </template>

    <!-- Panneau : un seul à la fois, positionné sous la barre de navigation. -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 -translate-y-1 scale-[0.98]"
      leave-to-class="opacity-0 -translate-y-1 scale-[0.98]"
    >
      <!-- Le décalage est porté par le padding, pas par la position : une marge
           laisserait une bande morte de 12 px entre la barre et le panneau, où
           le survol se perd en cours de route. Ici la zone est continue. -->
      <div
        v-if="open !== -1 && props.items[open]"
        :id="`megamenu-${open}`"
        class="absolute top-full left-0 z-70 w-[min(880px,88vw)] origin-top pt-3"
        @pointerenter="keepOpen"
      >
        <div class="grid gap-4 rounded-xl border border-tertiary-500/12 bg-primary p-4 shadow-menu md:grid-cols-[240px_minmax(0,1fr)]">
          <!-- Carte de tête : mène à la rubrique entière. -->
          <NuxtLink
            :to="props.items[open].to"
            class="group relative flex flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br from-secondary/25 via-primary-dark to-primary-darker p-5 transition-colors hover:from-secondary/35"
            @click="close()"
          >
            <span class="absolute -top-8 -right-8 size-32 rounded-full bg-secondary/20 blur-2xl" aria-hidden="true" />
            <span class="relative text-h4 font-bold text-tertiary-50">{{ props.items[open].label }}</span>
            <span v-if="props.items[open].description" class="relative mt-2 text-[13px] leading-snug text-tertiary-600">
              {{ props.items[open].description }}
            </span>
            <span class="relative mt-4 flex items-center gap-1.5 text-[13px] font-bold text-secondary">
              Tout voir
              <svg
                class="transition-transform group-hover:translate-x-1"
                width="14" height="10" viewBox="0 0 17 12" fill="none" aria-hidden="true"
              >
                <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </NuxtLink>

          <!-- Grille des rubriques -->
          <ul class="grid gap-1" :class="columns(props.items[open]!)">
            <li v-for="child in props.items[open].children" :key="child.to">
              <NuxtLink
                :to="child.to"
                class="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-tertiary-500/8"
                :target="child.external ? '_blank' : undefined"
                :rel="child.external ? 'noopener' : undefined"
                @click="close()"
              >
                <span class="text-[15px] font-medium text-tertiary-500">{{ child.label }}</span>
                <span v-if="child.description" class="line-clamp-2 text-[13px] leading-snug text-tertiary-800">
                  {{ child.description }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </nav>
</template>
