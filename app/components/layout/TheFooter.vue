<script setup lang="ts">
import { footerColumns, socialLinks } from '~/config/footer'
import { siteConfig } from '~/config/site'

/**
 * Pied de page. Première bande : les engagements de service. Seconde : les
 * colonnes d'information, repliées en accordéon sous `lg` où six liens
 * empilés par colonne rendraient la page interminable.
 */
const root = useTemplateRef<HTMLElement>('root')
// En pied de page, le seuil habituel ne serait jamais franchi.
useScrollReveal(root, { y: 24, stagger: 0.06, start: 'top bottom-=40' })

/** Colonnes dépliées sur mobile. Sur desktop, tout est visible en permanence. */
const openColumns = ref<string[]>([])
const toggle = (id: string) => {
  openColumns.value = openColumns.value.includes(id)
    ? openColumns.value.filter(c => c !== id)
    : [...openColumns.value, id]
}
const isOpen = (id: string) => openColumns.value.includes(id)

const email = ref('')
const consent = ref(false)
const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const feedback = ref('')
const honeypot = ref('')

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

const commitments = [
  { id: 'livraison', label: 'Livraison et retours gratuits*', to: '/livraison' },
  { id: 'paiement', label: 'Paiement 100 % sécurisé', to: '/paiement' },
  { id: 'financement', label: 'Paiement en plusieurs fois', to: '/financement' },
  { id: 'garantie', label: 'Garantie DZUVO 2 ans', to: '/garantie' },
  { id: 'service', label: 'Service client au Canada', to: '/contact' },
  { id: 'engagements', label: 'Nos engagements', to: '/engagements' },
]
</script>

