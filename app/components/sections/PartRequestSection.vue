<script setup lang="ts">
/**
 * Recherche de pièce : le visiteur décrit ce qu'il cherche plutôt que de
 * naviguer dans le catalogue. Repose sur le formulaire de contact existant —
 * validation partagée client/serveur, honeypot et limitation de débit compris.
 */
const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 40 })

const { form, errors, status, feedback, submit } = useContactForm()

// Le sujet n'est pas saisi ici : il qualifie la demande à la réception.
form.subject = 'Recherche de pièce ou d’accessoire'

const field = 'w-full rounded-md border border-transparent bg-tertiary-500/6 px-4 py-3 text-tertiary-50 outline-none transition-colors placeholder:text-tertiary-800 focus:border-secondary'
const fieldError = 'border-secondary'
const label = 'mb-2 block text-body font-medium text-tertiary-600'
const errorText = 'mt-1.5 text-xs text-secondary'

/*
 * Titres, texte et raccourcis réglés dans « Page d'accueil > Titres et
 * textes ». Les deux pictogrammes, eux, restent attachés à leur place :
 * chacun illustre un propos précis, et il n'y a que deux encarts.
 */
const { text } = useHomeContent()

const title = text('partRequestTitle', 'Trouver ma pièce ou mon accessoire')
const intro = text(
  'partRequestIntro',
  'Vous êtes dans le besoin d’une pièce auto bien précise ? Nous la trouverons pour vous. Remplissez le formulaire pour une réponse dans les meilleurs délais.',
)

const shortcuts = computed(() => [
  {
    id: 'conseiller',
    to: text('partRequestShortcut1To', '/contact').value,
    title: text('partRequestShortcut1Title', 'Parler à un conseiller').value,
    note: text('partRequestShortcut1Note', 'du lundi au samedi').value,
  },
  {
    id: 'suivi',
    to: text('partRequestShortcut2To', '/compte').value,
    title: text('partRequestShortcut2Title', 'Suivre ma commande').value,
    note: text('partRequestShortcut2Note', 'livraison programmée').value,
  },
])
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="Rechercher une pièce">
    <div data-reveal-group class="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
      <!-- Bloc formulaire -->
      <div data-reveal class="rounded-lg bg-primary bg-opacity-2 border border-gray-900 p-6 md:p-8">
        <h2 class="text-h3">{{ title }}</h2>

        <form class="mt-7 grid gap-5 md:grid-cols-2" novalidate @submit.prevent="submit">
          <!-- Colonne 1 — la description de la pièce recherchée -->
          <div>
            <label class="text-left pb-3" :class="label" for="part-message">
              {{ intro }}
            </label>
            <textarea
              id="part-message"
              v-model="form.message"
              rows="7"
              placeholder="Marque, modèle, année, version, numéro de référence si vous l’avez…"
              :class="[field, errors.message && fieldError, 'resize-y']"
              :aria-invalid="errors.message ? 'true' : undefined"
              aria-describedby="part-message-error"
            />
            <p v-if="errors.message" id="part-message-error" class="text-xs text-secondary" role="alert">
              {{ errors.message }}
            </p>
          </div>

          <!-- Colonne 2 — coordonnées, puis envoi -->
          <div class="flex flex-col gap-5">
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label :class="label" for="part-lastname">Nom</label>
                <input
                  id="part-lastname"
                  v-model="form.lastName"
                  type="text"
                  autocomplete="family-name"
                  :class="[field, errors.lastName && fieldError]"
                  :aria-invalid="errors.lastName ? 'true' : undefined"
                >
                <p v-if="errors.lastName" :class="errorText" role="alert">{{ errors.lastName }}</p>
              </div>

              <div>
                <label :class="label" for="part-firstname">Prénom</label>
                <input
                  id="part-firstname"
                  v-model="form.firstName"
                  type="text"
                  autocomplete="given-name"
                  :class="[field, errors.firstName && fieldError]"
                  :aria-invalid="errors.firstName ? 'true' : undefined"
                >
                <p v-if="errors.firstName" :class="errorText" role="alert">{{ errors.firstName }}</p>
              </div>
            </div>

            <div>
              <label :class="label" for="part-email">Courriel</label>
              <input
                id="part-email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                :class="[field, errors.email && fieldError]"
                :aria-invalid="errors.email ? 'true' : undefined"
              >
              <p v-if="errors.email" :class="errorText" role="alert">{{ errors.email }}</p>
            </div>

            <div>
              <label class="flex cursor-pointer items-start gap-2.5 text-xs text-tertiary-800">
                <input
                  v-model="form.consent"
                  type="checkbox"
                  class="mt-0.5 size-4 shrink-0 accent-secondary"
                >
                <span>J’accepte que DZUVO utilise ces informations pour répondre à ma demande.</span>
              </label>
              <p v-if="errors.consent" :class="errorText" role="alert">{{ errors.consent }}</p>
            </div>

            <!-- Piège à robots : invisible et retiré du parcours clavier. -->
            <input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

            <button type="submit" class="btn-primary cursor-pointer mt-auto justify-center" :disabled="status === 'pending'">
              {{ status === 'pending' ? 'Envoi en cours…' : 'Envoyer ma demande' }}
              <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
                <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <p
            v-if="feedback"
            class="text-body md:col-span-2"
            :class="status === 'success' ? 'text-tertiary-500' : 'text-secondary'"
            role="status"
          >
            {{ feedback }}
          </p>
        </form>
      </div>

      <!-- Deux raccourcis, à la façon des encarts du modèle -->
      <ul data-reveal class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <li v-for="shortcut in shortcuts" :key="shortcut.id">
          <NuxtLink
            :to="shortcut.to"
            class="group flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-gray-900 bg-primary p-6 text-center transition-transform duration-300 hover:z-10 hover:scale-105"
          >
            <span class="text-secondary">
              <!-- Conseiller : bulle de discussion -->
              <svg v-if="shortcut.id === 'conseiller'" width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M28 15.4A11.5 11.5 0 0 1 5.6 23L2 30l3.6-8.4A11.5 11.5 0 1 1 28 15.4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              </svg>
              <!-- Suivi : colis en mouvement -->
              <svg v-else width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M5 9.5 16 4l11 5.5v13L16 28 5 22.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M5 9.5 16 15l11-5.5M16 15v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              </svg>
            </span>

            <span class="h-0.5 w-10 rounded-full bg-secondary" aria-hidden="true" />

            <span class="text-h4 font-bold text-tertiary-50 uppercase">{{ shortcut.title }}</span>
            <span class="text-body text-tertiary-800">{{ shortcut.note }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
