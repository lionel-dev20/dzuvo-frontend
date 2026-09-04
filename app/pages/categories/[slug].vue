<script setup lang="ts">
import type { CatalogCategory, ProductListResult, ProductSort } from '#shared/types/catalog'

/**
 * Page rubrique : sous-rubriques en raccourcis, puis la grille de produits
 * filtrable. Les filtres vivent dans l'URL — un résultat reste partageable et
 * le retour arrière fonctionne.
 */
const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug))

const { data: categories } = await useFetch<CatalogCategory[]>('/api/catalog/categories')

/** La rubrique courante peut être une sous-rubrique : on cherche aux deux niveaux. */
const current = computed(() => {
  const list = categories.value ?? []
  return list.find(c => c.slug === slug.value)
    ?? list.flatMap(c => c.children ?? []).find(c => c.slug === slug.value)
})
const parent = computed(() =>
  (categories.value ?? []).find(c => c.children?.some(child => child.slug === slug.value)),
)

const sort = computed(() => (route.query.sort as ProductSort) ?? 'popularity')
const page = computed(() => Number(route.query.page ?? 1))
const onSale = computed(() => route.query.onSale === 'true')
const inStock = computed(() => route.query.inStock === 'true')

const { data: result, status } = await useFetch<ProductListResult>('/api/catalog/products', {
  query: computed(() => ({
    category: slug.value,
    sort: sort.value,
    page: page.value,
    onSale: onSale.value ? 'true' : undefined,
    inStock: inStock.value ? 'true' : undefined,
  })),
})

const pageCount = computed(() =>
  Math.max(1, Math.ceil((result.value?.total ?? 0) / (result.value?.perPage ?? 24))),
)

/** Toute modification de filtre ramène en première page. */
function setQuery(patch: Record<string, string | undefined>) {
  router.push({ query: { ...route.query, ...patch, page: undefined } })
}

const sortOptions: { value: ProductSort, label: string }[] = [
  { value: 'popularity', label: 'Les plus populaires' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
]

const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 32 })

watchEffect(() => {
  if (categories.value && !current.value) {
    throw createError({ statusCode: 404, statusMessage: 'Rubrique introuvable' })
  }
})

useSeo({
  title: computed(() => current.value?.name ?? 'Catalogue').value,
  description: computed(() => current.value?.description ?? '').value,
})

const filterChip = 'rounded-btn border px-4 py-2 text-body transition-colors'
</script>

<template>
  <div ref="root" class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink to="/categories" class="hover:text-secondary">Catalogue</NuxtLink></li>
        <template v-if="parent">
          <li aria-hidden="true">/</li>
          <li><NuxtLink :to="`/categories/${parent.slug}`" class="hover:text-secondary">{{ parent.name }}</NuxtLink></li>
        </template>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">{{ current?.name }}</li>
      </ol>
    </nav>

    <header class="mb-10 max-w-2xl">
      <h1 class="text-h2 leading-tight font-bold text-balance text-tertiary-50 lg:text-h2-lg">
        {{ current?.name }}
      </h1>
      <p v-if="current?.description" class="mt-4 text-pretty text-tertiary-800">
        {{ current.description }}
      </p>
    </header>

    <!-- Raccourcis vers les sous-rubriques, quand il y en a. -->
    <section v-if="current?.children?.length" class="mb-12" aria-label="Sous-rubriques">
      <ul data-reveal-group class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <li v-for="child in current.children" :key="child.slug" data-reveal>
          <CategoryTile :category="child" compact />
        </li>
      </ul>
    </section>

    <div class="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <!-- Colonne de filtres -->
      <aside class="lg:w-64 lg:shrink-0" aria-label="Filtres">
        <div class="rounded-2xl bg-primary p-5">
          <h2 class="mb-4 text-h4 font-bold text-tertiary-50 uppercase">Filtrer</h2>

          <div class="flex flex-wrap gap-2 lg:flex-col lg:items-start">
            <button
              type="button"
              :class="[filterChip, onSale ? 'border-secondary bg-secondary/10 text-secondary' : 'border-tertiary-500/15 text-tertiary-600 hover:border-secondary/40']"
              :aria-pressed="onSale"
              @click="setQuery({ onSale: onSale ? undefined : 'true' })"
            >
              En promotion
            </button>
            <button
              type="button"
              :class="[filterChip, inStock ? 'border-secondary bg-secondary/10 text-secondary' : 'border-tertiary-500/15 text-tertiary-600 hover:border-secondary/40']"
              :aria-pressed="inStock"
              @click="setQuery({ inStock: inStock ? undefined : 'true' })"
            >
              En stock
            </button>
          </div>

          <template v-if="parent?.children?.length">
            <h3 class="mt-7 mb-3 text-[13px] font-bold tracking-[0.18em] text-tertiary-600 uppercase">
              Dans {{ parent.name }}
            </h3>
            <ul class="flex flex-col gap-2.5">
              <li v-for="sibling in parent.children" :key="sibling.slug">
                <NuxtLink
                  :to="`/categories/${sibling.slug}`"
                  class="text-body transition-colors hover:text-secondary"
                  :class="sibling.slug === slug ? 'font-bold text-secondary' : 'text-tertiary-800'"
                >
                  {{ sibling.name }}
                </NuxtLink>
              </li>
            </ul>
          </template>
        </div>
      </aside>

      <!-- Grille de produits -->
      <div class="min-w-0 flex-1">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
          <p class="text-body text-tertiary-800">
            {{ result?.total ?? 0 }} produit{{ (result?.total ?? 0) > 1 ? 's' : '' }}
          </p>

          <label class="flex items-center gap-2 text-body text-tertiary-800">
            <span class="sr-only">Trier par</span>
            <select
              class="rounded-btn border border-tertiary-500/15 bg-primary px-3 py-2 text-tertiary-500 outline-none focus:border-secondary"
              :value="sort"
              @change="setQuery({ sort: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <p v-if="status === 'pending'" class="py-16 text-center text-tertiary-800">Chargement…</p>

        <p v-else-if="!result?.items.length" class="rounded-2xl bg-primary p-10 text-center text-tertiary-800">
          Aucun produit ne correspond à ces filtres.
        </p>

        <ul v-else data-reveal-group class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          <li v-for="product in result.items" :key="product.id" data-reveal>
            <ProductCard :product="product" />
          </li>
        </ul>

        <!-- Pagination : des liens, pour rester indexables et partageables. -->
        <nav v-if="pageCount > 1" class="mt-10 flex justify-center gap-2" aria-label="Pagination">
          <NuxtLink
            v-for="p in pageCount"
            :key="p"
            :to="{ query: { ...route.query, page: p === 1 ? undefined : p } }"
            class="grid size-10 place-items-center rounded-btn text-body transition-colors"
            :class="p === page ? 'bg-secondary font-bold text-on-accent' : 'bg-primary text-tertiary-600 hover:text-secondary'"
            :aria-current="p === page ? 'page' : undefined"
          >
            {{ p }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </div>
</template>
