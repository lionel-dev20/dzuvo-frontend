<script setup lang="ts">
import type { FieldErrors, RegisterPayload } from '#shared/types/forms'
import { PASSWORD_MIN, hasErrors, validateRegister } from '#shared/utils/validation'

/** Création de compte client. */
const form = reactive<RegisterPayload>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  terms: false,
  newsletter: false,
  honeypot: '',
})

const errors = ref<FieldErrors<RegisterPayload>>({})
const status = ref<'idle' | 'pending' | 'error'>('idle')
const feedback = ref('')
const showPassword = ref(false)

/** Indicateur de robustesse : indicatif, il ne bloque jamais l'envoi. */
const strength = computed(() => {
  const value = form.password
  if (!value) return { score: 0, label: '' }

  let score = 0
  if (value.length >= PASSWORD_MIN) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^\w\s]/.test(value)) score++

  const labels = ['Trop court', 'Faible', 'Correct', 'Bon', 'Solide', 'Solide']
  return { score, label: labels[score] ?? '' }
})

async function submit() {
  errors.value = validateRegister(form)
  if (hasErrors(errors.value)) return

  status.value = 'pending'
  feedback.value = ''

  try {
    await $fetch('/api/auth/register', { method: 'POST', body: form })
    await navigateTo('/compte')
  }
  catch (error: any) {
    status.value = 'error'
    errors.value = error?.data?.data?.errors ?? {}
    feedback.value = error?.data?.message ?? 'La création du compte a échoué. Merci de réessayer.'
  }
}

const label = 'mb-2 block text-body font-medium text-tertiary-600'
const errorText = 'mt-1.5 text-xs text-secondary'

useSeo({
  title: 'Créer un compte',
  description: 'Ouvrez votre compte DZUVO : suivi de commandes, garanties et offres réservées.',
})
</script>

<template>
  <div class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink to="/connexion" class="hover:text-secondary">Connexion</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">Créer un compte</li>
      </ol>
    </nav>

    <header class="mb-10 max-w-2xl">
      <h1 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
        <span class="text-tertiary-700">Créer mon compte</span><br>
        <span class="text-tertiary-50">en quelques secondes</span>
      </h1>
    </header>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
      <section class="rounded-2xl bg-primary p-6 md:p-8" aria-labelledby="titre-formulaire">
        <h2 id="titre-formulaire" class="sr-only">Formulaire de création de compte</h2>

        <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
          <input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label :class="label" for="reg-firstname">Prénom</label>
              <input
                id="reg-firstname"
                v-model="form.firstName"
                type="text"
                autocomplete="given-name"
                class="field"
                :class="errors.firstName && 'field-invalid'"
                :aria-invalid="errors.firstName ? 'true' : undefined"
              >
              <p v-if="errors.firstName" :class="errorText" role="alert">{{ errors.firstName }}</p>
            </div>

            <div>
              <label :class="label" for="reg-lastname">Nom</label>
              <input
                id="reg-lastname"
                v-model="form.lastName"
                type="text"
                autocomplete="family-name"
                class="field"
                :class="errors.lastName && 'field-invalid'"
                :aria-invalid="errors.lastName ? 'true' : undefined"
              >
              <p v-if="errors.lastName" :class="errorText" role="alert">{{ errors.lastName }}</p>
            </div>
          </div>

          <div>
            <label :class="label" for="reg-email">Courriel</label>
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="field"
              :class="errors.email && 'field-invalid'"
              :aria-invalid="errors.email ? 'true' : undefined"
            >
            <p v-if="errors.email" :class="errorText" role="alert">{{ errors.email }}</p>
          </div>

          <div>
            <label :class="label" for="reg-password">Mot de passe</label>
            <div class="relative">
              <input
                id="reg-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="field pr-12"
                :class="errors.password && 'field-invalid'"
                :aria-invalid="errors.password ? 'true' : undefined"
                aria-describedby="reg-password-aide"
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

            <!-- Jauge indicative, doublée d'un texte : la couleur seule ne suffit pas. -->
            <div v-if="form.password" class="mt-2 flex items-center gap-3">
              <div class="flex flex-1 gap-1" aria-hidden="true">
                <span
                  v-for="step in 5"
                  :key="step"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="step <= strength.score ? 'bg-secondary' : 'bg-tertiary-500/15'"
                />
              </div>
              <span class="text-xs text-tertiary-800">{{ strength.label }}</span>
            </div>

            <p id="reg-password-aide" class="mt-1.5 text-xs text-tertiary-800">
              {{ PASSWORD_MIN }} caractères minimum.
            </p>
            <p v-if="errors.password" :class="errorText" role="alert">{{ errors.password }}</p>
          </div>

          <div>
            <label :class="label" for="reg-password-confirm">Confirmer le mot de passe</label>
            <input
              id="reg-password-confirm"
              v-model="form.passwordConfirm"
              type="password"
              autocomplete="new-password"
              class="field"
              :class="errors.passwordConfirm && 'field-invalid'"
              :aria-invalid="errors.passwordConfirm ? 'true' : undefined"
            >
            <p v-if="errors.passwordConfirm" :class="errorText" role="alert">{{ errors.passwordConfirm }}</p>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <label class="flex cursor-pointer items-start gap-2.5 text-xs text-tertiary-800">
              <input v-model="form.terms" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-secondary">
              <span>
                J’accepte les
                <NuxtLink to="/legal/conditions-generales" class="text-secondary hover:underline">conditions générales de vente</NuxtLink>
                et la
                <NuxtLink to="/legal/politique-de-confidentialite" class="text-secondary hover:underline">politique de confidentialité</NuxtLink>.
              </span>
            </label>
            <p v-if="errors.terms" :class="errorText" role="alert">{{ errors.terms }}</p>

            <label class="flex cursor-pointer items-start gap-2.5 text-xs text-tertiary-800">
              <input v-model="form.newsletter" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-secondary">
              <span>Je souhaite recevoir les nouveautés et offres DZUVO. (facultatif)</span>
            </label>
          </div>

          <button type="submit" class="btn-primary mt-2 justify-center" :disabled="status === 'pending'">
            {{ status === 'pending' ? 'Création…' : 'Créer mon compte' }}
            <svg v-if="status !== 'pending'" width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <p v-if="feedback" class="text-body text-secondary" role="alert">{{ feedback }}</p>

          <p class="text-center text-body text-tertiary-800">
            Vous avez déjà un compte ?
            <NuxtLink to="/connexion" class="text-secondary hover:underline">Se connecter</NuxtLink>
          </p>
        </form>
      </section>

      <aside class="rounded-2xl bg-primary p-6 md:p-8">
        <h2 class="text-h4 font-bold text-tertiary-50 uppercase">Vos avantages</h2>
        <ul class="mt-6 flex flex-col gap-4">
          <li v-for="item in [
            'Suivi de commande et de livraison',
            'Factures et garanties centralisées',
            'Vos véhicules enregistrés, des pièces compatibles',
            'Offres réservées aux titulaires d’un compte',
          ]" :key="item" class="flex items-start gap-3">
            <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="text-body text-tertiary-600">{{ item }}</span>
          </li>
        </ul>

        <p class="mt-8 border-t border-tertiary-500/10 pt-5 text-xs text-tertiary-800">
          Vos données servent uniquement à traiter vos commandes et ne sont jamais revendues.
        </p>
      </aside>
    </div>
  </div>
</template>
