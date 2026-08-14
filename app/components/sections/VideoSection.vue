<script setup lang="ts">
/**
 * Bandeau vidéo. Le cadre grandit à mesure que la section traverse l'écran,
 * atteint sa taille pleine quand elle est centrée, puis rétrécit à nouveau —
 * le tout piloté par le scroll (`scrub`), sans durée propre.
 *
 * La lecture démarre dès que la section entre dans le viewport et se met en
 * pause dès qu'elle en sort : rien ne tourne hors écran.
 */
const PLAYBACK_RATE = 2

// Fichier et accroche réglés dans « Page d'accueil > Titres et textes ».
const { text } = useHomeContent()
const videoSrc = text('videoSrc', '/videos/dzuvo-presentation.mp4')
const videoTitle = text('videoTitle', 'Des pièces')
const videoTitleAccent = text('videoTitleAccent', 'de confiance')

const root = useTemplateRef<HTMLElement>('root')
const frame = useTemplateRef<HTMLElement>('frame')
const player = useTemplateRef<HTMLVideoElement>('player')

/** Sans animation : pas de lecture automatique, on rend la main au visiteur. */
const reducedMotion = ref(false)
const unavailable = ref(false)

function start() {
  const video = player.value
  if (!video) return
  video.playbackRate = PLAYBACK_RATE
  video.play().catch(() => { unavailable.value = true })
}

function stop() {
  player.value?.pause()
}

onMounted(async () => {
  if (!root.value || !frame.value) return

  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion.value) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  const context = gsap.context(() => {
    // scrub légèrement amorti : le cadre suit le scroll sans à-coups.
    gsap.timeline({
      scrollTrigger: {
        trigger: root.value,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    })
      .fromTo(
        frame.value,
        { scale: 0.76, opacity: 0.55 },
        { scale: 1, opacity: 1, ease: 'power1.out' },
      )
      .to(frame.value, { scale: 0.76, opacity: 0.55, ease: 'power1.in' })

    // Lecture calée sur la présence à l'écran, dans les deux sens de scroll.
    ScrollTrigger.create({
      trigger: root.value,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: start,
      onEnterBack: start,
      onLeave: stop,
      onLeaveBack: stop,
    })
  }, root.value)

  onBeforeUnmount(() => context.revert())
})
</script>

<template>
  <section ref="root" class="px-2.5 md:px-5 lg:px-24" aria-label="DZUVO en vidéo">
    <div
      ref="frame"
      class="relative aspect-video w-full origin-center overflow-hidden rounded-2xl bg-primary will-change-transform"
    >
      <!-- Affiche de repli : visible tant que la vidéo n'a pas pris le dessus. -->
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <img src="/images/logos/dzuvo.png" alt="DZUVO" width="120" height="120" class="h-20 w-auto md:h-28">
        <p class="text-h3 font-bold text-tertiary-50 uppercase">
          {{ videoTitle }} <span class="text-secondary">{{ videoTitleAccent }}</span>
        </p>
        <p v-if="unavailable" class="text-body text-tertiary-800">
          La vidéo n’est pas encore disponible.
        </p>
      </div>

      <video
        v-show="!unavailable"
        ref="player"
        class="relative size-full object-cover"
        :src="videoSrc"
        muted
        loop
        playsinline
        preload="metadata"
        :controls="reducedMotion"
        aria-label="Présentation DZUVO"
        @error="unavailable = true"
      />
    </div>
  </section>
</template>
