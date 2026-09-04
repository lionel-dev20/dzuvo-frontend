/**
 * Contrôle de cohérence des clés au démarrage.
 *
 * Motivé par une erreur réelle : les deux clés Stripe avaient été interverties
 * dans le `.env`, la clé **secrète** se retrouvant sous le préfixe
 * `NUXT_PUBLIC_`. Or ce préfixe envoie la valeur dans le paquet JavaScript
 * servi au navigateur — la clé secrète partait donc chez chaque visiteur, sans
 * qu'aucune erreur ne le signale : le site fonctionnait normalement.
 *
 * Une confusion qui ne provoque aucune panne ne se voit pas ; elle doit donc
 * être cherchée. En production, le démarrage est interrompu : mieux vaut un
 * déploiement qui échoue franchement qu'un site en ligne qui distribue sa clé.
 */
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const problems: string[] = []

  const publishable = config.public.stripePublishableKey
  const secret = config.stripeSecretKey

  if (publishable && !publishable.startsWith('pk_')) {
    problems.push(
      'NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ne commence pas par « pk_ ». '
      + 'Cette valeur est servie au navigateur : si c’est la clé secrète, elle est exposée.',
    )
  }

  if (secret && !secret.startsWith('sk_') && !secret.startsWith('rk_')) {
    problems.push('NUXT_STRIPE_SECRET_KEY ne commence pas par « sk_ » (ou « rk_ » pour une clé restreinte).')
  }

  // Un mélange test/production encaisse pour de vrai avec une carte d'essai,
  // ou l'inverse : les deux se voient trop tard.
  const mode = (key: string) => (key.includes('_live_') ? 'live' : key.includes('_test_') ? 'test' : null)
  const publishableMode = publishable ? mode(publishable) : null
  const secretMode = secret ? mode(secret) : null

  if (publishableMode && secretMode && publishableMode !== secretMode) {
    problems.push(`Clés Stripe dépareillées : publique en « ${publishableMode} », secrète en « ${secretMode} ».`)
  }

  if (!problems.length) return

  const report = problems.map(p => `  - ${p}`).join('\n')

  if (import.meta.dev) {
    console.error(`\n[configuration] Clés Stripe incohérentes :\n${report}\n`)
    return
  }

  throw new Error(`Configuration Stripe invalide :\n${report}`)
})
