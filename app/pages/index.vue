<script setup lang="ts">
// Page d'accueil
// useSeo({ title: '', description: '' })
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
    <DeliveryMapSection />
    <PromoBannersSection />
    <TestimonialsSection />
  </div>
</template>
