/**
 * Villes desservies — source unique.
 *
 * Un seul fichier alimente tout ce qui parle de villes : le sélecteur du
 * header, la carte de livraison de l'accueil, le formulaire de commande et sa
 * validation, côté navigateur comme côté serveur. Ajouter une ville ici la
 * rend disponible partout, sans rien recopier ailleurs.
 *
 * Il vit dans `shared/` et non dans `app/config/` parce que le serveur en a
 * besoin : c'est lui qui rejoue la validation de l'adresse, et il ne peut pas
 * le faire s'il ignore quelles villes et quels quartiers existent.
 */
export interface City {
  /** Identifiant stable, aussi utilisé par la carte de livraison. */
  id: string
  name: string
  /** Code de province canadienne — évite de redemander la province au visiteur. */
  province: string
  /** Coordonnées réelles, pour le rapprochement géographique (`useCitySelector`). */
  lat: number
  lon: number
  /** Quartiers et arrondissements desservis, dans l'ordre d'affichage. */
  districts: string[]
}

/* D'ouest en est : l'ordre est repris tel quel par la carte de livraison. */
export const deliveryCities: City[] = [
  {
    id: 'vancouver',
    name: 'Vancouver',
    province: 'BC',
    lat: 49.28,
    lon: -123.12,
    districts: ['Centre-ville', 'West End', 'Yaletown', 'Kitsilano', 'Mount Pleasant', 'Grandview-Woodland', 'Kerrisdale', 'Marpole'],
  },
  {
    id: 'calgary',
    name: 'Calgary',
    province: 'AB',
    lat: 51.05,
    lon: -114.07,
    districts: ['Centre-ville', 'Beltline', 'Kensington', 'Bridgeland', 'Inglewood', 'Marda Loop', 'Bowness'],
  },
  {
    id: 'edmonton',
    name: 'Edmonton',
    province: 'AB',
    lat: 53.55,
    lon: -113.49,
    districts: ['Centre-ville', 'Oliver', 'Old Strathcona', 'Bonnie Doon', 'Mill Woods', 'Windermere', 'Griesbach'],
  },
  {
    id: 'saskatoon',
    name: 'Saskatoon',
    province: 'SK',
    lat: 52.13,
    lon: -106.67,
    districts: ['Centre-ville', 'Nutana', 'Riversdale', 'City Park', 'Sutherland', 'Stonebridge', 'Lawson Heights'],
  },
  {
    id: 'winnipeg',
    name: 'Winnipeg',
    province: 'MB',
    lat: 49.90,
    lon: -97.14,
    districts: ['Centre-ville', 'Saint-Boniface', 'Osborne Village', 'River Heights', 'Transcona', 'Charleswood', 'Saint-Vital'],
  },
  {
    id: 'toronto',
    name: 'Toronto',
    province: 'ON',
    lat: 43.65,
    lon: -79.38,
    districts: ['Centre-ville', 'North York', 'Scarborough', 'Etobicoke', 'East York', 'York', 'The Beaches'],
  },
  {
    id: 'ottawa',
    name: 'Ottawa',
    province: 'ON',
    lat: 45.42,
    lon: -75.70,
    districts: ['Centre-ville', 'Vanier', 'Nepean', 'Kanata', 'Orléans', 'Gloucester', 'Barrhaven'],
  },
  {
    id: 'montreal',
    name: 'Montréal',
    province: 'QC',
    lat: 45.51,
    lon: -73.57,
    districts: [
      'Ville-Marie',
      'Le Plateau-Mont-Royal',
      'Rosemont–La Petite-Patrie',
      'Villeray–Saint-Michel–Parc-Extension',
      'Côte-des-Neiges–Notre-Dame-de-Grâce',
      'Mercier–Hochelaga-Maisonneuve',
      'Ahuntsic-Cartierville',
      'Saint-Laurent',
      'Verdun',
      'LaSalle',
    ],
  },
  {
    id: 'quebec',
    name: 'Québec',
    province: 'QC',
    lat: 46.81,
    lon: -71.21,
    districts: ['La Cité-Limoilou', 'Sainte-Foy–Sillery–Cap-Rouge', 'Les Rivières', 'Charlesbourg', 'Beauport', 'La Haute-Saint-Charles'],
  },
  {
    id: 'halifax',
    name: 'Halifax',
    province: 'NS',
    lat: 44.65,
    lon: -63.58,
    districts: ['Centre-ville', 'North End', 'South End', 'Dartmouth', 'Bedford', 'Clayton Park'],
  },
  {
    id: 'st-johns',
    name: 'St. John’s',
    province: 'NL',
    lat: 47.56,
    lon: -52.71,
    districts: ['Centre-ville', 'Georgestown', 'Churchill Square', 'The Battery', 'Kenmount', 'Mount Pearl'],
  },
  {
    id: 'yellowknife',
    name: 'Yellowknife',
    province: 'NT',
    lat: 62.45,
    lon: -114.37,
    districts: ['Vieille ville', 'Centre-ville', 'Frame Lake', 'Range Lake', 'Niven Lake'],
  },
]

/** Ville retenue quand la géolocalisation est indisponible ou refusée. */
export const fallbackCity = 'Montréal'

/** Ville desservie portant ce nom, ou `null` si elle n'est pas au catalogue. */
export function findCity(name: string | null | undefined): City | null {
  if (!name) return null
  const needle = name.trim().toLowerCase()
  return deliveryCities.find(city => city.name.toLowerCase() === needle) ?? null
}
