<script setup lang="ts">
/**
 * Rubans lumineux animés en fond de section. Le SVG est rendu côté serveur
 * (donc visible sans JS) ; GSAP ne prend le relais qu'après hydratation et
 * reste silencieux si le visiteur a demandé moins d'animations.
 */
const root = useTemplateRef<HTMLElement>('root')

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  const context = gsap.context(() => {
    // Dérive lente et désynchronisée de chaque ruban.
    gsap.utils.toArray<SVGGElement>('[data-ribbon]').forEach((ribbon, index) => {
      gsap.to(ribbon, {
        xPercent: gsap.utils.random(-7, 7),
        yPercent: gsap.utils.random(-6, 6),
        rotation: gsap.utils.random(-2, 2),
        scaleY: gsap.utils.random(0.9, 1.15),
        transformOrigin: '50% 50%',
        duration: 6.5 + index * 1.4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    })

    // La lumière court le long des rubans en déplaçant les dégradés.
    gsap.utils.toArray<SVGLinearGradientElement>('[data-flow]').forEach((gradient, index) => {
      gsap.fromTo(
        gradient,
        { attr: { x1: -0.6, x2: 0.4 } },
        {
          attr: { x1: 1, x2: 2 },
          duration: 5 + index * 1.6,
          ease: 'none',
          repeat: -1,
        },
      )
    })

    // Respiration des halos : opacité seule, sans coût de recomposition.
    gsap.to('[data-halo]', {
      opacity: 0.75,
      scale: 1.08,
      transformOrigin: '50% 50%',
      duration: 4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: 1.1,
    })

    // Parallaxe : le fond défile plus lentement que le contenu.
    gsap.to('[data-parallax]', {
      yPercent: 16,
      ease: 'none',
      scrollTrigger: {
        trigger: root.value,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, root.value!)

  onBeforeUnmount(() => context.revert())
})
</script>

<template>
  <div ref="root" class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <svg
      data-parallax
      class="absolute inset-0 size-full will-change-transform"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="fb-flow-1" data-flow x1="-0.6" y1="0" x2="0.4" y2="0">
          <stop offset="0%" stop-color="#560102" stop-opacity="0" />
          <stop offset="30%" stop-color="#b90204" stop-opacity="0.75" />
          <stop offset="55%" stop-color="#f70205" />
          <stop offset="78%" stop-color="#fdb1b2" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#560102" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="fb-flow-2" data-flow x1="-0.6" y1="0" x2="0.4" y2="0">
          <stop offset="0%" stop-color="#6f0102" stop-opacity="0" />
          <stop offset="40%" stop-color="#c60204" stop-opacity="0.8" />
          <stop offset="68%" stop-color="#f70205" />
          <stop offset="100%" stop-color="#560102" stop-opacity="0" />
        </linearGradient>

        <linearGradient id="fb-flow-3" data-flow x1="-0.6" y1="0" x2="0.4" y2="0">
          <stop offset="0%" stop-color="#940103" stop-opacity="0" />
          <stop offset="45%" stop-color="#de0205" stop-opacity="0.85" />
          <stop offset="70%" stop-color="#fdb1b2" />
          <stop offset="100%" stop-color="#6f0102" stop-opacity="0" />
        </linearGradient>

        <radialGradient id="fb-halo-warm">
          <stop offset="0%" stop-color="#f70205" stop-opacity="0.5" />
          <stop offset="55%" stop-color="#b90204" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#560102" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="fb-halo-deep">
          <stop offset="0%" stop-color="#de0205" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#030014" stop-opacity="0" />
        </radialGradient>

        <!-- Trois niveaux de netteté : le contraste entre l'arête vive et la
             lueur large est ce qui donne l'effet « filament lumineux ». -->
        <filter id="fb-crisp" x="-25%" y="-200%" width="150%" height="500%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>

        <filter id="fb-soft" x="-25%" y="-160%" width="150%" height="420%">
          <feGaussianBlur stdDeviation="9" />
        </filter>

        <filter id="fb-wide" x="-25%" y="-200%" width="150%" height="500%">
          <feGaussianBlur stdDeviation="58" />
        </filter>
      </defs>

      <!-- Nappes de lumière diffuses -->
      <ellipse data-halo cx="1180" cy="300" rx="480" ry="330" fill="url(#fb-halo-warm)" opacity="0.32" />
      <ellipse data-halo cx="240" cy="700" rx="420" ry="270" fill="url(#fb-halo-deep)" opacity="0.28" />

      <!-- Couche 1 — lueur large diffusée sous les tracés -->
      <g filter="url(#fb-wide)" opacity="0.5">
        <g data-ribbon>
          <path d="M-300 620C120 400 380 760 760 560S1240 300 1780 420" fill="none" stroke="url(#fb-flow-1)" stroke-width="130" stroke-linecap="round" />
        </g>
        <g data-ribbon>
          <path d="M-300 820C260 700 520 960 900 780S1360 560 1780 700" fill="none" stroke="url(#fb-flow-2)" stroke-width="160" stroke-linecap="round" />
        </g>
      </g>

      <!-- Couche 2 — rubans intermédiaires -->
      <g filter="url(#fb-soft)">
        <g data-ribbon>
          <path d="M-300 560C160 340 440 700 840 500S1300 240 1780 360" fill="none" stroke="url(#fb-flow-1)" stroke-width="34" stroke-linecap="round" />
        </g>
        <g data-ribbon>
          <path d="M-300 740C200 620 460 880 860 720S1320 500 1780 620" fill="none" stroke="url(#fb-flow-2)" stroke-width="26" stroke-linecap="round" />
        </g>
        <g data-ribbon>
          <path d="M-300 400C240 220 560 540 960 320S1380 80 1780 220" fill="none" stroke="url(#fb-flow-3)" stroke-width="20" stroke-linecap="round" />
        </g>
      </g>

      <!-- Couche 3 — arêtes vives : ce sont elles qui « dessinent » la lumière -->
      <g filter="url(#fb-crisp)">
        <g data-ribbon>
          <path d="M-300 560C160 340 440 700 840 500S1300 240 1780 360" fill="none" stroke="url(#fb-flow-1)" stroke-width="4" stroke-linecap="round" />
        </g>
        <g data-ribbon>
          <path d="M-300 588C160 368 440 728 840 528S1300 268 1780 388" fill="none" stroke="url(#fb-flow-3)" stroke-width="2.5" stroke-linecap="round" opacity="0.9" />
        </g>
        <g data-ribbon>
          <path d="M-300 400C240 220 560 540 960 320S1380 80 1780 220" fill="none" stroke="url(#fb-flow-3)" stroke-width="3" stroke-linecap="round" />
        </g>
        <g data-ribbon>
          <path d="M-300 740C200 620 460 880 860 720S1320 500 1780 620" fill="none" stroke="url(#fb-flow-2)" stroke-width="3.5" stroke-linecap="round" />
        </g>
        <g data-ribbon>
          <path d="M-300 700C200 576 460 844 860 676S1320 452 1780 576" fill="none" stroke="url(#fb-flow-1)" stroke-width="2" stroke-linecap="round" opacity="0.8" />
        </g>
      </g>
    </svg>

    <!-- Fondu vers le fond de page : le décor s'éteint avant la section suivante. -->
    <div class="absolute inset-x-0 bottom-0 h-56 bg-linear-to-b from-transparent to-primary-darker" />
  </div>
</template>
