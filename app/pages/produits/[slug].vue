<script setup lang="ts">
import type { CatalogProduct, ProductListResult } from '#shared/types/catalog'

/**
 * Fiche produit : visuel à gauche, achat à droite, puis caractéristiques et
 * suggestions issues de la même rubrique.
 */
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: product } = await useFetch<CatalogProduct>(
  () => `/api/catalog/product/${slug.value}`,
)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
}

/** Suggestions : même rubrique, produit courant exclu. */
const { data: related } = await useFetch<ProductListResult>('/api/catalog/products', {
  query: computed(() => ({ category: product.value?.categories[0]?.slug, perPage: 8 })),
})
const suggestions = computed(() =>
  (related.value?.items ?? []).filter(p => p.slug !== slug.value).slice(0, 4),
)

const activeImage = ref(0)
const brokenImages = reactive(new Set<number>())
const quantity = ref(1)

const money = (value: number) => `${value.toFixed(2).replace('.', ',')} $`
const discount = computed(() => {
  const p = product.value
  return p?.regularPrice ? Math.round((1 - p.price / p.regularPrice) * 100) : 0
})

const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 32 })

useSeo({
  title: computed(() => product.value?.name ?? 'Produit').value,
  description: computed(() => product.value?.excerpt ?? '').value,
})
</script>

