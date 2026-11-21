<script setup lang="ts">
import { winterRoutine } from '~/config/homeShowcase'

/**
 * Quatre produits, un seul récit : une routine plutôt qu’un rayon.
 *
 * Les cartes sont numérotées et reliées par un fil — on lit une routine, pas un
 * rayon. Chaque carte répond à une question que le visiteur se pose déjà
 * (« démarrer ? voir ? protéger ? rouler ? »), puis lui laisse l’achat à un clic.
 */
const root = useTemplateRef<HTMLElement>('root')
useReveal(root)

const { quickAdd, pending } = useQuickAdd()
const broken = reactive(new Set<string>())
</script>

<template>
  <section id="favoris" ref="root" class="scroll-mt-header px-2.5 md:px-5 lg:px-24" aria-labelledby="routine-titre">
    <div class="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 md:mb-14">
      <div class="max-w-2xl">
        <p data-r class="mb-3 text-xs font-bold tracking-[0.22em] text-secondary uppercase">Les favoris du moment</p>
        <h2 id="routine-titre" data-r style="--i: 1" class="text-h2 leading-tight font-bold text-balance text-tertiary-50 lg:text-h2-lg">
          Quatre accessoires qui vont bien ensemble
        </h2>
      </div>
      <NuxtLink data-r style="--i: 2" to="/categories" class="text-sm font-bold text-secondary hover:underline">
        Tout le catalogue →
      </NuxtLink>
    </div>

    <ol class="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <li v-for="(item, index) in winterRoutine" :key="item.id" data-r :style="{ '--i': index }" class="flex">
        <article class="group flex w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-panel">
          <NuxtLink
            :to="item.product?.to ?? item.category!.to"
            class="relative block aspect-square overflow-hidden bg-primary-dark/60"
            :aria-label="item.product?.name ?? item.category!.name"
          >
            <span class="absolute top-3 left-3 z-10 rounded-full bg-tertiary-50 px-3 py-1 text-[12px] font-bold text-primary">
              {{ item.step }}
            </span>
            <img
              v-if="!broken.has(item.id)"
              :src="item.product?.image ?? item.category!.image"
              :alt="item.product?.name ?? item.category!.name"
              class="size-full object-contain p-8 transition-transform duration-500 group-hover:scale-105"
              width="360"
              height="360"
              loading="lazy"
              @error="broken.add(item.id)"
            >
          </NuxtLink>

          <div class="flex flex-1 flex-col p-5">
            <h3 class="text-h4 leading-snug font-bold text-tertiary-50">{{ item.title }}</h3>
            <p class="mt-2 text-[13px] leading-relaxed text-tertiary-700">{{ item.pitch }}</p>

            <div class="mt-auto pt-5">
              <template v-if="item.product">
                <p class="mb-3 flex items-baseline gap-2 tabular-nums">
                  <span class="text-h3 font-bold text-tertiary-50">{{ item.product.price }}</span>
                  <span v-if="item.product.oldPrice" class="text-[13px] text-tertiary-800 line-through">{{ item.product.oldPrice }}</span>
                </p>
                <button
                  type="button"
                  class="btn-primary w-full justify-center"
                  :disabled="pending === item.product.slug"
                  @click="quickAdd(item.product.slug, item.product.to)"
                >
                  Ajouter au panier
                </button>
              </template>
              <template v-else>
                <p class="mb-3 text-[13px] font-medium text-tertiary-50">{{ item.category!.note }}</p>
                <NuxtLink :to="item.category!.to" class="btn-primary w-full justify-center">Voir les batteries</NuxtLink>
              </template>
            </div>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>
