<script setup lang="ts">
/**
 * Liste déroulante du tunnel, calquée sur `CheckoutField` : même gabarit de
 * libellé, même traitement de l'erreur. Ville, quartier et province partagent
 * ainsi une seule mise en forme.
 */
defineProps<{
  label: string
  name: string
  /** Valeur → intitulé. Une chaîne seule sert des deux. */
  options: readonly (string | { value: string, label: string })[]
  placeholder?: string
  error?: string
  autocomplete?: string
  hint?: string
}>()

const model = defineModel<string>({ required: true })

function valueOf(option: string | { value: string, label: string }) {
  return typeof option === 'string' ? option : option.value
}
function labelOf(option: string | { value: string, label: string }) {
  return typeof option === 'string' ? option : option.label
}

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div>
    <label :for="name" class="mb-1.5 block text-[13px] font-medium text-tertiary-600">{{ label }}</label>

    <select
      :id="name"
      v-model="model"
      v-bind="$attrs"
      :name="name"
      :autocomplete="autocomplete"
      class="field appearance-none"
      :class="error ? 'field-invalid' : ''"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${name}-error` : undefined"
    >
      <option value="" disabled>{{ placeholder ?? 'Choisir…' }}</option>
      <option v-for="option in options" :key="valueOf(option)" :value="valueOf(option)">
        {{ labelOf(option) }}
      </option>
    </select>

    <p v-if="error" :id="`${name}-error`" class="mt-1.5 text-[11px] text-secondary">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-[11px] text-tertiary-800">{{ hint }}</p>
  </div>
</template>
