/**
 * Source de vérité pour toutes les informations d'entreprise.
 * Renseigner ici : le header, le footer, le SEO et les données structurées
 * JSON-LD s'alimentent de ce fichier.
 */
export const siteConfig = {
  name: 'DZUVO',
  legalName: '',
  tagline: 'Pièces auto et accessoires, livrés partout au Canada',
  description: '',
  url: '',
  locale: 'fr-CA',
  defaultOgImage: '/images/og-default.jpg',

  contact: {
    email: 'info@dzuvo.ca',
    phone: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: '',
    },
    openingHours: '',
  },

  /** { label: 'LinkedIn', href: 'https://…' } */
  social: [] as { label: string, href: string }[],

  legal: {
    siret: '',
    vat: '',
    capital: '',
    director: '',
    host: '',
  },
}

export type SiteConfig = typeof siteConfig
