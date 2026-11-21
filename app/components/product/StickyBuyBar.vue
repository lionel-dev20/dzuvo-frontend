<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'

/**
 * Barre d'achat collée en bas de l'écran, sur mobile seulement.
 *
 * Elle apparaît quand le bouton d'achat de la fiche est sorti de l'écran : sur
 * une page longue (galerie, offres, avis), le client n'a plus à remonter pour
 * commander. Elle ne se montre que si l'article est commandable.
 */
const props = defineProps<{
  /** Élément à surveiller : le bloc d'achat de la fiche. */
  target: HTMLElement | null
  name: string
  total: number
  label: string
}>()

const emit = defineEmits<{ buy: [] }>()

const visible = ref(false)

onMounted(() => {
  watch(() => props.target, (element, _old, onCleanup) => {
    if (!element || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Visible seulement une fois le bloc passé *au-dessus* de l'écran : s'il
        // est encore en dessous (page en haut), la barre n'a rien à raccourcir.
        visible.value = !entry!.isIntersecting && entry!.boundingClientRect.top < 0
      },
      { threshold: 0 },
    )

    observer.observe(element)
    onCleanup(() => observer.disconnect())
  }, { immediate: true })
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200"
    leave-active-class="transition duration-150"
    enter-from-class="translate-y-full"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-tertiary-500/15 bg-primary-darker px-4 py-3 shadow-[0_-6px_20px_rgb(0_0_0/0.18)] lg:hidden"
    >
      <div class="flex items-center gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] text-tertiary-600">{{ name }}</p>
          <p class="font-bold text-tertiary-50 tabular-nums">{{ formatPrice(total) }}</p>
        </div>
        <button type="button" class="btn-primary shrink-0 justify-center" @click="emit('buy')">{{ label }}</button>
      </div>
    </div>
  </Transition>
</template>
