import type { Ref } from 'vue'

/**
 * Fait monter les éléments `[data-reveal]` à l'entrée dans le viewport, et
 * rejoue l'animation à l'envers quand on remonte — d'où `toggleActions` plutôt
 * qu'un simple `once`.
 *
 * L'état initial n'est appliqué qu'après hydratation : sans JS, ou si le
 * visiteur a demandé moins d'animations, le contenu reste simplement visible.
 */
export function useScrollReveal(
  root: Ref<HTMLElement | null>,
  options: { y?: number, stagger?: number, start?: string } = {},
) {
  /*
   * `start` par défaut : le bloc se révèle un peu avant d'être pleinement à
   * l'écran. Un élément situé en toute fin de page n'atteint jamais ce seuil —
   * le scroll bute avant — d'où l'option, à régler sur « top bottom » pour lui.
   */
  const { y = 56, stagger = 0.09, start = 'top 85%' } = options

  onMounted(async () => {
    if (!root.value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { gsap } = await import('gsap')
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    const context = gsap.context(() => {
      // Chaque groupe s'anime indépendamment : les cartes du bas ne partent pas
      // avant d'être approchées.
      gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
        gsap.from(group.querySelectorAll('[data-reveal]'), {
          y,
          autoAlpha: 0,
          duration: 0.7,
          stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: group,
            start,
            toggleActions: 'play none none reverse',
          },
        })
      })
    }, root.value)

    // Les images en chargement différé rallongent la page : sans ce recalcul,
    // les points de déclenchement restent calés sur une hauteur périmée.
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
    }

    onBeforeUnmount(() => context.revert())
  })
}
