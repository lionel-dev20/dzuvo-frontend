<script setup lang="ts">
/**
 * Étoiles de notation, en lecture seule.
 *
 * Toujours cinq étoiles, même pour un produit sans avis : celles qui sont
 * acquises sont pleines (jaune doré), les autres sont de simples contours
 * dorés. Un produit pas encore noté montre donc cinq contours — le visiteur voit
 * tout de suite où se donne la note, et les fiches restent alignées entre elles.
 *
 * La valeur est annoncée par `label`, pas par les dessins.
 */
const props = withDefaults(defineProps<{ value: number, size?: number, label?: string }>(), { size: 16 })

const text = computed(() =>
  props.label ?? (props.value > 0 ? `${props.value.toFixed(1).replace('.', ',')} sur 5` : 'Pas encore noté'),
)
</script>

<template>
  <span class="inline-flex" role="img" :aria-label="text">
    <svg
      v-for="star in 5"
      :key="star"
      :width="size"
      :height="size"
      viewBox="0 0 20 20"
      aria-hidden="true"
      stroke-width="1.4"
      stroke-linejoin="round"
      class="stroke-star"
      :class="star <= Math.round(value) ? 'fill-star' : 'fill-transparent'"
    >
      <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
    </svg>
  </span>
</template>
