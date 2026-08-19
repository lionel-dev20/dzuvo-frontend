<script setup lang="ts">
import { siteConfig } from '~/config/site'

useHead({
  htmlAttrs: { lang: 'fr' },
  titleTemplate: title => [title, siteConfig.name].filter(Boolean).join(' | ') || siteConfig.tagline,
  /*
   * Icônes du site : le monogramme DZ seul, sans le mot « DZUVO » — illisible
   * à 16 px. Elles sont posées sur le fond de la charte plutôt que laissées
   * transparentes : le « D » est blanc, et il disparaîtrait sur l'onglet clair
   * d'un navigateur en thème jour.
   */
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
    { rel: 'icon', type: 'image/png', href: '/icon-192.png', sizes: '192x192' },
    { rel: 'icon', type: 'image/png', href: '/icon-512.png', sizes: '512x512' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <!--
      Barre de progression pendant les changements de page.

      Elle ne paraît qu'au-delà de 200 ms (`throttle`) : en dessous, la page est
      déjà là et un éclair de rouge se lirait comme un défaut d'affichage. Les
      pages qui attendent WooCommerce, elles, dépassent ce seuil — c'est
      exactement là qu'un clic sans réaction fait douter d'avoir cliqué.

      Rien au premier chargement : la page arrive déjà rendue par le serveur.
    -->
    <NuxtLoadingIndicator
      :height="3"
      :throttle="200"
      :duration="2500"
      color="linear-gradient(to right, var(--color-secondary-dark), var(--color-secondary), var(--color-secondary-light))"
      error-color="var(--color-secondary-darker)"
    />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
