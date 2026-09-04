<script setup lang="ts">
import type { CatalogProduct } from '#shared/types/catalog'
import { formatPrice } from '#shared/utils/format'

/**
 * Confirmation d'ajout au panier.
 *
 * Le tiroir confirme le geste sans quitter la page, et propose la suite :
 * poursuivre, aller au panier, ou compléter avec les produits associés. Sur
 * grand écran les suggestions s'installent à gauche du tiroir ; en dessous,
 * elles reviennent dans son flux.
 */
const { state, drawerOpen, lastAdded, lastAddedQuantity, count, closeDrawer } = useCart()
const { locked } = useScrollLock()

const suggestions = ref<CatalogProduct[]>([])
const panel = useTemplateRef<HTMLElement>('panel')
const broken = ref(false)

/** Ligne correspondant au produit ajouté, une fois le panier revalidé. */
const line = computed(() =>
  state.value?.lines.find(item => item.id === lastAdded.value?.id),
)

const heading = computed(() => {
  const quantity = lastAddedQuantity.value
  return `${quantity} article${quantity > 1 ? 's' : ''} ajouté${quantity > 1 ? 's' : ''} au panier`
})

watch(drawerOpen, (open) => {
  locked.value = open
  if (!open) return

  broken.value = false
  loadSuggestions()
  nextTick(() => panel.value?.focus())
})

/** Les suggestions suivent le dernier produit ajouté. */
async function loadSuggestions() {
  const product = lastAdded.value
  if (!product) return

  suggestions.value = []
  try {
    const { items } = await $fetch<{ items: CatalogProduct[] }>('/api/catalog/recommendations', {
      query: {
        product: product.id,
        category: product.categories[0]?.slug,
        exclude: (state.value?.lines ?? []).map(l => l.id).join(','),
        limit: 6,
      },
    })
    suggestions.value = items
  }
  catch {
    // Un bloc de suggestions vide ne justifie pas de bruiter la confirmation.
    suggestions.value = []
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDrawer()
}

/** Toute navigation referme le tiroir — y compris un clic sur une suggestion. */
const route = useRoute()
watch(() => route.fullPath, () => {
  if (drawerOpen.value) closeDrawer()
})

onBeforeUnmount(() => {
  locked.value = false
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-90 flex justify-end bg-primary-darker/80 backdrop-blur-sm"
        @click.self="closeDrawer"
        @keydown="onKeydown"
      >
        <!-- Suggestions à gauche : seulement là où la place existe. -->
        <div
          v-if="suggestions.length"
          class="hidden w-[620px] shrink-0 self-stretch overflow-y-auto p-10 xl:block"
          @click.self="closeDrawer"
        >
          <CartSuggestions :products="suggestions" />
        </div>

        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          leave-active-class="transition-transform duration-200 ease-in"
          enter-from-class="translate-x-full"
          leave-to-class="translate-x-full"
          appear
        >
          <div
            v-if="drawerOpen"
            ref="panel"
            class="flex h-full w-full max-w-[440px] flex-col bg-primary-dark shadow-drawer outline-none"
            role="dialog"
            aria-modal="true"
            :aria-label="heading"
            tabindex="-1"
            @keydown="onKeydown"
          >
            <!-- En-tête : la confirmation, et la sortie. -->
            <div class="flex items-start gap-3 border-b border-tertiary-500/10 p-5">
              <span class="grid size-9 shrink-0 place-items-center rounded-full border border-green-500/50" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="text-green-500">
                  <path d="m5 10.5 3.2 3.2L15 6.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <p class="flex-1 pt-1 text-h4 font-bold text-tertiary-50">{{ heading }}</p>
              <button
                type="button"
                class="grid size-9 shrink-0 place-items-center rounded-btn text-tertiary-800 transition-colors hover:bg-tertiary-500/8 hover:text-tertiary-50"
                aria-label="Fermer"
                @click="closeDrawer"
              >
                ✕
              </button>
            </div>

            <div class="flex-1 overflow-y-auto p-5">
              <!-- Produit ajouté -->
              <div v-if="lastAdded" class="flex gap-4 rounded-xl bg-primary p-3">
                <span class="relative shrink-0">
                  <span class="grid size-16 place-items-center overflow-hidden rounded-lg bg-primary-darker">
                    <img
                      v-if="lastAdded.images[0] && !broken"
                      :src="lastAdded.images[0].src"
                      :alt="lastAdded.images[0].alt"
                      class="size-full object-contain p-1.5"
                      width="64"
                      height="64"
                      @error="broken = true"
                    >
                  </span>
                  <span
                    class="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full bg-secondary text-[11px] font-bold text-on-accent"
                    aria-hidden="true"
                  >
                    {{ line?.quantity ?? lastAddedQuantity }}
                  </span>
                </span>

                <div class="min-w-0 flex-1">
                  <p class="line-clamp-2 text-[13px] font-medium text-tertiary-500">{{ lastAdded.name }}</p>
                  <p class="mt-1.5 text-body font-bold" :class="lastAdded.regularPrice ? 'text-secondary' : 'text-tertiary-50'">
                    {{ formatPrice(line?.lineTotal ?? lastAdded.price * lastAddedQuantity) }}
                  </p>
                </div>
              </div>

              <!-- Sous-total du panier entier, pas seulement du dernier ajout. -->
              <dl v-if="state" class="mt-4 flex items-baseline justify-between gap-4 px-1">
                <dt class="text-[13px] text-tertiary-800">
                  Sous-total ({{ count }} article{{ count > 1 ? 's' : '' }})
                </dt>
                <dd class="text-h4 font-bold text-tertiary-50 tabular-nums">
                  {{ formatPrice(state.totals.subtotal) }}
                </dd>
              </dl>

              <!-- Suggestions dans le flux, tant que la colonne de gauche n'existe pas. -->
              <div v-if="suggestions.length" class="mt-8 xl:hidden">
                <CartSuggestions :products="suggestions" />
              </div>
            </div>

            <div class="flex flex-col gap-2.5 border-t border-tertiary-500/10 p-5">
              <button type="button" class="btn-secondary w-full justify-center" @click="closeDrawer">
                Continuer mes achats
              </button>
              <NuxtLink to="/panier" class="btn-primary w-full justify-center" @click="closeDrawer">
                Aller au panier
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
