import { siteConfig } from '~/config/site'

/**
 * Données structurées JSON-LD (schema.org) — améliore l'affichage dans les
 * résultats de recherche. `useOrganizationSchema()` est posé une fois dans le
 * layout par défaut ; les autres sont appelés par page.
 */
export function useOrganizationSchema() {
  // Rien à publier tant que la fiche entreprise n'est pas renseignée.
  if (!siteConfig.legalName || !siteConfig.url) return

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': siteConfig.legalName,
    'url': siteConfig.url,
    'logo': `${siteConfig.url}/images/logo.png`,
    'description': siteConfig.description,
    'email': siteConfig.contact.email,
    'telephone': siteConfig.contact.phone,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': siteConfig.contact.address.street,
      'postalCode': siteConfig.contact.address.postalCode,
      'addressLocality': siteConfig.contact.address.city,
      'addressRegion': siteConfig.contact.address.region,
      'addressCountry': siteConfig.contact.address.country,
    },
    'sameAs': siteConfig.social.map(s => s.href),
  })
}

export function useBreadcrumbSchema(items: { name: string, path: string }[]) {
  // Sans URL de site, les `item` seraient des chemins relatifs : schema.org
  // les attend absolus, autant ne rien publier.
  if (!siteConfig.url) return

  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `${siteConfig.url}${item.path}`,
    })),
  })
}

export function useFaqSchema(faq: { question: string, answer: string }[]) {
  useJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faq.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
    })),
  })
}

/**
 * Injecte un bloc <script type="application/ld+json">.
 *
 * `JSON.stringify` n'échappe pas `<` : une valeur contenant `</script>`
 * refermerait la balise et tout ce qui suit deviendrait du HTML exécutable.
 * Aujourd'hui les données viennent d'un fichier de configuration, donc rien ne
 * peut arriver — mais le jour où un nom de produit venu de WooCommerce entre
 * ici, ce qui est l'usage normal de schema.org, le nom devient une porte
 * d'entrée. On échappe donc à la source plutôt que de compter sur ce que ces
 * données seront demain.
 */
function useJsonLd(data: Record<string, unknown>) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  useHead({
    script: [{ type: 'application/ld+json', innerHTML: json }],
  })
}
