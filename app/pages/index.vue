<script setup lang="ts">
/**
 * Accueil de la boutique, en thème clair comme le reste du site.
 *
 * Les anciennes sections (`components/sections/`) ne sont plus utilisées ici ;
 * elles restent en place le temps de valider cette version. `noindex` est
 * conservé jusqu'à l'ouverture : voir l'annonce sur `/home2`.
 */
useSeo({
  title: 'Accueil',
  description: 'Accessoires utiles à petit prix, livrés partout au Canada. DZUVO.',
  noindex: true,
})
</script>

<template>
  <!--
    Rythme vertical : 64px entre deux sections sur mobile, 80px dès la tablette,
    96px sur desktop. L'espacement vit ici, pas dans chaque section.

    L'ordre est celui d'une conversation : on accroche (vidéo), on présente
    quatre produits qui vont ensemble, on
    rassure sur la livraison, on ouvre deux portes, on prend des engagements.
  -->
  <div class="space-y-16 pb-4 md:space-y-20 lg:space-y-24">
    <HomeHero />
    <HomeFeatured />
    <HomeBundle />
    <HomeDelivery />
    <HomeBanners />
    <HomeCommitments />
    <HomeCta />
  </div>
</template>
