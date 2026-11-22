<script setup lang="ts">
/**
 * Nos engagements : ce que le client peut exiger de nous, dans l'ordre où il
 * en a besoin — recevoir, payer, être couvert, être entendu.
 *
 * Chaque ligne mène à sa page : un engagement qu'on ne peut pas vérifier n'est
 * qu'un slogan.
 */
const root = useTemplateRef<HTMLElement>('root')
useReveal(root)

const { text } = useHomeContent()
const kicker = text('commitmentsKicker', 'Nos engagements')
const title = text('commitmentsTitle', 'Acheter sans se poser de questions')
const lead = text('commitmentsText', 'Des accessoires au petit prix ne devraient pas être un pari. Voici ce qui vous protège à chaque commande.')
const cta = reactive({ label: text('commitmentsCtaLabel', 'Lire tous nos engagements'), to: text('commitmentsCtaTo', '/engagements') })

/** Quatre lignes : le contenu livré avec le site, surchargeable une à une depuis WordPress. */
const commitments = [
  { n: '01', title: text('commitment1Title', 'Livraison et retours gratuits*'), text: text('commitment1Text', 'Votre commande arrive chez vous partout au Canada. Elle ne convient pas ? On la reprend.'), to: text('commitment1To', '/livraison') },
  { n: '02', title: text('commitment2Title', 'Paiement 100 % sécurisé'), text: text('commitment2Text', 'Votre carte est saisie chez notre processeur de paiement : le numéro ne passe jamais par ce site.'), to: text('commitment2To', '/paiement') },
  { n: '03', title: text('commitment3Title', 'Garantie DZUVO 2 ans'), text: text('commitment3Text', 'Chaque accessoire est couvert deux ans. Un défaut, et on le remplace.'), to: text('commitment3To', '/garantie') },
  { n: '04', title: text('commitment4Title', 'Service client au Canada'), text: text('commitment4Text', 'Une vraie personne qui répond, ici, dans votre fuseau horaire.'), to: text('commitment4To', '/contact') },
].map(item => reactive(item))
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-labelledby="engagements-titre">
    <div class="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
      <div class="lg:sticky lg:top-[calc(var(--spacing-header)+32px)] lg:self-start">
        <p data-r class="mb-3 text-xs font-bold tracking-[0.22em] text-secondary uppercase">{{ kicker }}</p>
        <h2 id="engagements-titre" data-r style="--i: 1" class="text-h2 leading-tight font-bold text-balance text-tertiary-50 lg:text-h2-lg">
          {{ title }}
        </h2>
        <p data-r style="--i: 2" class="mt-4 max-w-sm text-pretty text-[15px] leading-relaxed text-tertiary-700">
          {{ lead }}
        </p>
        <NuxtLink data-r style="--i: 3" :to="cta.to" class="btn-secondary mt-7">{{ cta.label }}</NuxtLink>

        <!-- Bouclier qui se trace, puis les trois gages qui s'allument. -->
        <CommitmentsShield data-r style="--i: 4" class="mt-10 hidden lg:block" />
      </div>

      <ul class="divide-y divide-tertiary-500/12 border-y border-tertiary-500/12">
        <li v-for="(item, index) in commitments" :key="item.n" data-r :style="{ '--i': index }">
          <NuxtLink :to="item.to" class="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-4 py-6 md:grid-cols-[4rem_minmax(0,1fr)_auto] md:py-8">
            <span class="text-h3 font-bold text-tertiary-800 tabular-nums transition-colors group-hover:text-secondary">{{ item.n }}</span>
            <span>
              <span class="block text-h3 leading-snug font-bold text-tertiary-50">{{ item.title }}</span>
              <span class="mt-1.5 block max-w-lg text-[14px] leading-relaxed text-tertiary-700">{{ item.text }}</span>
            </span>
            <svg class="mt-1.5 text-tertiary-800 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-secondary" width="20" height="14" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
