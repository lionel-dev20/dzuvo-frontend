import { siteConfig } from '~/config/site'

interface SeoOptions {
  title: string
  description?: string
  image?: string
  /** 'website' pour les pages, 'article' pour le blog. */
  type?: 'website' | 'article'
  /** Empêche l'indexation (pages de remerciement, previews…). */
  noindex?: boolean
}

/**
 * Métadonnées SEO d'une page : title, description, Open Graph, Twitter Card
 * et URL canonique. À appeler dans le `<script setup>` de chaque page.
 */
export function useSeo(options: SeoOptions) {
  const route = useRoute()
  const url = `${siteConfig.url}${route.path}`
  const description = options.description ?? siteConfig.description
  const image = `${siteConfig.url}${options.image ?? siteConfig.defaultOgImage}`

  // Tant que `siteConfig.url` n'est pas renseignée, l'URL canonique et les
  // images Open Graph seraient relatives : on ne les émet pas.
  const hasAbsoluteUrls = Boolean(siteConfig.url)

  useSeoMeta({
    title: options.title,
    description,
    ogTitle: options.title,
    ogDescription: description,
    ogImage: hasAbsoluteUrls ? image : undefined,
    ogUrl: hasAbsoluteUrls ? url : undefined,
    ogType: options.type ?? 'website',
    ogSiteName: siteConfig.name,
    ogLocale: siteConfig.locale,
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: description,
    twitterImage: hasAbsoluteUrls ? image : undefined,
    robots: options.noindex ? 'noindex, nofollow' : 'index, follow',
  })

  if (hasAbsoluteUrls) {
    useHead({ link: [{ rel: 'canonical', href: url }] })
  }
}
