<script setup lang="ts">
import type { CatalogProduct, ProductListResult } from '#shared/types/catalog'
import type { ReviewsResult } from '#shared/types/reviews'
import { formatPrice as money } from '#shared/utils/format'
import { priceLine } from '#shared/utils/offers'

/**
 * Fiche produit, pensée pour convertir.
 *
 * De haut en bas, ce que le visiteur lit avant d'acheter : le visuel, la note
 * et le prix, le choix du lot, le bouton, puis ce qui rassure (paiement,
 * livraison, garantie). Les détails se replient en dessous, les avis ferment la
 * page — et une barre d'achat suit le visiteur sur mobile.
 *
 * Sur ordinateur, la galerie reste collée pendant que la colonne d'achat
 * défile : le visuel ne disparaît jamais pendant qu'on lit.
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

/*
 * Avis : lus ici et non dans le composant, pour qu'ils soient dans le HTML
 * servi (référencement) sans rendre le composant asynchrone — voir la remarque
 * sur les transitions dans nuxt.config.
 */
const { data: reviews } = await useFetch<ReviewsResult>('/api/catalog/reviews', {
  query: computed(() => ({ product: product.value?.id })),
  key: computed(() => `reviews-${product.value?.id}`),
  default: () => null,
})

const quantity = ref(1)

const { add } = useCart()

/** Plafond de commande : le stock quand il est géré, sinon un garde-fou. */
const ceiling = computed(() => product.value?.stockQuantity ?? 99)

/**
 * Un produit à déclinaisons demande de choisir une variation avant d'être
 * commandé : tant que le sélecteur n'existe pas, on ne l'ajoute pas au panier.
 */
const needsChoice = computed(() => Boolean(product.value?.variable) || product.value?.purchasable === false)
const canAdd = computed(() => Boolean(product.value?.inStock) && !needsChoice.value)

/** Prix de la ligne, offre de quantité comprise : même calcul que le serveur. */
const line = computed(() => priceLine(product.value!.price, quantity.value, product.value!.quantityOffers))

function addToCart() {
  if (!product.value || !canAdd.value) return
  add(product.value, quantity.value)
}

const discount = computed(() => {
  const p = product.value
  return p?.regularPrice ? Math.round((1 - p.price / p.regularPrice) * 100) : 0
})

/* Note : celle de la liste d'avis quand on l'a, sinon celle de WooCommerce. */
const rating = computed(() => (reviews.value?.items.length ? reviews.value.average : product.value!.rating))
const reviewCount = computed(() => (reviews.value?.items.length ? reviews.value.total : product.value!.reviews))

const buyBox = useTemplateRef<HTMLElement>('buyBox')
const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 32 })

useSeo({
  title: computed(() => product.value?.name ?? 'Produit').value,
  description: computed(() => product.value?.excerpt ?? '').value,
})
useProductSchema(product.value!, reviews.value)

const summary = 'cursor-pointer list-none py-4 text-body font-bold text-tertiary-50 [&::-webkit-details-marker]:hidden flex items-center justify-between gap-4'
</script>

