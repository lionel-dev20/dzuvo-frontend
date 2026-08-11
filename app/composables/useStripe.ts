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
 * Habillage des champs Stripe aux couleurs du site. Les champs de carte vivent
 * dans une iframe : seule cette API permet de les accorder à la charte.
 */
export function stripeAppearance() {
  return {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#f70205',
      colorBackground: '#030014',
      colorText: '#fefffd',
      colorTextSecondary: '#8c8c8b',
      colorTextPlaceholder: '#6b6b6a',
      colorDanger: '#f70205',
      fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      fontSizeBase: '15px',
      borderRadius: '12px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid rgba(254, 255, 253, 0.14)',
        boxShadow: 'none',
        padding: '12px 16px',
      },
      '.Input:focus': {
        border: '1px solid #f70205',
        boxShadow: 'none',
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '6px',
      },
    },
  }
}
