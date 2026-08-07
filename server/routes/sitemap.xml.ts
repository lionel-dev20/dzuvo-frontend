import { siteConfig } from '../../app/config/site'

/**
 * Sitemap XML. Les pages statiques sont listées ici ; les pages dynamiques
 * (services, réalisations, articles) sont à ajouter depuis la source de contenu.
 */
const staticRoutes: { path: string, priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/services', priority: 0.9 },
  { path: '/realisations', priority: 0.9 },
  { path: '/a-propos', priority: 0.7 },
  { path: '/blog', priority: 0.7 },
  { path: '/carrieres', priority: 0.6 },
  { path: '/contact', priority: 0.8 },
  { path: '/legal/mentions-legales', priority: 0.2 },
  { path: '/legal/politique-de-confidentialite', priority: 0.2 },
  { path: '/legal/conditions-generales', priority: 0.2 },
  { path: '/legal/cookies', priority: 0.2 },
]

export default defineEventHandler((event) => {
  // TODO: concaténer ici les routes dynamiques issues du CMS.
  const routes = [...staticRoutes]

  const urls = routes
    .map(route => `  <url>\n    <loc>${siteConfig.url}${route.path}</loc>\n    <priority>${route.priority}</priority>\n  </url>`)
    .join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
