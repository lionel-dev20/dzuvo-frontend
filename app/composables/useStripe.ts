/**
 * Chargement de Stripe.js.
 *
 * Le script doit venir de js.stripe.com et de nulle part ailleurs : l'héberger
 * soi-même ferait sortir le site du périmètre PCI SAQ-A, puisque c'est lui qui
 * isole les champs de carte dans des iframes appartenant à Stripe.
 */

const STRIPE_JS = 'https://js.stripe.com/v3/'

/* eslint-disable-next-line ts/no-explicit-any */
type StripeGlobal = any

let loader: Promise<StripeGlobal> | null = null

export function loadStripeJs(): Promise<StripeGlobal> {
  if (import.meta.server) return Promise.resolve(null)

  const existing = (window as unknown as { Stripe?: StripeGlobal }).Stripe
  if (existing) return Promise.resolve(existing)

  // Un seul chargement, même si plusieurs composants le demandent.
  loader ??= new Promise((resolve, reject) => {
    const previous = document.querySelector<HTMLScriptElement>(`script[src="${STRIPE_JS}"]`)
    const script = previous ?? document.createElement('script')

    script.addEventListener('load', () => {
      const stripe = (window as unknown as { Stripe?: StripeGlobal }).Stripe
      stripe ? resolve(stripe) : reject(new Error('Stripe.js chargé mais indisponible'))
    })
    script.addEventListener('error', () => {
      loader = null
      reject(new Error('Stripe.js n’a pas pu être chargé'))
    })

    if (!previous) {
      script.src = STRIPE_JS
      script.async = true
      document.head.appendChild(script)
    }
  })

  return loader
}

/**
 * Couleurs des champs de carte.
 *
 * Les champs vivent dans une iframe appartenant à Stripe : aucune feuille de
 * style du site ne les atteint, et seule cette API permet de les accorder à la
 * charte.
 *
 * Les valeurs sont **lues sur le document** plutôt qu'écrites ici. C'est ce qui
 * manquait : l'habillage était figé sur le thème sombre — fond #030014, texte
 * blanc — alors que le tunnel de commande s'affiche en thème clair. Les champs
 * sortaient donc en noir sur une carte blanche, seule zone de la page à ne pas
 * suivre le thème, précisément parce qu'elle échappe à la cascade CSS.
 *
 * Passer par `getComputedStyle` remet l'iframe dans le même système que le
 * reste du site : les jetons de `tokens.css` font foi, et un basculement de
 * thème est suivi sans qu'aucune valeur ne soit recopiée ici.
 *
 * Seul le **texte** est habillé de la sorte. Le cadre, le fond et l'espacement
 * viennent du conteneur, qui porte l'utilitaire `field` comme n'importe quel
 * autre champ du formulaire — c'est ce qui garantit que la carte ressemble au
 * reste du tunnel plutôt qu'à un greffon.
 */
export function stripeCardStyle() {
  const css = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback

  const ink = token('--color-tertiary-50', '#0d0d14')
  const muted = token('--color-tertiary-800', '#6e6e78')
  const danger = token('--color-secondary', '#f70205')

  return {
    base: {
      color: ink,
      fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      fontSize: '15px',
      fontSmoothing: 'antialiased',
      iconColor: muted,
      '::placeholder': { color: muted },
    },
    invalid: {
      color: danger,
      iconColor: danger,
    },
  }
}
