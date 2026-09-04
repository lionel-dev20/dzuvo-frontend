<script setup lang="ts">
import type { CatalogProduct } from '#shared/types/catalog'

/**
 * Panier : les lignes à gauche, le récapitulatif à droite, les suggestions
 * en dessous. Les montants sont recalculés à l'ouverture de la page — un
 * panier laissé de côté quelques jours ne doit pas afficher un prix périmé.
 */
const { state, isEmpty, pending, error, sync, setQuantity, remove } = useCart()

await sync()

/* Suggestions : bâties sur le premier article du panier, les autres exclus. */
const anchor = computed(() => state.value?.lines[0])
const { data: recommendations } = await useAsyncData<{ items: CatalogProduct[] }>(
  'cart-recommendations',
  () => $fetch('/api/catalog/recommendations', {
    query: {
      product: anchor.value?.id,
      exclude: (state.value?.lines ?? []).map(line => line.id).join(','),
      limit: 8,
    },
  }),
  { watch: [anchor], default: () => ({ items: [] }) },
)

const suggestions = computed(() => recommendations.value?.items ?? [])

/* Carrousel de suggestions : défilement natif, les flèches paginent. */
const track = useTemplateRef<HTMLElement>('track')
const atStart = ref(true)
const atEnd = ref(false)

function updateBounds() {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 2
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
}

function page(direction: 1 | -1) {
  track.value?.scrollBy({ left: direction * (track.value?.clientWidth ?? 0), behavior: 'smooth' })
}

onMounted(() => {
  updateBounds()
  window.addEventListener('resize', updateBounds)
  onBeforeUnmount(() => window.removeEventListener('resize', updateBounds))
})

/** Message d'anomalie : un article a disparu ou a été ajusté depuis l'ajout. */
function issueLabel(issue: NonNullable<typeof state.value>['issues'][number]) {
  switch (issue.reason) {
    case 'missing':
      return 'Un article n’est plus au catalogue et a été retiré de votre panier.'
    case 'out-of-stock':
      return `« ${issue.name} » n’est plus disponible et a été retiré de votre panier.`
    default:
      return `La quantité de « ${issue.name} » a été ramenée à ${issue.quantity} — stock disponible.`
  }
}

const arrow = 'grid size-10 shrink-0 place-items-center rounded-full bg-tertiary-500/10 text-tertiary-500 transition-colors hover:bg-secondary hover:text-on-accent disabled:cursor-default disabled:opacity-30 disabled:hover:bg-tertiary-500/10 disabled:hover:text-tertiary-500'

useSeo({
  title: 'Votre panier',
  description: 'Vérifiez vos articles et finalisez votre commande DZUVO.',
  noindex: true,
})
</script>

<template>
  <div class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <CartEmpty v-if="isEmpty" />

    <template v-else>
      <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div>
          <h1 class="text-h2 font-bold text-tertiary-50">Panier</h1>
          <span class="mt-3 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />

          <p v-if="error" class="mt-6 rounded-xl border border-secondary/40 bg-secondary/8 p-4 text-body text-tertiary-50" role="alert">
            {{ error }}
          </p>

          <!-- Ce qui a changé depuis la mise au panier, dit explicitement. -->
          <ul v-if="state?.issues.length" class="mt-6 flex flex-col gap-2">
            <li
              v-for="issue in state.issues"
              :key="`${issue.id}-${issue.reason}`"
              class="rounded-xl border border-secondary/30 bg-secondary/6 px-4 py-3 text-[13px] text-tertiary-500"
            >
              {{ issueLabel(issue) }}
            </li>
          </ul>

          <ul class="mt-6 flex flex-col gap-3" :class="pending ? 'opacity-60 transition-opacity' : ''">
            <li v-for="line in state?.lines ?? []" :key="line.id">
              <CartLineItem
                :line="line"
                @quantity="setQuantity(line.id, $event)"
                @remove="remove(line.id)"
              />
            </li>
          </ul>

          <!-- Suggestions -->
          <section v-if="suggestions.length" class="mt-12" aria-label="Nos clients ont également acheté">
            <div class="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-h3 font-bold text-tertiary-50">Nos clients ont également acheté…</h2>
                <span class="mt-3 block h-0.5 w-14 rounded-full bg-secondary" aria-hidden="true" />
              </div>

              <div class="flex gap-2">
                <button type="button" :class="arrow" :disabled="atStart" aria-label="Suggestions précédentes" @click="page(-1)">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <button type="button" :class="arrow" :disabled="atEnd" aria-label="Suggestions suivantes" @click="page(1)">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <ul
              ref="track"
              class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              @scroll.passive="updateBounds"
            >
              <li
                v-for="product in suggestions"
                :key="product.id"
                class="w-[calc(50%-0.5rem)] shrink-0 snap-start lg:w-[calc(33.333%-0.7rem)]"
              >
                <ProductCard :product="product" />
              </li>
            </ul>
          </section>
        </div>

        <CartSummary class="lg:sticky lg:top-[calc(var(--spacing-header)+1rem)]" />
      </div>
    </template>
  </div>
</template>
