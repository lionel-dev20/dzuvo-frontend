<script setup lang="ts">
import { socialLinks } from '~/config/footer'
import { siteConfig } from '~/config/site'
import { deliveryCities } from '#shared/config/cities'

/**
 * Page de contact. Le formulaire s'appuie sur `useContactForm` — même
 * validation partagée client/serveur, même honeypot et même limitation de
 * débit que la recherche de pièce de l'accueil.
 *
 * Les coordonnées viennent toutes de `siteConfig` : celles qui ne sont pas
 * renseignées ne s'affichent pas plutôt que d'afficher un contact factice.
 */
const root = useTemplateRef<HTMLElement>('root')
useScrollReveal(root, { y: 32 })

const { form, errors, status, feedback, submit, reset } = useContactForm()

/** Sujets proposés : ils qualifient la demande à la réception. */
const subjects = [
  'Commande en cours',
  'Recherche d’une pièce',
  'Livraison et délais',
  'Retour, échange ou garantie',
  'Facture ou paiement',
  'Compte professionnel',
  'Autre demande',
]

const shortcuts = [
  {
    id: 'suivi',
    to: '/compte',
    title: 'Suivre ma commande',
    note: 'depuis votre compte',
  },
  {
    id: 'piece',
    to: '/categories',
    title: 'Parcourir le catalogue',
    note: 'toutes marques',
  },
]

const faq = [
  {
    id: 'delai',
    question: 'Sous quel délai obtiendrai-je une réponse ?',
    answer: 'Sous 24 h ouvrées. Les demandes portant sur une commande en cours sont traitées en priorité — pensez à indiquer votre numéro de commande dans le message.',
  },
  {
    id: 'piece',
    question: 'Je ne trouve pas ma pièce dans le catalogue.',
    answer: 'Décrivez le véhicule (marque, modèle, année, version) et la référence si vous l’avez : nous cherchons la pièce pour vous et revenons avec une disponibilité et un prix.',
  },
  {
    id: 'livraison',
    question: 'Livrez-vous partout au Canada ?',
    answer: `Oui. ${deliveryCities.length} villes sont desservies avec livraison programmée par quartier, et le reste du Canada est livré en mode standard.`,
  },
  {
    id: 'retour',
    question: 'Comment retourner une pièce ?',
    answer: 'Écrivez-nous avec le numéro de commande et la référence concernée en choisissant le sujet « Retour, échange ou garantie ». Nous vous envoyons la marche à suivre et l’étiquette de retour.',
  },
]

/** Une seule question ouverte à la fois : la liste reste lisible. */
const openQuestion = ref<string | null>(null)
const toggleQuestion = (id: string) => {
  openQuestion.value = openQuestion.value === id ? null : id
}

useSeo({
  title: 'Nous contacter',
  description: 'Une question sur une commande, une pièce ou une livraison ? L’équipe DZUVO répond sous 24 h ouvrées, partout au Canada.',
})

useBreadcrumbSchema([
  { name: 'Accueil', path: '/' },
  { name: 'Contact', path: '/contact' },
])

useFaqSchema(faq.map(({ question, answer }) => ({ question, answer })))
</script>

