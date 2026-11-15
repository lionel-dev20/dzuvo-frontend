<script setup lang="ts">
import { socialLinks } from '~/config/footer'
import { siteConfig } from '~/config/site'

/**
 * Page d'annonce, le temps du pré-lancement.
 *
 * La boutique est écrite et fonctionne — elle vit sur `/home2`. Cette page ne
 * fait qu'une chose : dire que l'ouverture approche et recueillir un courriel.
 * Tout le reste en est retiré volontairement ; un menu ou un panier n'auraient
 * mené qu'à des rayons qu'on ne veut pas encore montrer.
 *
 * Le jour de l'ouverture, il suffit d'échanger le contenu de ce fichier avec
 * celui de `home2.vue` et de retirer son `noindex`.
 */
definePageMeta({ layout: 'landing' })

/* Même formulaire que la lettre d'information du pied de page : même API,
   même piège à robots, même consentement. Rien de nouveau à maintenir. */
const email = ref('')
const consent = ref(false)
const honeypot = ref('')
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const feedback = ref('')

async function subscribe() {
  status.value = 'pending'

  try {
    const result = await $fetch<{ message: string }>('/api/newsletter', {
      method: 'POST',
      body: { email: email.value, consent: consent.value, honeypot: honeypot.value },
    })
    status.value = 'success'
    feedback.value = result.message
    email.value = ''
    consent.value = false
  }
  catch (error: any) {
    status.value = 'error'
    feedback.value = error?.data?.message ?? 'L’inscription a échoué. Merci de réessayer.'
  }
}

const promises = [
  { id: 'marques', label: 'Compatible toutes marques' },
  { id: 'livraison', label: 'Livraison partout au Canada' },
  { id: 'garantie', label: 'Garantie DZUVO 2 ans' },
]

useSeo({
  title: 'Bientôt en ligne',
  description: 'DZUVO ouvre bientôt sa boutique d’accessoires auto, compatibles toutes marques, livrés partout au Canada. Laissez votre courriel pour être prévenu de l’ouverture.',
})
</script>

<template>
  <div class="relative flex flex-1 flex-col">
    <!-- Rubans lumineux du reste du site, sans le décalage prévu pour le header. -->
    <FluidBackdrop class="-z-10" />

    <main
      id="main"
      class="relative flex flex-1 flex-col items-center justify-center px-2.5 py-16 text-center md:px-5 lg:px-24 lg:py-24"
    >
      <img
        src="/images/logos/dzuvo.png"
        alt="DZUVO"
        width="150"
        height="72"
        class="h-16 w-auto lg:h-20"
      >

      <p class="mt-10 text-[13px] font-bold tracking-[0.18em] text-secondary uppercase">
        Bientôt en ligne
      </p>

      <h1 class="mt-4 max-w-4xl text-h1 leading-tight font-bold text-balance lg:text-hero">
        <span class="text-tertiary-700">Accessoires auto</span><br>
        <span class="text-tertiary-50">très bientôt à votre service</span>
      </h1>

      <p class="mt-6 max-w-xl text-pretty text-tertiary-800 lg:text-body-lg">
        Nous préparons une boutique pensée pour les automobilistes d’ici : des
        accessoires compatibles toutes marques, livrés partout au Canada.
        Laissez-nous votre courriel, vous serez prévenu le jour de l’ouverture.
      </p>

      <!-- Recueil du courriel -->
      <form class="mt-10 flex w-full max-w-lg flex-col gap-3" novalidate @submit.prevent="subscribe">
        <!-- Piège à robots : invisible et retiré du parcours clavier. -->
        <input v-model="honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

        <div class="flex flex-col gap-2.5 sm:flex-row">
          <label class="sr-only" for="landing-email">Votre courriel</label>
          <input
            id="landing-email"
            v-model="email"
            type="email"
            required
            placeholder="Votre courriel"
            autocomplete="email"
            class="field min-w-0 flex-1 text-left"
            :disabled="status === 'success'"
          >
          <button
            type="submit"
            class="btn-primary shrink-0 justify-center"
            :disabled="status === 'pending' || status === 'success'"
          >
            {{ status === 'pending' ? 'Envoi…' : 'Prévenez-moi' }}
            <svg v-if="status === 'idle' || status === 'error'" width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <label v-if="status !== 'success'" class="flex items-start gap-2.5 text-left text-xs text-tertiary-800">
          <input v-model="consent" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-secondary">
          <span>J’accepte de recevoir les communications de DZUVO.</span>
        </label>

        <p
          v-if="feedback"
          class="text-body"
          :class="status === 'success' ? 'text-tertiary-500' : 'text-secondary'"
          role="status"
        >
          {{ feedback }}
        </p>
      </form>

      <!-- Trois promesses, celles du reste du site -->
      <ul class="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <li v-for="promise in promises" :key="promise.id" class="flex items-center gap-2.5">
          <span class="grid size-6 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="text-body text-tertiary-600">{{ promise.label }}</span>
        </li>
      </ul>
    </main>

    <!-- Pied de page réduit : de quoi nous joindre, rien de plus. -->
    <footer class="relative border-t border-tertiary-500/10 px-2.5 py-8 md:px-5 lg:px-24">
      <div class="flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <div class="flex flex-col items-center gap-1 lg:items-start">
          <a
            :href="`mailto:${siteConfig.contact.email}`"
            class="text-body text-tertiary-600 transition-colors hover:text-secondary"
          >
            {{ siteConfig.contact.email }}
          </a>
          <a
            v-if="siteConfig.contact.phone"
            :href="`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`"
            class="text-body text-tertiary-800 transition-colors hover:text-secondary"
          >
            {{ siteConfig.contact.phone }}
          </a>
        </div>

        <ul class="flex gap-2.5">
          <li v-for="network in socialLinks" :key="network.id">
            <a
              :href="network.href"
              target="_blank"
              rel="noopener"
              :aria-label="network.label"
              class="grid size-10 place-items-center rounded-full bg-tertiary-500/8 text-tertiary-500 transition-colors hover:bg-secondary hover:text-on-accent"
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

        <p class="text-xs text-tertiary-900">
          © {{ new Date().getFullYear() }} {{ siteConfig.legalName }} — {{ siteConfig.contact.address.city }}, {{ siteConfig.contact.address.region }}
        </p>
      </div>
    </footer>
  </div>
</template>
