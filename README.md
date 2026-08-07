# Site marketing — squelette Nuxt 4

Structure de projet prête à recevoir le contenu. Rendu statique pré-généré (SEO),
CSS natif piloté par des design tokens, aucune dépendance UI externe.

**Le projet est volontairement vide** : les dossiers, les composants et la plomberie
technique sont en place, aucun contenu n'est écrit.

## Démarrer

```bash
npm install
cp .env.example .env   # renseigner les clés
npm run dev            # http://localhost:3000
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (+ pré-rendu) |
| `npm run preview` | Prévisualiser le build |
| `npm run generate` | Export 100 % statique |

## Architecture

```
app/
├── app.vue                 # Racine : <head> global, layout, page
├── error.vue               # Page d'erreur 404 / 500
├── assets/css/             # tokens.css → base.css → utilities.css (via main.css)
├── components/
│   ├── ui/                 # AppButton, AppCard, AppField, AppSection, AppAccordion
│   ├── layout/             # TheHeader, TheFooter, TheMobileMenu, BreadcrumbNav
│   ├── sections/           # Hero, Services, Features, Stats, Testimonials, LogoCloud, FAQ, CTA
│   ├── forms/              # ContactForm, NewsletterForm
│   └── common/             # BrandLogo, SocialLinks, LegalArticle
├── composables/            # useSeo, useStructuredData, useContactForm, useScrollLock
├── config/                 # site.ts (infos entreprise) + navigation.ts (menus) — à remplir
├── data/                   # Contenu local, ou à remplacer par un CMS
├── layouts/                # default (header + footer), minimal (landing pages)
├── middleware/             # Middlewares de route
├── pages/                  # Routes du site (coques vides)
├── plugins/                # analytics.client.ts (chargement conditionnel)
└── utils/                  # Helpers client
server/
├── api/                    # contact.post.ts, newsletter.post.ts
├── routes/                 # sitemap.xml.ts
└── utils/                  # mail.ts, rate-limit.ts
shared/                     # Code partagé client + serveur (alias `#shared`)
├── types/                  # navigation, content, forms
└── utils/                  # validation, format
public/                     # Fichiers servis tels quels (images, favicon, robots.txt)
```

### Routes

| URL | Fichier |
| --- | --- |
| `/` | `app/pages/index.vue` |
| `/services` · `/services/:slug` | `app/pages/services/` |
| `/realisations` · `/realisations/:slug` | `app/pages/realisations/` |
| `/blog` · `/blog/:slug` | `app/pages/blog/` |
| `/a-propos` | `app/pages/a-propos.vue` |
| `/carrieres` | `app/pages/carrieres/index.vue` |
| `/contact` | `app/pages/contact.vue` |
| `/legal/*` | `app/pages/legal/` (mentions, confidentialité, CGV, cookies) |
| `/sitemap.xml` | `server/routes/sitemap.xml.ts` |

## Conventions

- **Infos d'entreprise** : tout est centralisé dans [app/config/site.ts](app/config/site.ts)
  (coordonnées, réseaux, mentions légales) et [app/config/navigation.ts](app/config/navigation.ts) (menus).
  Header, footer, SEO et JSON-LD s'y alimentent — pas de duplication ailleurs.
- **Style** : aucune valeur codée en dur dans les composants, uniquement les variables de
  [app/assets/css/tokens.css](app/assets/css/tokens.css). Le reste vit dans des `<style scoped>`.
- **Composants** : `components: [{ path: '~/components', pathPrefix: false }]` — les sous-dossiers
  organisent le code sans préfixer les noms (`<HeroSection />`, pas `<SectionsHeroSection />`).
  Les noms de fichiers doivent donc rester uniques dans toute l'arborescence.
- **Textes** : les composants de section ne contiennent aucun texte, tout passe en props
  (`<HeroSection title="…" />`). Ils restent réutilisables page après page.
- **SEO** : chaque page appelle `useSeo({ title, description })`, et `useBreadcrumbSchema()`
  pour les pages profondes. Le JSON-LD Organization est posé par le layout par défaut dès que
  `siteConfig` est renseignée.
- **Validation** : une seule source dans [shared/utils/validation.ts](shared/utils/validation.ts),
  utilisée côté client pour l'affichage et rejouée côté serveur pour la sécurité.

## Pour démarrer le contenu

1. Renseigner [app/config/site.ts](app/config/site.ts) et [app/config/navigation.ts](app/config/navigation.ts).
2. Remplir les pages de [app/pages/](app/pages/) en assemblant les composants de `sections/`.
3. Brancher la source de contenu : `app/data/` en local, ou `useAsyncData` vers un CMS
   (Sanity, Nuxt Content, Strapi) pour les services, réalisations et articles.
4. **Envoi d'emails** — [server/utils/mail.ts](server/utils/mail.ts) : choisir le fournisseur
   (Resend, Brevo, Postmark) et renseigner `MAIL_API_KEY`. Sans clé, l'envoi est simulé en
   développement et échoue explicitement en production.
5. **Newsletter** — [server/api/newsletter.post.ts](server/api/newsletter.post.ts) : appel API du fournisseur.
6. **Bandeau cookies** — obligatoire avant d'activer la mesure d'audience
   ([app/plugins/analytics.client.ts](app/plugins/analytics.client.ts)).
7. **Pages légales** — [app/pages/legal/](app/pages/legal/) : contenus à rédiger et faire valider juridiquement.
8. **Images** — à déposer dans `public/images/` (hero, services, équipe, logos, og-default.jpg).
