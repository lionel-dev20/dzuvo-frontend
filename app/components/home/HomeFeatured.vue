<script setup lang="ts">
import type { CatalogProduct } from '#shared/types/catalog'
import { formatPrice as money } from '#shared/utils/format'
import { priceLine } from '#shared/utils/offers'

/**
 * Produit mis en avant : prix barré, remise, et offres de quantité si la fiche
 * en porte (« Acheter 2, -5 % »).
 *
 * Tout vient de la fiche produit : si WooCommerce répond, ce sont ses valeurs
 * — prix, prix barré, stock, offres — qui s'affichent, et c'est ce produit-là
 * qui part au panier. Sinon (boutique injoignable, développement local), la
 * copie ci-dessous prend le relais et le bouton ouvre la fiche.
 */
const SLUG = 'pochette-etanche-flottante-pour-telephone-ip68'
const to = `/produits/${SLUG}`

const UPLOADS = 'https://app.dzuvo.com/wp-content/uploads/2026/11/'
const suffix = 'Sac-etanche-flottant-IP68-anti-poussiere-en-eponge-pour-telephone-portable'

/** Copie de la fiche, pour n'avoir jamais de vitrine vide. */
const fallback = {
  name: 'Pochette étanche flottante pour téléphone – IP68',
  excerpt: 'Pensée pour les activités aquatiques : elle protège votre téléphone de l’eau et du sable, et flotte à la surface si elle vous échappe.',
  price: 456,
  regularPrice: 6000,
  inStock: true,
  quantityOffers: [{ quantity: 2, percent: 5 }, { quantity: 3, percent: 8 }],
  images: [
    { src: `${UPLOADS}${suffix}.jpg`, alt: 'Pochette étanche flottante, vue d’ensemble' },
    { src: `${UPLOADS}1-${suffix}.avif`, alt: 'Pochette étanche flottante, détail' },
    { src: `${UPLOADS}2-${suffix}.avif`, alt: 'Pochette étanche flottante, en usage' },
    { src: `${UPLOADS}3-${suffix}.avif`, alt: 'Pochette étanche flottante, fermeture' },
  ],
}

const { data: live } = useFetch<CatalogProduct>(`/api/catalog/product/${SLUG}`, {
  key: `home-featured-${SLUG}`,
  default: () => null,
})

const product = computed(() => {
  const p = live.value
  return {
    name: p?.name ?? fallback.name,
    excerpt: p?.excerpt || fallback.excerpt,
    price: p?.price ?? fallback.price,
    regularPrice: p ? p.regularPrice : fallback.regularPrice,
    inStock: p?.inStock ?? fallback.inStock,
    offers: p ? (p.quantityOffers ?? []) : fallback.quantityOffers,
    images: p?.images?.length ? p.images : fallback.images,
  }
})

const root = useTemplateRef<HTMLElement>('root')
useReveal(root)

const quantity = ref(1)
const active = ref(0)
const broken = reactive(new Set<number>())

const line = computed(() => priceLine(product.value.price, quantity.value, product.value.offers))
const discount = computed(() => {
  const { price, regularPrice } = product.value
  return regularPrice && regularPrice > price ? Math.round((1 - price / regularPrice) * 100) : 0
})

const { add } = useCart()
function buy() {
  const p = live.value
  // Sans fiche réelle, rien de sûr à mettre au panier : la fiche s'en charge.
  if (!p || !p.inStock || p.variable || p.purchasable === false) return navigateTo(to)
  add(p, quantity.value)
}
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-labelledby="vedette-titre">
    <div class="grid items-center gap-8 rounded-3xl bg-primary p-5 shadow-panel md:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
      <!-- Visuels -->
      <div data-r>
        <div class="relative aspect-square overflow-hidden rounded-2xl bg-primary-darker">
          <span
            v-if="discount"
            class="absolute top-4 left-4 z-10 rounded-full bg-secondary px-3 py-1 text-[13px] font-bold text-on-accent"
          >
            −{{ discount }} %
          </span>
          <img
            v-if="product.images[active] && !broken.has(active)"
            :key="active"
            :src="product.images[active]!.src"
            :alt="product.images[active]!.alt"
            class="size-full object-contain p-6 transition-opacity duration-300"
            width="640"
            height="640"
            loading="lazy"
            @error="broken.add(active)"
          >
        </div>

        <ul v-if="product.images.length > 1" class="mt-3 flex gap-2" aria-label="Autres visuels">
          <li v-for="(image, index) in product.images.slice(0, 5)" :key="image.src">
            <button
              type="button"
              class="size-16 overflow-hidden rounded-xl border-2 bg-primary-darker transition-colors"
              :class="active === index ? 'border-secondary' : 'border-transparent hover:border-tertiary-500/30'"
              :aria-label="`Voir le visuel ${index + 1}`"
              :aria-current="active === index"
              @click="active = index"
            >
              <img :src="image.src" alt="" class="size-full object-contain p-1" width="64" height="64" loading="lazy">
            </button>
          </li>
        </ul>
      </div>

      <!-- Achat -->
      <div>
        <p data-r class="mb-3 text-xs font-bold tracking-[0.22em] text-secondary uppercase">Produit du moment</p>
        <h2 id="vedette-titre" data-r style="--i: 1" class="text-h2 leading-tight font-bold text-balance text-tertiary-50 lg:text-h2-lg">
          {{ product.name }}
        </h2>
        <p data-r style="--i: 2" class="mt-3 max-w-md text-pretty text-[15px] leading-relaxed text-tertiary-700">
          {{ product.excerpt }}
        </p>

        <div data-r style="--i: 3" class="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="text-h1 font-bold text-tertiary-50 tabular-nums">{{ money(product.price) }}</span>
          <span v-if="discount" class="text-lg text-tertiary-800 tabular-nums line-through">{{ money(product.regularPrice!) }}</span>
          <span v-if="discount" class="rounded bg-secondary px-2 py-0.5 text-[12px] font-bold text-on-accent">−{{ discount }} %</span>
        </div>

        <div data-r style="--i: 4">
          <QuantityOffers
            v-if="product.inStock && product.offers.length"
            v-model="quantity"
            :unit-price="product.price"
            :offers="product.offers"
            :image="product.images[0]?.src"
            :name="product.name"
          />

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" class="btn-primary" :disabled="!product.inStock" @click="buy">
              <template v-if="product.inStock">Ajouter au panier · {{ money(line.total) }}</template>
              <template v-else>Rupture de stock</template>
            </button>
            <NuxtLink :to="to" class="btn-secondary">Voir la fiche</NuxtLink>
          </div>

          <p class="mt-4 flex items-center gap-2 text-[12px] text-tertiary-700">
            <span class="size-1.5 rounded-full" :class="product.inStock ? 'bg-green-500' : 'bg-secondary'" aria-hidden="true" />
            {{ product.inStock ? 'En stock · livraison partout au Canada' : 'Momentanément indisponible' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