<template>
  <div v-if="product" ref="root" class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink to="/categories" class="hover:text-secondary">Catalogue</NuxtLink></li>
        <template v-if="product.categories[0]">
          <li aria-hidden="true">/</li>
          <li>
            <NuxtLink :to="`/categories/${product.categories[0].slug}`" class="hover:text-secondary">
              {{ product.categories[0].name }}
            </NuxtLink>
          </li>
        </template>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">{{ product.name }}</li>
      </ol>
    </nav>

    <div class="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <!-- Visuels -->
      <div class="flex flex-col gap-4">
        <div class="relative aspect-square overflow-hidden rounded-2xl bg-primary">
          <span
            v-if="product.badge"
            class="absolute top-4 left-4 z-10 rounded-full border border-secondary bg-primary/70 px-3 py-1 text-xs font-bold text-secondary"
          >
            {{ product.badge }}
          </span>
          <img
            v-if="product.images[activeImage] && !brokenImages.has(activeImage)"
            :src="product.images[activeImage].src"
            :alt="product.images[activeImage].alt"
            class="size-full object-contain p-8"
            width="720"
            height="720"
            fetchpriority="high"
            @error="brokenImages.add(activeImage)"
          >
          <span v-else class="absolute inset-12 rounded-full bg-radial from-secondary/20 to-transparent blur-2xl" aria-hidden="true" />
        </div>

        <!-- Vignettes : seulement s'il y a de quoi choisir. -->
        <ul v-if="product.images.length > 1" class="grid grid-cols-4 gap-3">
          <li v-for="(image, index) in product.images" :key="image.src">
            <button
              type="button"
              class="aspect-square w-full cursor-pointer overflow-hidden rounded-xl bg-primary p-2 transition-colors"
              :class="index === activeImage ? 'ring-2 ring-secondary' : 'hover:ring-1 hover:ring-tertiary-500/30'"
              :aria-label="`Visuel ${index + 1}`"
              :aria-current="index === activeImage"
              @click="activeImage = index"
            >
              <img :src="image.src" :alt="image.alt" class="size-full object-contain" loading="lazy">
            </button>
          </li>
        </ul>
      </div>

      <!-- Achat -->
      <div>
        <p v-if="product.sku" class="text-[13px] text-tertiary-800">Référence {{ product.sku }}</p>

        <h1 class="mt-2 text-h2 leading-tight font-bold text-balance text-tertiary-50">
          {{ product.name }}
        </h1>

        <div v-if="product.reviews" class="mt-4 flex items-center gap-2">
          <div class="flex" aria-hidden="true">
            <svg
              v-for="star in 5"
              :key="star"
              width="16" height="16" viewBox="0 0 20 20"
              :class="star <= Math.round(product.rating) ? 'fill-secondary' : 'fill-tertiary-500/20'"
            >
              <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
            </svg>
          </div>
          <span class="text-body text-tertiary-800">
            {{ product.rating.toFixed(1).replace('.', ',') }} sur 5 ({{ product.reviews }} avis)
          </span>
        </div>

        <p v-if="product.excerpt" class="mt-5 text-pretty text-tertiary-600">{{ product.excerpt }}</p>

        <div class="mt-8 rounded-2xl bg-primary p-6">
          <div v-if="product.regularPrice" class="mb-2 flex items-center gap-3">
            <span class="text-body text-tertiary-800 line-through">{{ money(product.regularPrice) }}</span>
            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-tertiary-50">-{{ discount }} %</span>
          </div>

          <p class="text-h1 leading-none font-bold" :class="product.regularPrice ? 'text-secondary' : 'text-tertiary-50'">
            {{ money(product.price) }}
          </p>

          <p class="mt-3 flex items-center gap-2 text-body" :class="product.inStock ? 'text-tertiary-600' : 'text-secondary'">
            <span class="size-2 rounded-full" :class="product.inStock ? 'bg-green-500' : 'bg-secondary'" aria-hidden="true" />
            {{ product.stockLabel }}
          </p>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <div v-if="product.inStock" class="flex items-center rounded-btn border border-tertiary-500/15">
              <button
                type="button"
                class="grid size-11 cursor-pointer place-items-center text-tertiary-500 hover:text-secondary"
                aria-label="Retirer une unité"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                −
              </button>
              <span class="w-10 text-center text-tertiary-50 tabular-nums" aria-live="polite">{{ quantity }}</span>
              <button
                type="button"
                class="grid size-11 cursor-pointer place-items-center text-tertiary-500 hover:text-secondary"
                aria-label="Ajouter une unité"
                @click="quantity++"
              >
                +
              </button>
            </div>

            <button type="button" class="flex-1 justify-center" :class="product.inStock ? 'btn-primary' : 'btn-secondary'">
              <svg v-if="product.inStock" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 4h2l1.6 9.2a1.5 1.5 0 0 0 1.5 1.3h6.9a1.5 1.5 0 0 0 1.5-1.2L18 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="8.5" cy="17.4" r="1.3" stroke="currentColor" stroke-width="1.6" />
                <circle cx="15" cy="17.4" r="1.3" stroke="currentColor" stroke-width="1.6" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2.4a5 5 0 0 0-5 5v3.1l-1.4 2.4a.6.6 0 0 0 .5.9h11.8a.6.6 0 0 0 .5-.9L15 10.5V7.4a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <path d="M8.1 16.4a2 2 0 0 0 3.8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              {{ product.inStock ? 'Ajouter au panier' : 'Me prévenir du retour' }}
            </button>
          </div>
        </div>

        <!-- Caractéristiques -->
        <dl v-if="product.attributes.length" class="mt-8 divide-y divide-tertiary-500/10">
          <div v-for="attribute in product.attributes" :key="attribute.name" class="flex justify-between gap-6 py-3">
            <dt class="text-body text-tertiary-800">{{ attribute.name }}</dt>
            <dd class="text-body font-medium text-tertiary-500">{{ attribute.value }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <section v-if="product.description" class="mt-16 max-w-3xl">
      <h2 class="text-h3 font-bold text-tertiary-50">Description</h2>
      <p class="mt-4 text-pretty text-tertiary-600">{{ product.description }}</p>
    </section>

    <section v-if="suggestions.length" class="mt-16" aria-label="Produits similaires">
      <h2 class="mb-6 text-h3 font-bold text-tertiary-50">Dans la même rubrique</h2>
      <ul data-reveal-group class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <li v-for="item in suggestions" :key="item.id" data-reveal>
          <ProductCard :product="item" />
        </li>
      </ul>
    </section>
  </div>
</template>
