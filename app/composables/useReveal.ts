import type { Ref } from 'vue'

/**
 * Révèle les éléments `[data-r]` du bloc à leur entrée dans l'écran.
 *
 * Contrairement à `useScrollReveal` (GSAP + ScrollTrigger), les points de
 * déclenchement ne sont pas figés à la création : un `IntersectionObserver`
 * réagit à ce qui est réellement à l'écran, quelle que soit la hauteur que la
 * page prend après coup. Aucun bloc ne reste masqué par un calcul périmé.
 *
 * `--i` décale les éléments d'un même groupe : `style="--i: 2"`.
 */
export function useReveal(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    const element = root.value
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        observer?.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })

    element.querySelectorAll('[data-r]').forEach(target => observer!.observe(target))
    // Armé après l'observation : le premier écran n'est jamais masqué plus
    // d'une image avant d'être révélé.
    element.setAttribute('data-armed', '')
  })

  onBeforeUnmount(() => observer?.disconnect())
}
