import { deliveryCities, fallbackCity } from '~/config/cities'

const STORAGE_KEY = 'dzuvo-city'

/** Ville la plus proche des coordonnées, au carré de la distance (suffisant à cette échelle). */
function nearestCity(lat: number, lon: number): string {
  let best = fallbackCity
  let shortest = Number.POSITIVE_INFINITY

  for (const city of deliveryCities) {
    const distance = (city.lat - lat) ** 2 + (city.lon - lon) ** 2
    if (distance < shortest) {
      shortest = distance
      best = city.name
    }
  }

  return best
}

/**
 * Ville de livraison choisie par le visiteur. L'état est partagé entre le
 * header et le menu mobile, et persisté dans le localStorage.
 */
export function useCitySelector() {
  const city = useState<string | null>('dzuvo:city', () => null)
  const locating = useState('dzuvo:city-locating', () => false)

  // Le rendu est pré-généré : on ne lit le stockage qu'une fois hydraté.
  onMounted(() => {
    if (city.value === null) city.value = localStorage.getItem(STORAGE_KEY)
  })

  function select(name: string) {
    city.value = name
    locating.value = false
    localStorage.setItem(STORAGE_KEY, name)
  }

  function detect() {
    if (!navigator.geolocation) {
      select(fallbackCity)
      return
    }

    locating.value = true
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => select(nearestCity(coords.latitude, coords.longitude)),
      () => { locating.value = false },
    )
  }

  const label = computed(() => {
    if (locating.value) return 'Localisation…'
    return city.value ?? 'Choisir ma ville'
  })

  const detectLabel = computed(() => (locating.value ? 'Détection en cours…' : 'Détecter ma position'))

  return { city, locating, label, detectLabel, cities: deliveryCities, select, detect }
}
