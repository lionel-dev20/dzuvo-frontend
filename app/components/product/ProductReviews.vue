<script setup lang="ts">
import type { ReviewsResult } from '#shared/types/reviews'
import { REVIEW_COMMENT_MAX } from '#shared/types/reviews'
import { formatDate } from '#shared/utils/format'

/**
 * Avis clients : la note d'ensemble, la liste, puis le formulaire pour en
 * laisser un. Les avis sont modérés dans WooCommerce (Produits > Avis) : celui
 * qu'on dépose ici paraît après validation, et le formulaire le dit.
 */
const props = defineProps<{
  productId: number
  reviews: ReviewsResult | null
  /** Note et nombre d'avis tels que WooCommerce les annonce sur la fiche. */
  fallbackRating: number
  fallbackCount: number
}>()

const PAGE = 5
const shown = ref(PAGE)
const formOpen = ref(false)

const items = computed(() => props.reviews?.items ?? [])
const hasList = computed(() => items.value.length > 0)

/* La note vient de la liste quand on l'a ; sinon de ce que WooCommerce annonce. */
const average = computed(() => (hasList.value ? props.reviews!.average : props.fallbackRating))
const total = computed(() => (hasList.value ? props.reviews!.total : props.fallbackCount))

const distribution = computed(() =>
  ([5, 4, 3, 2, 1] as const).map((stars) => {
    const count = props.reviews?.distribution[stars] ?? 0
    return { stars, count, share: items.value.length ? (count / items.value.length) * 100 : 0 }
  }),
)

const { form, errors, status, feedback, submit, reset } = useReviewForm(() => props.productId)

const uid = useId()

function openForm() {
  formOpen.value = true
  if (status.value === 'success') reset()
}
</script>

