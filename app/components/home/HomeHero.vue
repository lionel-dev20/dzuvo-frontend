<script setup lang="ts">
/**
 * Hero : sept secondes de vidéo, muette, en boucle.
 *
 * Le fichier de présentation est plus long que ce que la page veut montrer :
 * on le relit depuis le début dès que la septième seconde est atteinte. La
 * vérification passe par `requestAnimationFrame` plutôt que `timeupdate`, qui
 * ne se déclenche que quatre fois par seconde et laisserait entrevoir la suite.
 *
 * Une animation qui dure plus de cinq secondes doit pouvoir être arrêtée :
 * le bouton pause est donc toujours là. Elle ne démarre pas du tout si le
 * visiteur a demandé moins d'animations.
 */

// Tous les textes se règlent dans WordPress (« Page d'accueil > Accueil — Hero »).
const { text, count } = useHomeContent()
const videoSrc = text('heroVideoSrc', '/videos/dzuvo-presentation.mp4')
const loopSeconds = count('heroLoopSeconds', 7)

const eyebrow = text('heroEyebrow', 'Accessoires du quotidien · Prix justes')
const title = text('heroTitle', 'Les petits accessoires qui rendent le quotidien plus simple')
const lead = text('heroText', 'Des accessoires utiles, choisis pour faire le bonheur de ceux qui les utilisent, à des prix qui ne font pas mal. Livrés chez vous partout au Canada.')
const cta = reactive({ label: text('heroCtaLabel', 'Parcourir le catalogue'), to: text('heroCtaTo', '/categories') })
const cta2 = reactive({ label: text('heroCta2Label', 'Voir nos favoris'), to: text('heroCta2To', '#favoris') })
const proofs = [
  text('heroProof1', 'Livraison partout au Canada'),
  text('heroProof2', 'Garantie DZUVO 2 ans'),
  text('heroProof3', 'Compatible toutes marques'),
]

const root = useTemplateRef<HTMLElement>('root')
const player = useTemplateRef<HTMLVideoElement>('player')
const playing = ref(false)
const failed = ref(false)

useReveal(root)

let frame = 0

function watchLoop() {
  const video = player.value
  if (video && video.currentTime >= loopSeconds.value) video.currentTime = 0
  frame = requestAnimationFrame(watchLoop)
}

async function play() {
  try {
    await player.value?.play()
  }
  catch {
    failed.value = true
  }
}

function toggle() {
  const video = player.value
  if (!video) return
  if (video.paused) play()
  else video.pause()
}

onMounted(() => {
  const video = player.value
  if (!video) return

  video.addEventListener('play', () => { playing.value = true; cancelAnimationFrame(frame); watchLoop() })
  video.addEventListener('pause', () => { playing.value = false; cancelAnimationFrame(frame) })

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) play()
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <section ref="root" class="px-2.5 pt-3 md:px-5 md:pt-4 lg:px-24" aria-label="Présentation">
    <div class="relative isolate flex min-h-[520px] items-end overflow-hidden rounded-3xl bg-[#14141a] lg:min-h-[min(76vh,680px)]">
      <video
        ref="player"
        :src="videoSrc"
        class="absolute inset-0 -z-20 size-full object-cover"
        muted
        loop
        playsinline
        preload="auto"
        aria-hidden="true"
        tabindex="-1"
      />
      <!-- Voile uni : assez pour porter du texte blanc, sans cacher l'image. -->
      <div class="absolute inset-0 -z-10 bg-black/45" />

      <div class="w-full px-5 pt-24 pb-8 text-white md:px-10 md:pb-12 lg:px-14 lg:pb-16">
        <p data-r class="mb-4 text-xs font-bold tracking-[0.22em] text-white/80 uppercase">
          {{ eyebrow }}
        </p>

        <h1 data-r style="--i: 1" class="max-w-3xl text-h1 leading-[1.08] font-bold text-balance text-white lg:text-hero">
          {{ title }}
        </h1>

        <p data-r style="--i: 2" class="mt-5 max-w-xl text-lg text-pretty text-white/85">
          {{ lead }}
        </p>

        <div data-r style="--i: 3" class="mt-8 flex flex-wrap gap-3">
          <NuxtLink :to="cta.to" class="btn-primary">
            {{ cta.label }}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
              <path d="M1 6h14m0 0-4.5-4.5M15 6l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </NuxtLink>
          <NuxtLink :to="cta2.to" class="inline-flex items-center rounded-btn border border-white/50 px-4.5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#14141a]">
            {{ cta2.label }}
          </NuxtLink>
        </div>

        <ul data-r style="--i: 4" class="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/80">
          <li v-for="(proof, index) in proofs" :key="index" class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ proof.value }}
          </li>
        </ul>
      </div>

      <button
        v-if="!failed"
        type="button"
        class="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 md:top-6 md:right-6"
        :aria-label="playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'"
        @click="toggle"
      >
        <svg v-if="playing" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <rect x="2" y="1" width="3.5" height="12" rx="1" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" />
        </svg>
        <svg v-else width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path d="M3 1.5v11a.8.8 0 0 0 1.2.7l9-5.5a.8.8 0 0 0 0-1.4l-9-5.5A.8.8 0 0 0 3 1.5Z" />
        </svg>
      </button>
    </div>
  </section>
</template>
