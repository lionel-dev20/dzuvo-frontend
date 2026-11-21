<script setup lang="ts">
/**
 * Livraison partout au Canada, racontée par une scène plutôt que par une carte :
 * le camion arrive, la boîte est remise, la personne sourit.
 *
 * L'animation joue une fois, quand la scène entre à l'écran (classe `is-in`
 * posée par `useReveal`). Au repos, seule la boîte respire, très légèrement.
 */
const root = useTemplateRef<HTMLElement>('root')
useReveal(root)

/*
 * Photo de livraison réelle, à déposer dans public/images/livraison/. Fond
 * transparent ou blanc : la zone prend la couleur de la section pour que le
 * visuel s'y fonde. Tant que le fichier n'existe pas, l'illustration sert de
 * repli — la section n'a jamais d'image cassée.
 */
const PHOTO = '/images/livraison/livraison.jpg'
const photo = useTemplateRef<HTMLImageElement>('photo')
const photoFailed = ref(false)

onMounted(() => {
  // Une erreur survenue avant l'hydratation n'a déclenché aucun écouteur.
  const img = photo.value
  if (img?.complete && img.naturalWidth === 0) photoFailed.value = true
})

const facts = [
  { value: 'Partout', label: 'du Québec à la Colombie-Britannique' },
  { value: 'Gratuit*', label: 'livraison et retours' },
  { value: '2 ans', label: 'de garantie DZUVO' },
]
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-labelledby="livraison-titre">
    <div class="grid items-center gap-8 overflow-hidden rounded-3xl bg-primary p-5 shadow-panel md:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14 lg:p-14">
      <div>
        <p data-r class="mb-3 text-xs font-bold tracking-[0.22em] text-secondary uppercase">Livraison</p>
        <h2 id="livraison-titre" data-r style="--i: 1" class="text-h2 leading-tight font-bold text-balance text-tertiary-50 lg:text-h2-lg">
          Commandé aujourd’hui, à votre porte partout au Canada
        </h2>
        <p data-r style="--i: 2" class="mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-tertiary-700">
          Vos accessoires partent de Saint-Georges, au Québec, et arrivent là où vous habitez : en ville, en région, sur la Côte-Nord ou dans les Prairies.
        </p>

        <dl data-r style="--i: 3" class="mt-8 grid grid-cols-3 gap-4 border-t border-tertiary-500/12 pt-6">
          <div v-for="fact in facts" :key="fact.value">
            <dt class="text-h3 font-bold text-tertiary-50">{{ fact.value }}</dt>
            <dd class="mt-1 text-[12px] leading-snug text-tertiary-700">{{ fact.label }}</dd>
          </div>
        </dl>

        <NuxtLink data-r style="--i: 4" to="/livraison" class="btn-secondary mt-8">Zones et délais de livraison</NuxtLink>
      </div>

      <!-- Scène -->
      <div data-r style="--i: 2" class="relative">
        <img
          v-if="!photoFailed"
          ref="photo"
          :src="PHOTO"
          alt="Un client sourit en recevant son colis DZUVO devant sa porte"
          class="mx-auto h-auto max-h-[440px] w-full rounded-2xl bg-primary object-contain"
          width="640"
          height="440"
          loading="lazy"
          @error="photoFailed = true"
        >
        <svg v-else viewBox="0 0 560 380" class="h-auto w-full" role="img" aria-label="Une personne sourit en recevant son colis DZUVO devant sa porte, pendant que le camion de livraison repart.">
          <!-- Sol et maison -->
          <rect x="0" y="302" width="560" height="78" rx="0" style="fill: var(--color-tertiary-500); opacity: 0.08" />
          <rect x="296" y="96" width="236" height="206" rx="6" style="fill: var(--color-primary-darker); stroke: var(--color-tertiary-500); stroke-opacity: 0.18" />
          <path d="M284 100 414 36l130 64z" style="fill: var(--color-tertiary-500); opacity: 0.85" />
          <!-- Porte -->
          <rect x="378" y="150" width="82" height="152" rx="4" style="fill: var(--color-secondary)" />
          <circle cx="446" cy="230" r="4.5" fill="#fff" />
          <rect x="392" y="166" width="54" height="40" rx="3" fill="#fff" opacity="0.2" />
          <!-- Fenêtre -->
          <rect x="488" y="150" width="34" height="46" rx="3" style="fill: var(--color-tertiary-500); opacity: 0.12" />

          <!-- Camion : arrive, puis reste en bordure de scène -->
          <g class="van">
            <rect x="18" y="226" width="124" height="68" rx="8" style="fill: var(--color-tertiary-50)" />
            <path d="M142 250h26a8 8 0 0 1 6 3l14 18v23h-46z" style="fill: var(--color-tertiary-50)" />
            <path d="M152 256h16l12 15h-28z" fill="#fff" opacity="0.7" />
            <rect x="18" y="226" width="124" height="14" rx="4" style="fill: var(--color-secondary)" />
            <!-- Feuille d'érable -->
            <path d="M80 256l3 8 6-3-2 10 5-1-8 8 2 5-6-2v7h-2v-7l-6 2 2-5-8-8 5 1-2-10 6 3z" fill="#fff" />
            <circle cx="50" cy="296" r="13" style="fill: var(--color-tertiary-50)" /><circle cx="50" cy="296" r="5.5" fill="#fff" opacity="0.6" />
            <circle cx="150" cy="296" r="13" style="fill: var(--color-tertiary-50)" /><circle cx="150" cy="296" r="5.5" fill="#fff" opacity="0.6" />
          </g>

          <!-- Personne -->
          <g>
            <!-- Jambes -->
            <rect x="238" y="262" width="16" height="40" rx="5" style="fill: var(--color-tertiary-300)" />
            <rect x="260" y="262" width="16" height="40" rx="5" style="fill: var(--color-tertiary-300)" />
            <rect x="234" y="298" width="24" height="9" rx="4" style="fill: var(--color-tertiary-50)" />
            <rect x="258" y="298" width="24" height="9" rx="4" style="fill: var(--color-tertiary-50)" />
            <!-- Torse -->
            <rect x="230" y="192" width="54" height="78" rx="18" style="fill: var(--color-secondary)" />
            <!-- Tête -->
            <rect x="248" y="176" width="18" height="18" rx="6" fill="#e2b48c" />
            <circle cx="257" cy="160" r="24" fill="#f0c9a4" />
            <path d="M233 158c0-17 11-27 25-27s24 9 24 25c-8-8-18-11-27-10-9 0-17 4-22 12z" style="fill: var(--color-tertiary-400)" />
            <circle cx="248" cy="162" r="2.6" style="fill: var(--color-tertiary-50)" />
            <circle cx="267" cy="162" r="2.6" style="fill: var(--color-tertiary-50)" />
            <!-- Sourire -->
            <path d="M247 171c4 8 16 8 20 0" fill="none" stroke="var(--color-tertiary-50)" stroke-width="2.6" stroke-linecap="round" />
            <circle cx="241" cy="170" r="4" fill="#f4a0a0" opacity="0.55" /><circle cx="274" cy="170" r="4" fill="#f4a0a0" opacity="0.55" />

            <!-- Colis tenu à deux mains -->
            <g class="box">
              <rect x="196" y="214" width="76" height="54" rx="5" fill="#c99a63" />
              <rect x="196" y="214" width="76" height="12" rx="3" fill="#b88650" />
              <rect x="226" y="214" width="16" height="54" fill="#fff" opacity="0.35" />
              <rect x="204" y="238" width="42" height="14" rx="3" style="fill: var(--color-secondary)" />
              <text x="225" y="249" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="system-ui, sans-serif">DZUVO</text>
              <!-- Mains -->
              <rect x="186" y="236" width="20" height="14" rx="7" fill="#f0c9a4" />
              <rect x="262" y="236" width="20" height="14" rx="7" fill="#f0c9a4" />
            </g>
            <!-- Bras -->
            <path d="M236 206c-18 6-30 20-30 36" fill="none" stroke="var(--color-secondary)" stroke-width="14" stroke-linecap="round" />
            <path d="M278 206c10 8 10 22 4 32" fill="none" stroke="var(--color-secondary)" stroke-width="14" stroke-linecap="round" />
          </g>

          <!-- Étincelles de contentement -->
          <g fill="none" stroke="var(--color-secondary)" stroke-width="3" stroke-linecap="round">
            <path class="spark-a" d="M206 134v14M199 141h14" />
            <path class="spark-b" d="M312 116v10M307 121h10" />
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
 * Les animations sont déclarées ici et mises en pause tant que la scène n'est
 * pas révélée : elles démarrent avec `.is-in`. Sans JS ou avec « moins
 * d'animations », rien n'est armé et la scène s'affiche d'emblée, immobile.
 */
.van { animation: home-van-in 900ms cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.box { animation: home-bob 3.2s ease-in-out infinite; }
.spark-a { animation: home-pop 600ms 900ms both; transform-origin: 206px 141px; }
.spark-b { animation: home-pop 600ms 1050ms both; transform-origin: 312px 121px; }

:global([data-armed]) [data-r]:not(.is-in) :is(.van, .spark-a, .spark-b) {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .van, .box, .spark-a, .spark-b { animation: none; }
}
</style>
