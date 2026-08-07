/**
 * Villes desservies. Les coordonnées servent au rapprochement géographique
 * quand le visiteur autorise la géolocalisation (voir `useCitySelector`).
 */
export interface City {
  name: string
  lat: number
  lon: number
}

export const deliveryCities: City[] = [
  { name: 'Douala', lat: 4.05, lon: 9.70 },
  { name: 'Yaoundé', lat: 3.87, lon: 11.52 },
  { name: 'Bafoussam', lat: 5.48, lon: 10.42 },
  { name: 'Bamenda', lat: 5.96, lon: 10.15 },
  { name: 'Garoua', lat: 9.30, lon: 13.40 },
  { name: 'Limbé', lat: 4.02, lon: 9.20 },
]

/** Ville retenue quand la géolocalisation est indisponible. */
export const fallbackCity = 'Douala'
