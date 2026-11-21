<script setup lang="ts">
/** Étoiles en lecture seule. La valeur est annoncée par `label`, pas par les dessins. */
withDefaults(defineProps<{ value: number, size?: number, label?: string }>(), { size: 16 })
</script>

<template>
  <span class="inline-flex" role="img" :aria-label="label ?? `${value.toFixed(1).replace('.', ',')} sur 5`">
    <svg
      v-for="star in 5"
      :key="star"
      :width="size"
      :height="size"
      viewBox="0 0 20 20"
      aria-hidden="true"
      :class="star <= Math.round(value) ? 'fill-secondary' : 'fill-tertiary-500/20'"
    >
      <path d="m10 1.6 2.5 5.4 5.9.7-4.4 4 1.2 5.8-5.2-3-5.2 3 1.2-5.8-4.4-4 5.9-.7z" />
    </svg>
  </span>
</template>
