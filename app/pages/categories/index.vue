<script setup lang="ts">
import type { CatalogCategory } from '#shared/types/catalog'

/**
 * Vue d'ensemble du catalogue : toutes les rubriques et leurs sous-rubriques
 * sur une seule page, pour atteindre n'importe quel rayon en un clic.
 */
const { data: categories } = await useFetch<CatalogCategory[]>('/api/catalog/categories')

const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 32 })

const totalProducts = computed(() =>
  (categories.value ?? []).reduce((sum, c) => sum + c.count, 0),
)

useSeo({
  title: 'Toutes nos catégories',
  description: 'Pièces auto et accessoires DZUVO : intérieur, extérieur, électronique, entretien, filtres et équipement de sécurité.',
})
</script>

<template>
  <div ref="root" class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <!-- Fil d'Ariane -->
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">Catalogue</li>
      </ol>
    </nav>

    <header class="mb-12 max-w-2xl">
      <h1 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
        <span class="text-tertiary-700">Tout le catalogue</span><br>
        <span class="text-tertiary-50">en un coup d’œil</span>
      </h1>
      <p class="mt-4 text-pretty text-tertiary-800">
        {{ totalProducts }} références compatibles toutes marques, réparties en
        {{ categories?.length ?? 0 }} rubriques. Livraison programmée partout au Canada.
      </p>
    </header>

    <!-- Chaque rubrique déroule ses sous-rubriques : rien n'est masqué. -->
    <div data-reveal-group class="flex flex-col gap-14">
      <section v-for="category in categories" :key="category.slug" data-reveal :aria-labelledby="`cat-${category.slug}`">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 :id="`cat-${category.slug}`" class="text-h3 font-bold text-tertiary-50">
              {{ category.name }}
            </h2>
            <p v-if="category.description" class="mt-2 max-w-xl text-body text-tertiary-800">
              {{ category.description }}
            </p>
          </div>

          <NuxtLink
            :to="`/categories/${category.slug}`"
            class="shrink-0 text-body font-medium text-secondary hover:text-secondary-hover"
          >
            Voir la rubrique →
          </NuxtLink>
        </div>

        <ul class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <li v-for="child in category.children" :key="child.slug">
            <CategoryTile :category="child" compact />
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
