<script setup lang="ts">
/**
 * La boutique, en attendant l'ouverture.
 *
 * C'est l'ancienne page d'accueil, déplacée telle quelle : `/` accueille
 * désormais la page d'annonce. Rien n'a changé dans les sections — elles
 * lisent toujours WordPress par `useHomeContent`.
 *
 * `noindex` le temps du pré-lancement : deux pages d'accueil indexées se
 * feraient concurrence dans les résultats de recherche, et c'est l'annonce
 * qui doit ressortir. À retirer le jour de l'ouverture, quand cette page
 * reprendra sa place à la racine.
 */
useSeo({
  title: 'Accueil',
  description: 'Pièces auto et accessoires DZUVO, compatibles toutes marques, livrés partout au Canada.',
  noindex: true,
})
</script>

<template>
  <!--
    Rythme vertical du site : 64px entre deux sections sur mobile, 80px dès la
    tablette, 96px sur desktop. Centraliser l'espacement ici évite que chaque
    section porte ses propres marges.
  -->
  <div class="space-y-16 md:space-y-20 lg:space-y-24">
    <HeroSection />
    <PartRequestSection class="lg:space-y-6" />
    <VideoSection />
    <KeyPointsSection />
    <FeaturedCategoriesSection />
    <ProductCarouselSection />
    <PromoBannersSection />
    <TestimonialsSection />
  </div>
</template>
