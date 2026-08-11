<script setup lang="ts">
/** Champ de formulaire du tunnel : libellé, saisie, erreur. Même gabarit partout. */
withDefaults(
  defineProps<{
    label: string
    name: string
    type?: string
    autocomplete?: string
    placeholder?: string
    error?: string
    optional?: boolean
    inputmode?: 'text' | 'tel' | 'email' | 'numeric'
  }>(),
  { type: 'text' },
)

const model = defineModel<string>({ required: true })

// Les attributs et écouteurs posés sur le composant visent la saisie, pas le
// bloc : sans cela, un `@blur` s'attacherait au <div> et ne se déclencherait
// jamais — `blur` ne remonte pas.
defineOptions({ inheritAttrs: false })
</script>

<template>
  <div>
    <label :for="name" class="mb-1.5 block text-[13px] font-medium text-tertiary-600">
      {{ label }}
      <span v-if="optional" class="text-tertiary-800">(facultatif)</span>
    </label>

    <input
      :id="name"
      v-model="model"
      v-bind="$attrs"
      :name="name"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :inputmode="inputmode"
      class="field"
      :class="error ? 'field-invalid' : ''"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${name}-error` : undefined"
    >

    <p v-if="error" :id="`${name}-error`" class="mt-1.5 text-[11px] text-secondary">{{ error }}</p>
  </div>
</template>
