<script setup lang="ts">
/**
 * Petite scène sous le bouton des engagements : un bouclier se trace, sa
 * coche apparaît, puis trois gages — livraison, paiement, garantie — s'allument
 * l'un après l'autre. Le cycle dure six secondes et recommence.
 *
 * Tout est en CSS : pas de bibliothèque, rien à charger. Sans animation
 * (`prefers-reduced-motion`), la scène s'affiche d'emblée, immobile et complète.
 */
</script>

<template>
  <div class="shield flex items-center gap-6" aria-hidden="true">
    <svg viewBox="0 0 120 140" class="size-28 shrink-0 overflow-visible">
      <!-- Onde qui part du bouclier à chaque cycle -->
      <circle class="wave" cx="60" cy="68" r="46" fill="none" stroke="var(--color-secondary)" stroke-width="2" />
      <path
        class="outline"
        d="M60 10 18 26v38c0 29 18 53 42 64 24-11 42-35 42-64V26z"
        fill="var(--color-primary)"
        stroke="var(--color-secondary)"
        stroke-width="4"
        stroke-linejoin="round"
        pathLength="1"
      />
      <path
        class="tick"
        d="m40 70 14 14 28-30"
        fill="none"
        stroke="var(--color-secondary)"
        stroke-width="7"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
      />
    </svg>

    <ul class="flex flex-col gap-2.5">
      <li class="chip chip-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2.75 6.5h11v9.25h-11zM13.75 10h3.6l3.9 3.6v2.15h-7.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /><circle cx="7" cy="18" r="1.9" stroke="currentColor" stroke-width="1.7" /><circle cx="17" cy="18" r="1.9" stroke="currentColor" stroke-width="1.7" /></svg>
        Livré chez vous
      </li>
      <li class="chip chip-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.7" /><path d="M3 10h18" stroke="currentColor" stroke-width="1.7" /></svg>
        Paiement protégé
      </li>
      <li class="chip chip-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7" /><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
        Garanti 2 ans
      </li>
    </ul>
  </div>
</template>

<style scoped>
.chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-tertiary-600);
}

/* Cycle de 6 s : tracé du bouclier, coche, gages, puis repos. */
.outline { stroke-dasharray: 1; stroke-dashoffset: 1; animation: shield-draw 6s ease-in-out infinite; }
.tick { stroke-dasharray: 1; stroke-dashoffset: 1; animation: shield-tick 6s ease-in-out infinite; }
.wave { transform-origin: 60px 68px; opacity: 0; animation: shield-wave 6s ease-out infinite; }
.chip { animation: shield-chip 6s ease-in-out infinite; }
.chip-2 { animation-delay: 0.35s; }
.chip-3 { animation-delay: 0.7s; }

@keyframes shield-draw {
  0% { stroke-dashoffset: 1; }
  25%, 90% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 1; }
}
@keyframes shield-tick {
  0%, 22% { stroke-dashoffset: 1; }
  38%, 90% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 1; }
}
@keyframes shield-wave {
  0%, 36% { transform: scale(0.8); opacity: 0; }
  40% { opacity: 0.45; }
  62%, 100% { transform: scale(1.35); opacity: 0; }
}
@keyframes shield-chip {
  0%, 36% { opacity: 0.25; transform: translateX(-6px); color: var(--color-tertiary-800); }
  46%, 88% { opacity: 1; transform: none; color: var(--color-tertiary-50); }
  100% { opacity: 0.25; transform: translateX(-6px); color: var(--color-tertiary-800); }
}

@media (prefers-reduced-motion: reduce) {
  .outline, .tick, .chip { animation: none; stroke-dashoffset: 0; opacity: 1; transform: none; }
  .wave { display: none; }
}
</style>
