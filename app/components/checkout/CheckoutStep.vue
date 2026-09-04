<script setup lang="ts">
/**
 * Étape repliable du tunnel de commande.
 *
 * Le contenu est masqué par `v-show`, jamais détruit : les champs de carte
 * Stripe vivent dans une iframe qu'un démontage réinitialiserait, et une
 * saisie en cours serait perdue à chaque repli.
 */
defineProps<{
  step: number
  title: string
  /** Résumé de ce qui a été saisi, montré une fois l'étape repliée. */
  summary?: string
  complete?: boolean
  open: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <section class="rounded-2xl bg-primary">
    <h2>
      <button
        type="button"
        class="flex w-full items-center gap-3 p-5 text-left md:p-6"
        :aria-expanded="open"
        :aria-controls="`step-${step}-panel`"
        @click="emit('toggle')"
      >
        <!-- La pastille passe au crochet dès que l'étape est complète. -->
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors"
          :class="complete ? 'bg-green-600 text-on-accent' : 'bg-secondary text-on-accent'"
          aria-hidden="true"
        >
          <svg v-if="complete" width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path d="m5 10.5 3.2 3.2L15 6.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <template v-else>{{ step }}</template>
        </span>

        <span class="min-w-0 flex-1">
          <span class="block text-h4 font-bold text-tertiary-50">{{ title }}</span>
          <span v-if="!open && summary" class="mt-1 block truncate text-[13px] text-tertiary-800">
            {{ summary }}
          </span>
        </span>

        <span class="shrink-0 text-[13px] font-medium text-tertiary-800">
          {{ open ? '' : 'Modifier' }}
        </span>

        <svg
          class="shrink-0 text-tertiary-800 transition-transform"
          :class="open ? 'rotate-180' : ''"
          width="12" height="8" viewBox="0 0 10 6" fill="none" aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </h2>

    <div v-show="open" :id="`step-${step}-panel`" class="px-5 pb-5 md:px-6 md:pb-6">
      <slot />
    </div>
  </section>
</template>
