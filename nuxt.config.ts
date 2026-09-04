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

    // Stripe. La clé secrète encaisse : elle ne quitte jamais le serveur.
    // Le numéro de carte, lui, part du navigateur directement chez Stripe
    // (Elements) — il ne transite jamais par ce site.
    stripeSecretKey: '', // NUXT_STRIPE_SECRET_KEY — sk_test_… puis sk_live_…
    stripeWebhookSecret: '', // NUXT_STRIPE_WEBHOOK_SECRET — whsec_…
    /** Hôte de l'API Stripe. À ne surcharger que pour tester contre un double. */
    stripeApiHost: '', // NUXT_STRIPE_API_HOST

    /*
     * Laissez-passer de la purge de cache (/api/revalidate), que WordPress
     * présente à chaque publication. Vide, la purge est refusée : mieux vaut
     * un cache qui expire tout seul qu'une adresse publique capable de le
     * vider en boucle.
     */
    revalidateSecret: '', // NUXT_REVALIDATE_SECRET
    public: {
      siteUrl: '', // NUXT_PUBLIC_SITE_URL
      analyticsId: '', // NUXT_PUBLIC_ANALYTICS_ID
      stripePublishableKey: '', // NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — pk_test_…
    },
  },

  app: {
    /*
     * Transition de page SANS `mode: 'out-in'`.
     *
     * Avec `out-in`, quitter l'accueil laissait un <main> vide : la page
     * demandée n'était jamais insérée, et seul un rechargement l'affichait.
     * En cause, la rencontre de trois choses : le <Suspense> que Nuxt place
     * autour de chaque page, des pages qui attendent leurs données, et
     * `out-in` qui exige la fin de la sortie avant de monter l'entrée. Le
     * défaut ne se déclenchait qu'au départ de l'accueil, la page la plus
     * lourde du site — c'est une course, pas une section fautive : chaque
     * moitié de la page d'accueil passait, la page entière échouait.
     *
     * En mode simultané, l'entrée ne dépend plus de la sortie. Les deux pages
     * se croisent 220 ms ; la CSS sort la page quittée du flux pour éviter
     * qu'elles s'empilent.
     */
    pageTransition: { name: 'page' },
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

  /*
   * Aucune page n'est mise en cache côté serveur.
   *
   * C'est un revirement, et il vaut d'être expliqué. Les pages publiques ont
   * d'abord été servies en `swr` : rendu gardé une minute, régénéré en
   * arrière-plan. Ce que cette configuration ne disait pas, c'est que Nitro
   * **hache l'URL entière** pour ranger une entrée. `/contact`,
   * `/contact?utm_source=infolettre` et `/contact?fbclid=…` deviennent trois
   * fichiers distincts pour un HTML identique — jamais réutilisés, jamais
   * expirés du disque. Une seule session de mise au point a suffi à en
   * accumuler 443, pour 4,8 Mo. En ligne, la moindre campagne marketing ou un
   * robot fait grossir ce dossier sans limite, sans accélérer une requête.
   *
   * `cache.getKey` corrigerait la clé, mais Nitro sérialise les `routeRules`
   * en JSON dans le paquet de production : la fonction y est silencieusement
   * perdue. Vérifié sur un vrai build — elle n'apparaît nulle part dans
   * `.output`. Elle aurait donc marché en développement et échoué en ligne,
   * la pire des deux situations.
   *
   * Le pré-rendu reste écarté pour sa raison d'origine, inchangée : figer une
   * page, c'est y graver l'état de WordPress au moment du build, et comme le
   * menu vit dans l'en-tête de **toutes** les pages, une seule page figée
   * suffit à y montrer un menu périmé.
   *
   * Le cache n'a pas disparu, il a changé d'étage. Ce que ces pages ont de
   * coûteux, ce n'est pas leur rendu Vue — c'est l'appel à WordPress. Or
   * celui-là est déjà mis en cache dans `/api/navigation`, `/api/home` et
   * `/api/catalog/*`. Rendre la page à chaque requête ne coûte donc pas un
   * aller-retour de plus vers WordPress.
   *
   * Ce que ce déplacement rend possible, et qui manquait le plus à un site
   * headless : le cache est **purgeable**. WordPress prévient le site à chaque
   * publication (`/api/revalidate`), le cache de données se vide, et la
   * modification paraît dans la seconde. Avec `swr`, il aurait fallu purger
   * autant d'entrées que d'URL vues — donc y renoncer.
   *
   * Corollaire inchangé : le site a besoin d'un serveur Node
   * (`.output/server`). Un export statique (`nuxt generate`) figerait tout.
   */

  nitro: {
    prerender: {
      /*
       * Plus aucune page. Le pré-rendu et `swr` se disputeraient la même
       * adresse, et le fichier statique gagnerait toujours — c'est ce qui
       * gardait un vieux menu sur l'accueil en ligne.
       *
       * Le robot est coupé pour la même raison : en suivant le logo, il
       * ramenait l'accueil dans le pré-rendu sans qu'on le lui demande.
       */
      crawlLinks: false,
      routes: ['/sitemap.xml'],
    },
  },

  typescript: {
    strict: true,
  },
})