<template>
  <footer ref="root" class="mt-16 bg-primary md:mt-20 lg:mt-24">
    <div data-reveal-group class="px-2.5 py-12 md:px-5 lg:px-24">
      <ul class="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
        <li v-for="item in commitments" :key="item.id" data-reveal>
          <NuxtLink
            :to="item.to"
            class="group flex h-full flex-col items-center gap-3 text-center"
          >
            <!-- Tracé principal en clair, détail d'accent en rouge. -->
            <span class="text-tertiary-500 transition-colors group-hover:text-secondary">
              <svg width="42" height="42" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <!-- Livraison et retours : camion et flèches d'échange -->
                <template v-if="item.id === 'livraison'">
                  <path d="M4 16h14v11H4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                  <path d="M18 20h6l4 4v3H18" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                  <circle cx="9" cy="29.5" r="2.2" stroke="currentColor" stroke-width="1.7" />
                  <circle cx="24" cy="29.5" r="2.2" stroke="currentColor" stroke-width="1.7" />
                  <path d="M22 7.5h6.5a3.5 3.5 0 0 1 0 7H26" class="stroke-secondary" stroke-width="1.7" stroke-linecap="round" />
                  <path d="m24.5 5 -2.5 2.5 2.5 2.5M27.5 12l-1.5 2.5 2.5 1.5" class="stroke-secondary" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </template>

                <!-- Paiement sécurisé : carte et cadenas -->
                <template v-else-if="item.id === 'paiement'">
                  <rect x="4" y="10" width="24" height="17" rx="2.5" stroke="currentColor" stroke-width="1.7" />
                  <path d="M4 16h24" stroke="currentColor" stroke-width="1.7" />
                  <path d="M8 22h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  <path d="M27 21v-2.5a3.5 3.5 0 0 1 7 0V21" class="stroke-secondary" stroke-width="1.7" stroke-linecap="round" />
                  <rect x="25.5" y="21" width="10" height="8" rx="2" class="stroke-secondary" stroke-width="1.7" />
                </template>

                <!-- Paiement fractionné : trois échéances -->
                <template v-else-if="item.id === 'financement'">
                  <rect x="3" y="11" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.7" />
                  <rect x="11" y="16" width="15" height="11" rx="2" stroke="currentColor" stroke-width="1.7" />
                  <rect x="19" y="21" width="15" height="11" rx="2" class="stroke-secondary" stroke-width="1.7" />
                  <path d="M23 26.5h7" class="stroke-secondary" stroke-width="1.7" stroke-linecap="round" />
                </template>

                <!-- Garantie : bouclier et validation -->
                <template v-else-if="item.id === 'garantie'">
                  <path d="M20 4 8 8.5v10c0 7.6 5 14.4 12 16.9 7-2.5 12-9.3 12-16.9v-10z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                  <path d="m14.5 19.5 4 4 7.5-8" class="stroke-secondary" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </template>

                <!-- Service client : conseiller avec casque -->
                <template v-else-if="item.id === 'service'">
                  <path d="M8 21v-2a12 12 0 0 1 24 0v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  <rect x="4.5" y="20" width="6" height="9" rx="2.5" class="stroke-secondary" stroke-width="1.7" />
                  <rect x="29.5" y="20" width="6" height="9" rx="2.5" class="stroke-secondary" stroke-width="1.7" />
                  <path d="M32.5 29v1.5a3.5 3.5 0 0 1-3.5 3.5h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                </template>

                <!-- Engagements : poignée de main -->
                <template v-else>
                  <path d="M3 14h5l5.5 5.5a2.5 2.5 0 0 0 3.5-3.5L14 12l4-2.5 6 3.5h9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M37 14h-5l-6 6-4-3" class="stroke-secondary" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M3 14v9h4M37 14v9h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </template>
              </svg>
            </span>

            <span class="text-[13px] text-pretty text-tertiary-600 transition-colors group-hover:text-tertiary-50">
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="border-t border-tertiary-500/10 px-2.5 py-10 md:px-5 lg:px-24">
      <div data-reveal-group class="grid gap-x-8 gap-y-2 lg:grid-cols-4 lg:gap-y-10">
        <!-- Colonnes de liens -->
        <div v-for="column in footerColumns" :key="column.id" data-reveal class="border-b border-tertiary-500/10 lg:border-0">
          <h3 class="lg:mb-4">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 py-4 text-left text-h4 font-bold text-tertiary-50 uppercase lg:cursor-default lg:py-0"
              :aria-expanded="isOpen(column.id)"
              :aria-controls="`footer-${column.id}`"
              @click="toggle(column.id)"
            >
              {{ column.title }}
              <svg
                class="shrink-0 transition-transform duration-300 lg:hidden"
                :class="isOpen(column.id) ? 'rotate-180' : ''"
                width="12" height="8" viewBox="0 0 10 6" fill="none" aria-hidden="true"
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </h3>

          <ul
            :id="`footer-${column.id}`"
            class="flex flex-col gap-3 pb-5 lg:pb-0"
            :class="isOpen(column.id) ? 'flex' : 'hidden lg:flex'"
          >
            <li v-for="item in column.items" :key="item.to">
              <NuxtLink :to="item.to" class="text-body text-tertiary-800 transition-colors hover:text-secondary">
                {{ item.label }}
              </NuxtLink>
            </li>
            <li v-if="column.id === 'informations'">
              <!-- Ouvre le gestionnaire de consentement, ce n'est pas une page. -->
              <button type="button" class="text-body text-tertiary-800 transition-colors hover:text-secondary">
                Paramètres des cookies
              </button>
            </li>
          </ul>
        </div>

        <!-- Contact et réseaux -->
        <div data-reveal class="border-b border-tertiary-500/10 lg:border-0">
          <h3 class="lg:mb-4">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 py-4 text-left text-h4 font-bold text-tertiary-50 uppercase lg:cursor-default lg:py-0"
              :aria-expanded="isOpen('contact')"
              aria-controls="footer-contact"
              @click="toggle('contact')"
            >
              Nous contacter
              <svg
                class="shrink-0 transition-transform duration-300 lg:hidden"
                :class="isOpen('contact') ? 'rotate-180' : ''"
                width="12" height="8" viewBox="0 0 10 6" fill="none" aria-hidden="true"
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </h3>

          <div
            id="footer-contact"
            class="pb-5 lg:pb-0"
            :class="isOpen('contact') ? 'block' : 'hidden lg:block'"
          >
            <a
              :href="`mailto:${siteConfig.contact.email}`"
              class="text-body text-tertiary-800 transition-colors hover:text-secondary"
            >
              {{ siteConfig.contact.email }}
            </a>

            <p class="mt-6 mb-3 text-[13px] font-bold tracking-[0.18em] text-tertiary-600 uppercase">Nous suivre</p>
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
          </div>
        </div>

        <!-- Newsletter -->
        <div data-reveal class="pt-6 lg:pt-0">
          <h3 class="mb-3 text-h4 font-bold text-tertiary-50 uppercase">Lettre d’information</h3>
          <p class="mb-4 text-body text-tertiary-800">
            Nouveautés, promos et conseils d’entretien, une fois par mois.
          </p>

          <form class="flex flex-col gap-3" novalidate @submit.prevent="subscribe">
            <input v-model="honeypot" type="text" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">

            <div class="flex gap-2">
              <label class="sr-only" for="footer-email">Votre courriel</label>
              <input
                id="footer-email"
                v-model="email"
                type="email"
                required
                placeholder="Votre courriel"
                class="min-w-0 flex-1 rounded-md border border-transparent bg-tertiary-500/6 px-4 py-3 text-body text-tertiary-50 outline-none transition-colors placeholder:text-tertiary-800 focus:border-secondary"
              >
              <button type="submit" class="btn-primary shrink-0" :disabled="status === 'pending'">
                {{ status === 'pending' ? '…' : 'Je m’inscris' }}
              </button>
            </div>

            <label class="flex items-start gap-2.5 text-xs text-tertiary-800">
              <input v-model="consent" type="checkbox" class="mt-0.5 size-4 shrink-0 accent-secondary">
              <span>J’accepte de recevoir les communications de DZUVO.</span>
            </label>

            <p v-if="feedback" class="text-xs" :class="status === 'success' ? 'text-tertiary-500' : 'text-secondary'" role="status">
              {{ feedback }}
            </p>
          </form>
        </div>
      </div>
    </div>
  </footer>
</template>
