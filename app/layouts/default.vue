<script setup lang="ts">
/**
 * Gabarit de tout le site, sauf la page d'annonce.
 *
 * Le thème se règle ici, sur `<html>`, et nulle part ailleurs : les pages
 * d'accueil gardent le fond sombre d'origine, le reste du site passe en clair.
 * Poser la classe sur la racine du document plutôt que sur un conteneur évite
 * qu'un rebond de défilement laisse voir la couleur de l'autre thème.
 */
const route = useRoute()

/** Les deux pages qui gardent le fond sombre : l'annonce et l'accueil boutique. */
const DARK_ROUTES = ['/', '/home2']
const isDark = computed(() => DARK_ROUTES.includes(route.path))

useHead(computed(() => ({
  htmlAttrs: { class: isDark.value ? '' : 'theme-light' },
  meta: [{ name: 'theme-color', content: isDark.value ? '#030014' : '#f5f5f5' }],
})))

useOrganizationSchema()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-primary-darker">
    <a
      href="#main"
      class="absolute top-2 left-2 z-100 -translate-y-[200%] rounded-btn bg-secondary px-4 py-2 text-tertiary-50 transition-transform focus-visible:translate-y-0"
    >
      Aller au contenu principal
    </a>
    <TheHeader />
    <main id="main" class="flex-1">
      <slot />
    </main>
    <TheFooter />

    <!-- Confirmation d'ajout au panier : disponible depuis n'importe quelle page. -->
    <CartDrawer />
  </div>
</template>
