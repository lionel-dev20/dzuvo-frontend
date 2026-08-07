<script setup lang="ts">
import type { FieldErrors, LoginPayload } from '#shared/types/forms'
import { hasErrors, validateLogin } from '#shared/utils/validation'

/**
 * Connexion client. Deux entrées côte à côte : le client existant se connecte,
 * le nouveau venu va vers la création de compte plutôt que de chercher.
 */
const form = reactive<LoginPayload>({ email: '', password: '', remember: true, honeypot: '' })
const errors = ref<FieldErrors<LoginPayload>>({})
const status = ref<'idle' | 'pending' | 'error'>('idle')
const feedback = ref('')
const showPassword = ref(false)

async function submit() {
  errors.value = validateLogin(form)
  if (hasErrors(errors.value)) return

  status.value = 'pending'
  feedback.value = ''

  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form })
    await navigateTo('/compte')
  }
  catch (error: any) {
    status.value = 'error'
    // Les erreurs par champ priment ; sinon message global.
    errors.value = error?.data?.data?.errors ?? {}
    feedback.value = error?.data?.message ?? 'La connexion a échoué. Merci de réessayer.'
  }
}

const advantages = [
  'Suivre vos commandes et vos livraisons en temps réel',
  'Retrouver vos factures et vos garanties',
  'Enregistrer vos véhicules pour des pièces compatibles',
  'Accéder à vos offres réservées',
]

useSeo({
  title: 'Connexion',
  description: 'Accédez à votre compte DZUVO pour suivre vos commandes et retrouver vos garanties.',
})
</script>

<template>
  <div class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">Connexion</li>
      </ol>
    </nav>

    <header class="mb-10 max-w-2xl">
      <h1 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
        <span class="text-tertiary-700">Votre compte</span><br>
        <span class="text-tertiary-50">DZUVO</span>
      </h1>
    </header>

    <div class="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <!-- Connexion -->
      <section class="rounded-2xl bg-primary p-6 md:p-8" aria-labelledby="titre-connexion">
        <h2 id="titre-connexion" class="text-h3 font-bold text-tertiary-50">J’ai déjà un compte</h2>
        <p class="mt-2 text-body text-tertiary-800">Connectez-vous avec votre courriel.</p>

        <form class="mt-7 flex flex-col gap-5" novalidate @submit.prevent="submit">
          <!-- Piège à robots : hors du parcours clavier et invisible. -->
          <input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="login-email">Courriel</label>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="field"
              :class="errors.email && 'field-invalid'"
              :aria-invalid="errors.email ? 'true' : undefined"
              aria-describedby="login-email-error"
            >
            <p v-if="errors.email" id="login-email-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <div class="mb-2 flex items-baseline justify-between gap-3">
              <label class="text-body font-medium text-tertiary-600" for="login-password">Mot de passe</label>
              <NuxtLink to="/mot-de-passe-oublie" class="text-xs text-secondary hover:text-secondary-hover">
                Mot de passe oublié ?
              </NuxtLink>
            </div>

            <div class="relative">
              <input
                id="login-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="field pr-12"
                :class="errors.password && 'field-invalid'"
                :aria-invalid="errors.password ? 'true' : undefined"
                aria-describedby="login-password-error"
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-tertiary-800 hover:text-tertiary-500"
                :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z" stroke="currentColor" stroke-width="1.6" />
                  <circle cx="10" cy="10" r="2.8" stroke="currentColor" stroke-width="1.6" />
                </svg>
                <svg v-else width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M1.8 10S4.8 4.5 10 4.5c1.5 0 2.8.4 3.9 1M18.2 10s-3 5.5-8.2 5.5c-1.5 0-2.8-.4-3.9-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <path d="m3 3 14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" id="login-password-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.password }}
            </p>
          </div>

          <label class="flex cursor-pointer items-center gap-2.5 text-body text-tertiary-800">
            <input v-model="form.remember" type="checkbox" class="size-4 shrink-0 accent-secondary">
            <span>Rester connecté</span>
          </label>

          <button type="submit" class="btn-primary justify-center" :disabled="status === 'pending'">
            {{ status === 'pending' ? 'Connexion…' : 'Se connecter' }}
            <svg v-if="status !== 'pending'" width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <p v-if="feedback" class="text-body text-secondary" role="alert">{{ feedback }}</p>
        </form>
      </section>

      <!-- Création de compte -->
      <section class="flex flex-col rounded-2xl bg-primary p-6 md:p-8" aria-labelledby="titre-inscription">
        <h2 id="titre-inscription" class="text-h3 font-bold text-tertiary-50">Je crée mon compte</h2>
        <p class="mt-2 text-body text-tertiary-800">
          Quelques secondes suffisent, et vos prochaines commandes vont plus vite.
        </p>

        <ul class="mt-7 flex flex-col gap-4">
          <li v-for="item in advantages" :key="item" class="flex items-start gap-3">
            <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="text-body text-tertiary-600">{{ item }}</span>
          </li>
        </ul>

        <NuxtLink to="/inscription" class="btn-secondary mt-auto justify-center pt-3">
          Créer mon compte
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
            <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>
