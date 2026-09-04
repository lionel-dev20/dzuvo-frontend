<script setup lang="ts">
/**
 * Espace client : profil et déconnexion.
 *
 * L'accès est filtré par le middleware `auth`, avant tout affichage. La page
 * peut donc considérer `user` comme présent — le `v-if` du gabarit ne couvre
 * que l'instant du rendu serveur.
 */
definePageMeta({ middleware: 'auth' })

const { user, loaded, logout } = useAuth()
const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  try {
    // Retour à l'accueil : rester sur l'espace client renverrait aussitôt le
    // middleware vers la page de connexion, ce qui ressemble à une erreur.
    await logout('/')
  }
  finally {
    loggingOut.value = false
  }
}

useSeo({
  title: 'Mon compte',
  description: 'Gérez votre compte DZUVO : profil, commandes et garanties.',
})
</script>

<template>
  <div class="px-2.5 pt-10 pb-20 md:px-5 lg:px-24">
    <nav aria-label="Fil d’Ariane" class="mb-8 text-[13px] text-tertiary-800">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="hover:text-secondary">Accueil</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="text-tertiary-500">Mon compte</li>
      </ol>
    </nav>

    <div v-if="!loaded" class="text-body text-tertiary-800">
      Chargement…
    </div>

    <template v-else-if="user">
      <header class="mb-10 max-w-2xl">
        <h1 class="text-h2 leading-tight font-bold text-balance lg:text-h2-lg">
          <span class="text-tertiary-700">Bonjour,</span><br>
          <span class="text-tertiary-50">{{ user.firstName || user.displayName }}</span>
        </h1>
        <p class="mt-3 text-body text-tertiary-800">{{ user.email }}</p>
      </header>

      <div class="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <section class="rounded-2xl bg-primary p-6 md:p-8">
          <h2 class="text-h3 font-bold text-tertiary-50">Mes informations</h2>
          <dl class="mt-6 flex flex-col gap-4 text-body">
            <div>
              <dt class="text-tertiary-800">Prénom</dt>
              <dd class="mt-0.5 font-medium text-tertiary-600">{{ user.firstName || '—' }}</dd>
            </div>
            <div>
              <dt class="text-tertiary-800">Nom</dt>
              <dd class="mt-0.5 font-medium text-tertiary-600">{{ user.lastName || '—' }}</dd>
            </div>
            <div>
              <dt class="text-tertiary-800">Courriel</dt>
              <dd class="mt-0.5 font-medium text-tertiary-600">{{ user.email }}</dd>
            </div>
          </dl>
        </section>

        <section class="flex flex-col rounded-2xl bg-primary p-6 md:p-8">
          <h2 class="text-h3 font-bold text-tertiary-50">Accès rapide</h2>
          <p class="mt-2 text-body text-tertiary-800">
            Le suivi de commandes et l’historique seront disponibles prochainement.
          </p>

          <ul class="mt-7 flex flex-col gap-4">
            <li v-for="item in [
              'Suivi de commande et de livraison',
              'Factures et garanties centralisées',
              'Vos véhicules enregistrés',
            ]" :key="item" class="flex items-start gap-3">
              <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="text-body text-tertiary-600">{{ item }}</span>
            </li>
          </ul>

          <button
            type="button"
            class="btn-secondary mt-auto justify-center pt-3"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            {{ loggingOut ? 'Déconnexion…' : 'Se déconnecter' }}
          </button>
        </section>
      </div>
    </template>
  </div>
</template>
