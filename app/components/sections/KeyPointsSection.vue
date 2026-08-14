<script setup lang="ts">
/**
 * Bandeau de réassurance affiché sous le hero.
 *
 * Trois engagements, réglés dans « Page d'accueil > Titres et textes ». Leur
 * nombre et leurs pictogrammes sont fixes : la grille est dessinée pour trois
 * colonnes, et chaque icône illustre un propos précis — un quatrième
 * engagement n'aurait aucun dessin à porter.
 */
const { text } = useHomeContent()

const points = computed(() => [
  {
    id: 'compatibilite',
    title: text('keyPoint1Title', 'Compatible toutes marques').value,
    description: text('keyPoint1Text', 'Des pièces universelles conçues pour s’adapter à tous les véhicules.').value,
  },
  {
    id: 'livraison',
    title: text('keyPoint2Title', 'Livraison programmée').value,
    description: text('keyPoint2Text', 'D’une ville à l’autre au Canada, à la date convenue.').value,
  },
  {
    id: 'garantie',
    title: text('keyPoint3Title', 'Garantie DZUVO').value,
    description: text('keyPoint3Text', 'Chaque produit est testé et couvert par notre garantie qualité.').value,
  },
])
</script>

<template>
  <section class="px-2.5 md:px-5 lg:px-24" aria-label="Nos engagements">
    <div class="p-6 md:p-8">
      <ul class="grid gap-7 md:grid-cols-3 md:gap-6 lg:gap-12">
        <!-- Sur tablette, trois colonnes côte à côte étranglent le texte :
             l'icône passe au-dessus pour rendre sa largeur au contenu. -->
        <li
          v-for="point in points"
          :key="point.id"
          class="flex items-start gap-4 md:flex-col md:gap-3 lg:flex-row lg:gap-4"
        >
          <span class="grid size-12 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
            <!-- Compatibilité : pastille de validation -->
            <svg v-if="point.id === 'compatibilite'" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" />
              <path d="m8.5 12 2.4 2.4L15.5 9.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            <!-- Livraison : camion -->
            <svg v-else-if="point.id === 'livraison'" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2.75 6.5h11v9.25h-11z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              <path d="M13.75 10h3.6l3.9 3.6v2.15h-7.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              <circle cx="7" cy="18" r="1.9" stroke="currentColor" stroke-width="1.7" />
              <circle cx="17" cy="18" r="1.9" stroke="currentColor" stroke-width="1.7" />
            </svg>

            <!-- Garantie : bouclier -->
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2.75 4.75 5.5v5.6c0 4.3 2.9 8.15 7.25 9.65 4.35-1.5 7.25-5.35 7.25-9.65V5.5z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              <path d="m9.2 11.9 2 2 3.6-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>

          <div>
            <h3 class="text-h4 font-bold text-tertiary-50">{{ point.title }}</h3>
            <p class="mt-1.5 text-body text-pretty text-tertiary-800 lg:text-body-lg">{{ point.description }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
