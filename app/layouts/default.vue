<script setup>
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
