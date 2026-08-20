<script setup lang="ts">
/**
 * Gabarit de la page d'annonce.
 *
 * Ni en-tête, ni pied de page : une page « bientôt disponible » qui afficherait
 * le menu, le panier et les six colonnes du pied de page inviterait à entrer
 * dans une boutique qui n'ouvre pas encore. Elle ne doit proposer qu'une seule
 * chose — laisser son courriel.
 *
 * Les données structurées de l'entreprise restent posées ici : c'est la page
 * que les moteurs de recherche vont indexer pendant tout le pré-lancement.
 */
useOrganizationSchema()
</script>

<template>
  <div class="relative flex min-h-dvh flex-col overflow-hidden bg-primary-darker">
    <slot />
  </div>
</template>