<template>
  <section id="avis" class="scroll-mt-header rounded-2xl bg-primary p-5 sm:p-8" aria-labelledby="avis-titre">
    <h2 id="avis-titre" class="text-h3 font-bold text-tertiary-50">Avis clients</h2>

    <div class="mt-6 grid gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <!-- Note d'ensemble -->
      <div>
        <div class="flex items-center gap-4">
          <p v-if="total" class="text-h1 leading-none font-bold text-tertiary-50">{{ average.toFixed(1).replace('.', ',') }}</p>
          <div>
            <StarRating :value="total ? average : 0" :size="20" />
            <p class="mt-1 text-[13px] text-tertiary-800">
              {{ total ? `${total} avis` : 'Aucun avis pour le moment. Soyez le premier à donner le vôtre.' }}
            </p>
          </div>
        </div>

        <ul v-if="hasList" class="mt-5 grid gap-2">
          <li v-for="row in distribution" :key="row.stars" class="flex items-center gap-3 text-[13px] text-tertiary-800">
            <span class="w-9 shrink-0 tabular-nums">{{ row.stars }} ★</span>
            <span class="h-2 flex-1 overflow-hidden rounded-full bg-tertiary-500/10">
              <span class="block h-full rounded-full bg-secondary" :style="{ width: `${row.share}%` }" />
            </span>
            <span class="w-6 shrink-0 text-right tabular-nums">{{ row.count }}</span>
          </li>
        </ul>

        <button v-if="!formOpen || status === 'success'" type="button" class="btn-primary mt-6 w-full justify-center" @click="openForm">
          Donner mon avis
        </button>
      </div>

      <div>
        <!-- Formulaire -->
        <form
          v-if="formOpen && status !== 'success'"
          class="mb-8 rounded-2xl bg-primary-darker p-6"
          novalidate
          @submit.prevent="submit"
        >
          <h3 class="text-h4 font-bold text-tertiary-50">Votre avis</h3>

          <!-- Champ piège : invisible pour un humain, un robot le remplit. -->
          <input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

          <fieldset class="mt-4">
            <legend class="mb-2 text-body font-medium text-tertiary-500">Votre note</legend>
            <div class="flex gap-1">
              <label v-for="star in 5" :key="star" class="cursor-pointer p-0.5">
                <input v-model="form.rating" type="radio" :name="`note-${uid}`" :value="star" class="peer sr-only">
                <svg
                  width="30" height="30" viewBox="0 0 20 20"
                  class="transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-secondary"
                  stroke-width="1.4" stroke-linejoin="round"
                  :class="star <= form.rating ? 'fill-star stroke-star' : 'fill-transparent stroke-star hover:fill-star/30'"
                  aria-hidden="true"
                >
                  <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
                </svg>
                <span class="sr-only">{{ star }} sur 5</span>
              </label>
            </div>
            <p v-if="errors.rating" class="mt-1 text-[13px] text-secondary" role="alert">{{ errors.rating }}</p>
          </fieldset>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label :for="`${uid}-name`" class="mb-1.5 block text-body font-medium text-tertiary-500">Prénom</label>
              <input :id="`${uid}-name`" v-model="form.name" type="text" autocomplete="given-name" maxlength="60" class="field" :class="errors.name && 'field-invalid'">
              <p v-if="errors.name" class="mt-1 text-[13px] text-secondary" role="alert">{{ errors.name }}</p>
            </div>
            <div>
              <label :for="`${uid}-email`" class="mb-1.5 block text-body font-medium text-tertiary-500">Courriel</label>
              <input :id="`${uid}-email`" v-model="form.email" type="email" autocomplete="email" class="field" :class="errors.email && 'field-invalid'">
              <p v-if="errors.email" class="mt-1 text-[13px] text-secondary" role="alert">{{ errors.email }}</p>
              <p v-else class="mt-1 text-[12px] text-tertiary-800">Jamais publié.</p>
            </div>
          </div>

          <div class="mt-4">
            <label :for="`${uid}-comment`" class="mb-1.5 block text-body font-medium text-tertiary-500">Votre commentaire</label>
            <textarea
              :id="`${uid}-comment`"
              v-model="form.comment"
              rows="5"
              :maxlength="REVIEW_COMMENT_MAX"
              class="field resize-y"
              :class="errors.comment && 'field-invalid'"
            />
            <p v-if="errors.comment" class="mt-1 text-[13px] text-secondary" role="alert">{{ errors.comment }}</p>
          </div>

          <p v-if="status === 'error'" class="mt-4 text-[13px] text-secondary" role="alert">{{ feedback }}</p>

          <div class="mt-5 flex flex-wrap gap-3">
            <button type="submit" class="btn-primary" :disabled="status === 'pending'">
              {{ status === 'pending' ? 'Envoi…' : 'Publier mon avis' }}
            </button>
            <button type="button" class="btn-secondary" @click="formOpen = false">Annuler</button>
          </div>
        </form>

        <p
          v-if="status === 'success'"
          class="mb-8 rounded-2xl border border-secondary/40 bg-primary-darker p-5 text-body text-tertiary-50"
          role="status"
        >
          {{ feedback }}
        </p>

        <!-- Liste -->
        <ul v-if="hasList" class="divide-y divide-tertiary-500/10">
          <li v-for="review in items.slice(0, shown)" :key="review.id" class="py-5 first:pt-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StarRating :value="review.rating" :size="15" />
              <span class="font-bold text-tertiary-50">{{ review.author }}</span>
              <span v-if="review.verified" class="rounded-full border border-tertiary-500/20 px-2 py-0.5 text-[11px] text-tertiary-600">
                Achat vérifié
              </span>
              <time v-if="review.date" :datetime="review.date" class="text-[12px] text-tertiary-800">
                {{ formatDate(review.date) }}
              </time>
            </div>
            <p class="mt-2 text-pretty whitespace-pre-line text-tertiary-600">{{ review.content }}</p>
          </li>
        </ul>

        <button
          v-if="items.length > shown"
          type="button"
          class="btn-secondary mt-4"
          @click="shown += PAGE"
        >
          Voir plus d’avis ({{ items.length - shown }})
        </button>
      </div>
    </div>
  </section>
</template>
