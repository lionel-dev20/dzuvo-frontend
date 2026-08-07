<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

useSeo({ title: isNotFound.value ? 'Page introuvable' : 'Erreur', noindex: true })
</script>

<template>
  <NuxtLayout>
    <section class="error">
      <div class="container">
        <p class="error__code">{{ error.statusCode }}</p>
        <h1>{{ isNotFound ? 'Page introuvable' : 'Une erreur est survenue' }}</h1>
        <div class="error__actions">
          <AppButton @click="clearError({ redirect: '/' })">Retour à l'accueil</AppButton>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.error {
  display: grid;
  place-items: center;
  min-height: 60vh;
  padding-block: var(--space-24);
  text-align: center;
}

.error__code {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--color-brand-500);
}

.error h1 { margin-block: var(--space-4); }
.error__actions { margin-top: var(--space-8); }
</style>
