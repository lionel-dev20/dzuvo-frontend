import { siteConfig } from '../../app/config/site'

/**
 * Sitemap XML.
 *
 * Seules les pages qui existent y figurent. Annoncer une adresse qui répond
 * 404 n'attire pas le moteur de recherche : cela lui apprend seulement que ce
 * plan de site n'est pas fiable. Les pages du squelette (services,
 * réalisations, mentions légales…) y reviendront une fois écrites.
 */
const staticRoutes: { path: string, priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/categories', priority: 0.9 },
  { path: '/contact', priority: 0.8 },
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
