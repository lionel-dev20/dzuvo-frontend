/**
 * Source de vérité pour toutes les informations d'entreprise.
 * Renseigner ici : le header, le footer, le SEO et les données structurées
 * JSON-LD s'alimentent de ce fichier.
 *
 * Ce fichier est public : il part dans le paquet servi au navigateur. Rien
 * d'interne n'y a sa place — ni date de naissance, ni pièce d'identité, ni
 * adresse personnelle. Les coordonnées qui reçoivent du courrier (destinataire
 * du formulaire de contact) vivent dans les variables d'environnement, côté
 * serveur.
 */
export const siteConfig = {
  name: 'DZUVO',
  legalName: 'DZUVO Inc.',
  tagline: 'Pièces auto et accessoires, livrés partout au Canada',
  description: 'DZUVO Inc. — pièces auto et accessoires compatibles toutes marques, livrés partout au Canada depuis Saint-Georges, au Québec.',
  url: 'https://dzuvo.com',
  locale: 'fr-CA',
  defaultOgImage: '/images/og-default.jpg',

  contact: {
    /*
     * Adresse affichée au public (pied de page, page de contact). Elle est
     * distincte de l'adresse qui reçoit les messages du formulaire, réglée par
     * NUXT_CONTACT_RECIPIENT : une adresse de service se change sans toucher au
     * code, et l'adresse personnelle du dirigeant n'a pas à être publiée.
     */
    email: 'info@dzuvo.ca',
    phone: '+1 581 996 4725',
    address: {
      street: '1728, 23e Avenue',
      /* À confirmer : « G5Z 2NT » n'est pas un code postal canadien valide —
         le dernier caractère doit être un chiffre. Probablement « G5Z 2N7 ». */
      postalCode: 'G5Z 2NT',
      city: 'Saint-Georges',
      region: 'QC',
      country: 'Canada',
    },
    openingHours: '',
  },

  /** { label: 'LinkedIn', href: 'https://…' } */
  social: [] as { label: string, href: string }[],

  /**
   * Mentions légales. Vocabulaire canadien : au Québec, une société par actions
   * porte un NEQ (numéro d'entreprise du Québec) et non un SIRET.
   */
  legal: {
    /** Société par actions, société en nom collectif… */
    form: 'Société par actions (Inc.)',
    /** À compléter dès réception des documents d'incorporation. */
    neq: '',
    /** Numéros de taxes, une fois l'inscription faite. */
    gstQst: '',
    director: 'Dzuguem M. Chancelin',
    /** Actionnaire unique, 100 % des parts. */
    owner: 'Dzuguem M. Chancelin',
    /** Hébergeur du site, à renseigner avant publication des mentions légales. */
    host: '',
  },
}

export type SiteConfig = typeof siteConfig