<template>
  <div ref="root" class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <!-- Fil d'Ariane -->
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">Contact</li>
      </ol>
    </nav>

    <header class="mb-10 max-w-2xl">
      <h1 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
        <span class="text-tertiary-700">Une question ?</span><br>
        <span class="text-tertiary-50">Parlons-en.</span>
      </h1>
      <p class="mt-4 text-pretty text-tertiary-800">
        Commande, pièce introuvable, livraison ou garantie : décrivez votre besoin,
        un conseiller vous répond sous 24 h ouvrées.
      </p>
    </header>

    <div data-reveal-group class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6">
      <!-- Formulaire -->
      <section data-reveal class="rounded-2xl bg-primary p-6 md:p-8" aria-labelledby="titre-formulaire">
        <h2 id="titre-formulaire" class="text-h3 font-bold text-tertiary-50">Écrire à l’équipe</h2>
        <p class="mt-2 text-body text-tertiary-800">
          Les champs marqués « facultatif » peuvent rester vides.
        </p>

        <!--
          Envoi réussi : le formulaire s'efface au profit de la confirmation.
          Le laisser vide à l'écran laisserait croire que rien n'est parti.
        -->
        <div v-if="status === 'success'" class="mt-7 flex flex-col items-start gap-4" role="status">
          <span class="grid size-12 place-items-center rounded-full bg-secondary/15 text-secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <p class="text-h4 font-medium text-tertiary-50">{{ feedback }}</p>
          <button type="button" class="btn-secondary cursor-pointer" @click="reset()">
            Envoyer un autre message
          </button>
        </div>

        <form v-else class="mt-7 grid gap-5 md:grid-cols-2" novalidate @submit.prevent="submit">
          <!-- Piège à robots : invisible et retiré du parcours clavier. -->
          <input v-model="form.honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-lastname">Nom</label>
            <input
              id="contact-lastname"
              v-model="form.lastName"
              type="text"
              autocomplete="family-name"
              class="field"
              :class="errors.lastName && 'field-invalid'"
              :aria-invalid="errors.lastName ? 'true' : undefined"
              aria-describedby="contact-lastname-error"
            >
            <p v-if="errors.lastName" id="contact-lastname-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.lastName }}
            </p>
          </div>

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-firstname">Prénom</label>
            <input
              id="contact-firstname"
              v-model="form.firstName"
              type="text"
              autocomplete="given-name"
              class="field"
              :class="errors.firstName && 'field-invalid'"
              :aria-invalid="errors.firstName ? 'true' : undefined"
              aria-describedby="contact-firstname-error"
            >
            <p v-if="errors.firstName" id="contact-firstname-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.firstName }}
            </p>
          </div>

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-email">Courriel</label>
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="field"
              :class="errors.email && 'field-invalid'"
              :aria-invalid="errors.email ? 'true' : undefined"
              aria-describedby="contact-email-error"
            >
            <p v-if="errors.email" id="contact-email-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.email }}
            </p>
          </div>

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-phone">
              Téléphone <span class="text-tertiary-800">(facultatif)</span>
            </label>
            <input
              id="contact-phone"
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              class="field"
              :class="errors.phone && 'field-invalid'"
              :aria-invalid="errors.phone ? 'true' : undefined"
              aria-describedby="contact-phone-error"
            >
            <p v-if="errors.phone" id="contact-phone-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.phone }}
            </p>
          </div>

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-company">
              Entreprise <span class="text-tertiary-800">(facultatif)</span>
            </label>
            <input
              id="contact-company"
              v-model="form.company"
              type="text"
              autocomplete="organization"
              class="field"
            >
          </div>

          <div>
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-subject">Sujet</label>
            <select
              id="contact-subject"
              v-model="form.subject"
              class="field appearance-none"
              :class="errors.subject && 'field-invalid'"
              :aria-invalid="errors.subject ? 'true' : undefined"
              aria-describedby="contact-subject-error"
            >
              <option value="" disabled>Choisir un sujet…</option>
              <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
            </select>
            <p v-if="errors.subject" id="contact-subject-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.subject }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label class="mb-2 block text-body font-medium text-tertiary-600" for="contact-message">Message</label>
            <textarea
              id="contact-message"
              v-model="form.message"
              rows="7"
              placeholder="Numéro de commande, véhicule (marque, modèle, année, version), référence de la pièce…"
              class="field resize-y"
              :class="errors.message && 'field-invalid'"
              :aria-invalid="errors.message ? 'true' : undefined"
              aria-describedby="contact-message-error"
            />
            <p v-if="errors.message" id="contact-message-error" class="mt-1.5 text-xs text-secondary" role="alert">
              {{ errors.message }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label class="flex cursor-pointer items-start gap-2.5 text-xs text-tertiary-800">
              <input v-model="form.consent" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-secondary">
              <span>J’accepte que DZUVO utilise ces informations pour répondre à ma demande.</span>
            </label>
            <p v-if="errors.consent" class="mt-1.5 text-xs text-secondary" role="alert">{{ errors.consent }}</p>
          </div>

          <div class="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
            <button type="submit" class="btn-primary cursor-pointer justify-center" :disabled="status === 'pending'">
              {{ status === 'pending' ? 'Envoi en cours…' : 'Envoyer mon message' }}
              <svg v-if="status !== 'pending'" width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
                <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            <p v-if="status === 'error' && feedback" class="text-body text-secondary" role="alert">
              {{ feedback }}
            </p>
          </div>
        </form>
      </section>

      <!-- Coordonnées et raccourcis -->
      <div class="flex flex-col gap-4 lg:gap-6">
        <section data-reveal class="rounded-2xl bg-primary p-6 md:p-8" aria-labelledby="titre-coordonnees">
          <h2 id="titre-coordonnees" class="text-h3 font-bold text-tertiary-50">Nos coordonnées</h2>

          <ul class="mt-7 flex flex-col gap-6">
            <li class="flex items-start gap-4">
              <span class="grid size-12 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" stroke="currentColor" stroke-width="1.7" />
                  <path d="m3.5 7 8.5 6 8.5-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <div>
                <h3 class="text-h4 font-bold text-tertiary-50">Courriel</h3>
                <a
                  :href="`mailto:${siteConfig.contact.email}`"
                  class="mt-1 block text-body text-tertiary-800 transition-colors hover:text-secondary"
                >
                  {{ siteConfig.contact.email }}
                </a>
              </div>
            </li>

            <!-- Téléphone et adresse : affichés seulement une fois renseignés
                 dans `site.ts`, jamais remplacés par un contact de démonstration. -->
            <li v-if="siteConfig.contact.phone" class="flex items-start gap-4">
              <span class="grid size-12 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M8.1 3.5 9.9 8l-2 1.6a11.5 11.5 0 0 0 6.5 6.5l1.6-2 4.5 1.8v3.4a1.7 1.7 0 0 1-1.9 1.7C10.4 20.3 3.7 13.6 3 5.4a1.7 1.7 0 0 1 1.7-1.9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                </svg>
              </span>
              <div>
                <h3 class="text-h4 font-bold text-tertiary-50">Téléphone</h3>
                <a
                  :href="`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`"
                  class="mt-1 block text-body text-tertiary-800 transition-colors hover:text-secondary"
                >
                  {{ siteConfig.contact.phone }}
                </a>
                <p v-if="siteConfig.contact.openingHours" class="text-body text-tertiary-800">
                  {{ siteConfig.contact.openingHours }}
                </p>
              </div>
            </li>

            <li v-if="siteConfig.contact.address.city" class="flex items-start gap-4">
              <span class="grid size-12 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 21.5s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                  <circle cx="12" cy="10.3" r="2.6" stroke="currentColor" stroke-width="1.7" />
                </svg>
              </span>
              <div>
                <h3 class="text-h4 font-bold text-tertiary-50">Adresse</h3>
                <address class="mt-1 text-body text-tertiary-800 not-italic">
                  <span v-if="siteConfig.contact.address.street">{{ siteConfig.contact.address.street }}<br></span>
                  {{ siteConfig.contact.address.postalCode }} {{ siteConfig.contact.address.city }}
                </address>
              </div>
            </li>

            <li class="flex items-start gap-4">
              <span class="grid size-12 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
                  <path d="M12 6.8V12l3.4 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <div>
                <h3 class="text-h4 font-bold text-tertiary-50">Délai de réponse</h3>
                <p class="mt-1 text-body text-tertiary-800">
                  Sous 24 h ouvrées, par courriel. Service client au Canada.
                </p>
              </div>
            </li>
          </ul>

          <p class="mt-8 mb-3 text-[13px] font-bold tracking-[0.18em] text-tertiary-600 uppercase">Nous suivre</p>
          <ul class="flex gap-2.5">
            <li v-for="network in socialLinks" :key="network.id">
              <a
                :href="network.href"
                target="_blank"
                rel="noopener"
                :aria-label="network.label"
                class="grid size-10 place-items-center rounded-full bg-tertiary-500/8 text-tertiary-500 transition-colors hover:bg-secondary hover:text-tertiary-50"
              >
                <svg v-if="network.id === 'facebook'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14 9V7.2c0-.8.2-1.2 1.4-1.2H17V3h-2.6C11.2 3 10 4.5 10 7v2H8v3h2v9h4v-9h2.7l.3-3z" />
                </svg>
                <svg v-else-if="network.id === 'instagram'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.8" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8" />
                  <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
                </svg>
                <svg v-else-if="network.id === 'tiktok'" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.5 2h-3v13a2.5 2.5 0 1 1-2.5-2.5c.3 0 .5 0 .8.1V9.5a5.5 5.5 0 1 0 4.7 5.4V8.4a6.6 6.6 0 0 0 4 1.3V6.6a3.7 3.7 0 0 1-4-3.6z" />
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12s0-3.3-.4-4.9a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.7 2 12 2 12s0 3.3.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8C22 15.3 22 12 22 12zM10 15.2V8.8L15.5 12z" />
                </svg>
              </a>
            </li>
          </ul>
        </section>

        <!-- Raccourcis, à la façon des encarts de l'accueil -->
        <ul data-reveal class="grid gap-4 sm:grid-cols-2">
          <li v-for="shortcut in shortcuts" :key="shortcut.id">
            <NuxtLink
              :to="shortcut.to"
              class="group flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-primary p-6 text-center transition-transform duration-300 hover:z-10 hover:scale-105"
            >
              <span class="text-secondary">
                <!-- Suivi : colis en mouvement -->
                <svg v-if="shortcut.id === 'suivi'" width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M5 9.5 16 4l11 5.5v13L16 28 5 22.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                  <path d="M5 9.5 16 15l11-5.5M16 15v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
                <!-- Catalogue : loupe sur une grille -->
                <svg v-else width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="14.5" cy="14.5" r="9" stroke="currentColor" stroke-width="1.8" />
                  <path d="m21 21 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </span>

              <span class="h-0.5 w-10 rounded-full bg-secondary" aria-hidden="true" />

              <span class="text-h4 font-bold text-tertiary-50 uppercase">{{ shortcut.title }}</span>
              <span class="text-body text-tertiary-800">{{ shortcut.note }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Questions fréquentes : autant de messages en moins à écrire -->
    <section class="mt-16 md:mt-20" aria-labelledby="titre-faq">
      <h2 id="titre-faq" class="text-h3 font-bold text-tertiary-50 lg:text-h3-lg">Questions fréquentes</h2>

      <ul data-reveal-group class="mt-6 flex flex-col gap-3">
        <li v-for="item in faq" :key="item.id" data-reveal class="rounded-2xl bg-primary px-6 md:px-8">
          <h3>
            <button
              type="button"
              class="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left text-h4 font-medium text-tertiary-50"
              :aria-expanded="openQuestion === item.id"
              :aria-controls="`faq-${item.id}`"
              @click="toggleQuestion(item.id)"
            >
              {{ item.question }}
              <svg
                class="shrink-0 transition-transform duration-300"
                :class="openQuestion === item.id ? 'rotate-180' : ''"
                width="12" height="8" viewBox="0 0 10 6" fill="none" aria-hidden="true"
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </h3>

          <p
            :id="`faq-${item.id}`"
            class="max-w-3xl pb-5 text-body text-pretty text-tertiary-800"
            :class="openQuestion === item.id ? 'block' : 'hidden'"
          >
            {{ item.answer }}
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>