<template>
  <div v-if="product" ref="root" class="px-2.5 md:px-5 lg:px-24 pt-10 pb-28 lg:pb-20">
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

    <div class="grid items-start gap-3 lg:grid-cols-2">
      <!-- Visuels : collés pendant la lecture de la colonne d'achat. -->
      <div class="lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)]">
        <ProductGallery :images="product.images" :badge="product.badge" />
      </div>

      <!-- Achat -->
      <div>
        <p v-if="product.sku" class="text-[13px] text-tertiary-800">Référence {{ product.sku }}</p>

        <h1 class="mt-2 text-h2 leading-tight font-bold text-balance text-tertiary-50">
          {{ product.name }}
        </h1>

        <!-- Note : toujours visible, elle mène aux avis. -->
        <a href="#avis" class="mt-3 inline-flex items-center gap-2 hover:text-secondary">
          <StarRating v-if="reviewCount" :value="rating" />
          <span class="text-body text-tertiary-800">
            <template v-if="reviewCount">{{ rating.toFixed(1).replace('.', ',') }} sur 5 · {{ reviewCount }} avis</template>
            <template v-else>Soyez le premier à donner votre avis</template>
          </span>
        </a>

        <!-- Prix -->
        <div class="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p class="text-h1 leading-none font-bold" :class="product.regularPrice ? 'text-secondary' : 'text-tertiary-50'">
            {{ money(product.price) }}
          </p>
          <template v-if="product.regularPrice">
            <span class="text-body text-tertiary-800 line-through">{{ money(product.regularPrice) }}</span>
            <span class="rounded bg-secondary px-2 py-0.5 text-xs font-bold text-on-accent">-{{ discount }} %</span>
          </template>
        </div>

        <p class="mt-4 flex items-center gap-2 text-body" :class="product.inStock ? 'text-tertiary-600' : 'text-secondary'">
          <span class="size-2 rounded-full" :class="product.inStock ? 'bg-green-500' : 'bg-secondary'" aria-hidden="true" />
          {{ product.stockLabel }}
        </p>

        <p v-if="product.excerpt" class="mt-5 text-pretty text-tertiary-600">{{ product.excerpt }}</p>

        <!-- Bloc d'achat -->
        <div ref="buyBox">
          <!-- Lots : « 2 articles, -10 % ». Absents si le produit n'a pas d'offre. -->
          <QuantityOffers
            v-if="product.inStock && product.quantityOffers?.length"
            v-model="quantity"
            :unit-price="product.price"
            :offers="product.quantityOffers"
            :image="product.images[0]?.src"
            :name="product.name"
          />

          <div class="mt-6 flex flex-wrap items-stretch gap-3">
            <div v-if="product.inStock" class="flex items-center rounded-btn border border-tertiary-500/15">
              <button
                type="button"
                class="grid size-12 place-items-center text-tertiary-500 hover:text-secondary"
                aria-label="Retirer une unité"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                −
              </button>
              <span class="w-10 text-center text-tertiary-50 tabular-nums" aria-live="polite">{{ quantity }}</span>
              <button
                type="button"
                class="grid size-12 place-items-center text-tertiary-500 hover:text-secondary disabled:cursor-default disabled:opacity-30"
                aria-label="Ajouter une unité"
                :disabled="quantity >= ceiling"
                @click="quantity = Math.min(ceiling, quantity + 1)"
              >
                +
              </button>
            </div>

            <button
              type="button"
              class="min-h-12 flex-1 justify-center"
              :class="canAdd ? 'btn-primary' : 'btn-secondary'"
              :disabled="product.inStock && !canAdd"
              @click="addToCart"
            >
              <svg v-if="product.inStock" width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 4h2l1.6 9.2a1.5 1.5 0 0 0 1.5 1.3h6.9a1.5 1.5 0 0 0 1.5-1.2L18 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="8.5" cy="17.4" r="1.3" stroke="currentColor" stroke-width="1.6" />
                <circle cx="15" cy="17.4" r="1.3" stroke="currentColor" stroke-width="1.6" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2.4a5 5 0 0 0-5 5v3.1l-1.4 2.4a.6.6 0 0 0 .5.9h11.8a.6.6 0 0 0 .5-.9L15 10.5V7.4a5 5 0 0 0-5-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <path d="M8.1 16.4a2 2 0 0 0 3.8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              <template v-if="!product.inStock">Me prévenir du retour</template>
              <template v-else-if="canAdd">Ajouter au panier · {{ money(line.total) }}</template>
              <template v-else>Bientôt commandable</template>
            </button>
          </div>

          <!-- Ce que l'offre fait économiser, au moment où l'on décide. -->
          <p v-if="line.saving && canAdd" class="mt-3 text-[13px] font-medium text-secondary">
            Vous économisez {{ money(line.saving) }} avec cette quantité.
          </p>

          <!-- Déclinaisons : la commande en ligne attend le sélecteur de variation. -->
          <p v-if="product.inStock && needsChoice" class="mt-3 text-[13px] text-tertiary-800">
            Ce produit existe en plusieurs déclinaisons. Contactez-nous pour le commander.
          </p>
        </div>

        <TrustBadges />

        <!-- Détails repliés : la page reste courte, rien n'est perdu. -->
        <div class="mt-8 divide-y divide-tertiary-500/10 border-y border-tertiary-500/10">
          <details v-if="product.description" open>
            <summary :class="summary">
              Description
              <span aria-hidden="true" class="text-tertiary-800">+</span>
            </summary>
            <p class="pb-5 text-pretty text-tertiary-600">{{ product.description }}</p>
          </details>

          <details v-if="product.attributes.length">
            <summary :class="summary">
              Caractéristiques
              <span aria-hidden="true" class="text-tertiary-800">+</span>
            </summary>
            <dl class="divide-y divide-tertiary-500/10 pb-3">
              <div v-for="attribute in product.attributes" :key="attribute.name" class="flex justify-between gap-6 py-2.5">
                <dt class="text-body text-tertiary-800">{{ attribute.name }}</dt>
                <dd class="text-body font-medium text-tertiary-500">{{ attribute.value }}</dd>
              </div>
            </dl>
          </details>

          <details>
            <summary :class="summary">
              Livraison et paiement
              <span aria-hidden="true" class="text-tertiary-800">+</span>
            </summary>
            <ul class="list-disc space-y-2 pb-5 pl-5 text-tertiary-600">
              <li>Livraison programmée d’une ville à l’autre, partout au Canada : le délai et le coût sont affichés avant de payer.</li>
              <li>Paiement par carte, sécurisé et chiffré par Stripe. Votre numéro de carte ne transite jamais par notre site.</li>
              <li>Une question avant de commander ? <NuxtLink to="/contact" class="text-secondary underline">Écrivez à un conseiller</NuxtLink>.</li>
            </ul>
          </details>
        </div>
      </div>
    </div>

    <div class="mt-16 lg:mt-20">
      <ProductReviews
        :product-id="product.id"
        :reviews="reviews"
        :fallback-rating="product.rating"
        :fallback-count="product.reviews"
      />
    </div>

    <section v-if="suggestions.length" class="mt-16" aria-label="Produits similaires">
      <h2 class="mb-6 text-h3 font-bold text-tertiary-50">Dans la même rubrique</h2>
      <ul data-reveal-group class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <li v-for="item in suggestions" :key="item.id" data-reveal>
          <ProductCard :product="item" />
        </li>
      </ul>
    </section>

    <!-- Barre d'achat mobile : visible une fois le bloc d'achat dépassé. -->
    <StickyBuyBar
      v-if="canAdd"
      :target="buyBox"
      :name="product.name"
      :total="line.total"
      label="Ajouter au panier"
      @buy="addToCart"
    />
  </div>
</template>
