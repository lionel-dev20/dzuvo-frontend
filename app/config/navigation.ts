import type { NavItem } from '#shared/types/navigation'

/** Rayons de la boutique — alimentent le méga-menu « Catégories ». */
export const productCategories: NavItem[] = [
  { label: 'Intérieur', to: '/categories/interieur', description: 'Tapis, housses, organiseurs' },
  { label: 'Extérieur', to: '/categories/exterieur', description: 'Déflecteurs, bâches, chrome' },
  { label: 'Électronique', to: '/categories/electronique', description: 'Caméras, GPS, dashcams' },
  { label: 'Entretien', to: '/categories/entretien', description: 'Nettoyants, cires, kits' },
  { label: 'Pièces & filtres', to: '/categories/pieces-et-filtres', description: 'Filtres, essuie-glaces, ampoules' },
  { label: 'Audio & confort', to: '/categories/audio-et-confort', description: 'Enceintes, chargeurs, supports' },
]

/** Navigation principale — header desktop et menu mobile. */
export const mainNavigation: NavItem[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Catégories', to: '/categories', children: productCategories },
  { label: 'Nouveautés', to: '/nouveautes' },
  { label: 'Promos', to: '/promos' },
  { label: 'Contact', to: '/contact' },
]

/** Colonnes du footer. */
export const footerNavigation: { title: string, items: NavItem[] }[] = [
  // { title: 'Entreprise', items: [{ label: 'À propos', to: '/a-propos' }] },
]

/** Appel à l'action affiché dans le header. */
export const headerCta: NavItem | null = { label: 'Créer un compte', to: '/inscription' }
