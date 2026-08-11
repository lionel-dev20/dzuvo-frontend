import type { ShippingMethod } from '#shared/types/checkout'
import { fetchShippingZones, isConfigured } from './woocommerce'

/**
 * Méthodes de livraison proposées à la commande.
 *
 * Elles viennent des zones WooCommerce : c'est là que le marchand fixe ses
 * tarifs, et la commande doit refléter la boutique. Tant qu'aucune zone n'est
 * configurée — c'est le cas aujourd'hui — on sert une méthode standard
 * gratuite pour ne pas bloquer la commande.
 */

export const DEFAULT_SHIPPING: ShippingMethod = {
  id: 'standard',
  label: 'Livraison standard',
  description: 'Expédition sous 2 à 5 jours ouvrables',
  cost: 0,
}

/** Coût d'une méthode WooCommerce. Les formules ne sont pas interprétées. */
function methodCost(settings: Record<string, { value?: string }> | undefined) {
  const raw = settings?.cost?.value ?? ''
  const value = Number(raw)
  // WooCommerce autorise des formules (« 10 + 2 * [qty] ») : non évaluables ici.
  return Number.isFinite(value) ? value : 0
}

/**
 * Zones applicables à une adresse. WooCommerce range les zones par ordre de
 * priorité et la première qui correspond l'emporte ; la zone 0 (« reste du
 * monde ») ne sert que si aucune autre ne convient.
 */
export async function shippingMethodsFor(country: string, state: string): Promise<ShippingMethod[]> {
  if (!isConfigured()) return [DEFAULT_SHIPPING]

  let zones
  try {
    zones = await fetchShippingZones()
  }
  catch (error) {
    console.error('[shipping] zones indisponibles, méthode par défaut', error)
    return [DEFAULT_SHIPPING]
  }

  const target = `${country}:${state}`.toUpperCase()

  const matching = zones.filter(zone => zone.id !== 0 && zone.locations.some((location) => {
    const code = location.code.toUpperCase()
    if (location.type === 'country') return code === country.toUpperCase()
    if (location.type === 'state') return code === target
    return false
  }))

  // Aucune zone nominative : WooCommerce retombe sur « reste du monde ».
  const applicable = matching.length ? matching : zones.filter(zone => zone.id === 0)

  const methods = applicable.flatMap(zone =>
    zone.methods
      .filter(method => method.enabled)
      .map<ShippingMethod>(method => ({
        id: `${method.method_id}:${method.instance_id}`,
        label: method.title || method.method_title,
        description: zone.name,
        cost: method.method_id === 'free_shipping' ? 0 : methodCost(method.settings),
      })),
  )

  return methods.length ? methods : [DEFAULT_SHIPPING]
}

/** Retrouve la méthode choisie, en refusant tout identifiant non proposé. */
export function resolveShipping(methods: ShippingMethod[], id: string) {
  return methods.find(method => method.id === id) ?? null
}
