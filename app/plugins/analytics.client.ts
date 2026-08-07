/**
 * Chargement différé de la mesure d'audience.
 * Le script n'est injecté que si `NUXT_PUBLIC_ANALYTICS_ID` est défini — et il
 * doit rester conditionné au consentement de l'utilisateur (RGPD).
 */
export default defineNuxtPlugin(() => {
  const { analyticsId } = useRuntimeConfig().public

  if (!analyticsId || import.meta.dev) return

  // TODO: brancher ici le fournisseur retenu (Plausible, Matomo, GA4…)
  // et n'appeler cette initialisation qu'après acceptation des cookies.
  // useHead({ script: [{ src: 'https://plausible.io/js/script.js', defer: true, 'data-domain': analyticsId }] })
})
