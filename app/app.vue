<script setup lang="ts">
import { siteConfig } from '~/config/site'

useHead({
  htmlAttrs: { lang: 'fr' },
  titleTemplate: title => [title, siteConfig.name].filter(Boolean).join(' | ') || siteConfig.tagline,
  link: [{ rel: 'icon', href: '/favicon.ico' }],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
