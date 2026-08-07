// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  // Les sous-dossiers de components/ organisent le code sans préfixer les noms :
  // components/sections/HeroSection.vue s'utilise <HeroSection /> (noms de
  // fichiers à garder uniques sur l'ensemble de l'arborescence).
  components: [{ path: '~/components', pathPrefix: false }],

  // Variables privées (serveur uniquement) et publiques.
  // Nuxt n'injecte que les variables préfixées NUXT_ : `wooBaseUrl` se règle
  // par NUXT_WOO_BASE_URL, pas WOO_BASE_URL.
  runtimeConfig: {
    mailApiKey: '', // NUXT_MAIL_API_KEY
    mailFrom: '', // NUXT_MAIL_FROM
    contactRecipient: '', // NUXT_CONTACT_RECIPIENT
    newsletterApiKey: '', // NUXT_NEWSLETTER_API_KEY
    newsletterListId: '', // NUXT_NEWSLETTER_LIST_ID

    // WooCommerce headless. Les clés restent côté serveur : le catalogue
    // transite par /api/catalog/*, jamais en direct depuis le navigateur.
    wooBaseUrl: '', // NUXT_WOO_BASE_URL — ex. https://boutique.dzuvo.ca
    wooConsumerKey: '', // NUXT_WOO_CONSUMER_KEY
    wooConsumerSecret: '', // NUXT_WOO_CONSUMER_SECRET
    public: {
      siteUrl: '', // NUXT_PUBLIC_SITE_URL
      analyticsId: '', // NUXT_PUBLIC_ANALYTICS_ID
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#030014' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap',
        },
      ],
    },
  },

  // Pré-rendu : pages instantanées et bon SEO sur un site majoritairement statique.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml'],
      // Routes liées depuis la home dont la page reste à écrire.
      ignore: [
        '/nouveautes', '/promos', '/compte', '/panier', '/mot-de-passe-oublie',
        '/professionnels', '/contact', '/blog',
        // Catalogue : servi en SSR. Prix, stocks et rubriques viennent de
        // WooCommerce et changent sans rebuild — les figer les périmerait.
        '/produits', '/categories',
        '/livraison', '/paiement', '/financement', '/garantie', '/engagements',
        '/suivi-commande', '/fidelite', '/avis', '/actualites', '/consigne',
        '/securite-produits', '/legal',
      ],
    },
  },

  typescript: {
    strict: true,
  },
})
