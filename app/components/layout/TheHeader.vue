<script setup lang="ts">
import { HOME_ROUTES, headerCta } from '~/config/navigation'

const { label: cityLabel, detectLabel, city, cities, select, detect } = useCitySelector()
/** La navigation vient de WordPress ; le méga-menu gère son propre panneau. */
const { items: navigation } = useNavigation()

/*
 * Session client.
 *
 * Elle n'est chargée qu'après l'hydratation, et c'est délibéré : l'état
 * connecté ne doit jamais partir dans le rendu serveur. Les pages publiques
 * sont mises en cache et servies telles quelles à tout le monde (`swr` dans
 * nuxt.config) — le prénom d'un visiteur s'afficherait alors chez les autres.
 *
 * Aucun décalage d'hydratation à craindre : la session part de `null` sur le
 * serveur comme au premier rendu du navigateur, les deux concordent, et le
 * bandeau ne change qu'ensuite. Même raisonnement que le compteur du panier.
 */
const { user, isLoggedIn, loaded, ensureUser, logout } = useAuth()
onMounted(() => { ensureUser() })

/** Prénom seul : le bandeau est déjà dense, le nom entier le ferait déborder. */
const firstName = computed(() => user.value?.firstName?.trim() || user.value?.displayName?.trim() || 'Mon compte')

/** Panneaux pilotés par le header : la ville, et désormais le compte. */
const openMenu = ref<'city' | 'account' | null>(null)
const searchOpen = ref(false)
const menuOpen = ref(false)
const scrolled = ref(false)

/*
 * Deux allures pour une même barre.
 *
 * Sur les pages d'accueil, l'en-tête est posée par-dessus le hero : elle reste
 * transparente et large, le temps que l'image la porte, puis se compacte au
 * défilement.
 *
 * Ailleurs, il n'y a pas de hero. Une barre transparente n'y révèle que le gris
 * du fond de page, et sa hauteur d'apparat repousse le contenu sans rien donner
 * en échange. Ces pages reçoivent donc d'emblée la barre compacte, sur fond
 * blanc franc — celui du thème clair posé par le gabarit.
 */
const route = useRoute()
const onHome = computed(() => HOME_ROUTES.includes(route.path))

/** Barre resserrée : hors accueil toujours, sur l'accueil une fois le hero passé. */
const compact = computed(() => !onHome.value || scrolled.value)

/*
 * Habillage de la barre.
 *
 * `bg-primary` vaut #ffffff sous le thème clair : le blanc vient du jeton, il
 * n'est pas écrit ici. Sur l'accueil, le fond reste translucide et flouté au
 * défilement — il laisse deviner le hero qui passe dessous, ce qu'un aplat
 * opaque effacerait.
 */
const barSkin = computed(() => {
  if (!onHome.value) return 'bg-primary shadow-bar'
  return scrolled.value ? 'bg-primary/85 shadow-bar backdrop-blur-md' : 'bg-transparent'
})

/** Compteur du panier ; le badge se masque à zéro. */
const { count: cartCount } = useCart()

const desktopSearch = useTemplateRef<HTMLInputElement>('desktopSearch')
const mobileSearch = useTemplateRef<HTMLInputElement>('mobileSearch')

/* Classes partagées — évite de répéter les mêmes chaînes sur chaque bouton. */
/* Icône au-dessus, libellé en dessous : l'intitulé lève l'ambiguïté du pictogramme. */
const iconButton = 'flex min-w-[54px] flex-col items-center gap-1 rounded-btn px-2 py-1.5 text-tertiary-500 transition-colors hover:bg-tertiary-500/8 hover:text-secondary'
const iconLabel = 'text-[11px] leading-none font-medium'
const panel = 'absolute top-[calc(100%+10px)] z-70 rounded-xl border border-tertiary-500/12 bg-primary shadow-panel'
const searchBox = 'flex items-center gap-2 rounded-btn border border-tertiary-500/18 bg-tertiary-500/6 px-3.5 py-2'
const accountLink = 'rounded-lg px-3 py-[11px] text-left text-sm font-medium text-tertiary-500 transition-colors hover:bg-tertiary-500/6 hover:text-secondary'
const badge = 'absolute -top-1.5 -right-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-secondary px-1 text-[11px] leading-none font-bold text-on-accent'

function toggleMenu(menu: 'city') {
  openMenu.value = openMenu.value === menu ? null : menu
}

async function openSearch() {
  openMenu.value = null
  searchOpen.value = true
  await nextTick()
  // Un seul des deux champs est rendu à la fois selon la largeur d'écran.
  desktopSearch.value?.focus()
  mobileSearch.value?.focus()
}

function selectCity(name: string) {
  select(name)
  openMenu.value = null
}

onMounted(() => {
  const onScroll = () => { scrolled.value = window.scrollY > 24 }
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    openMenu.value = null
    searchOpen.value = false
  }
  // Tout clic hors d'un déclencheur/panneau referme le menu ouvert.
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null
    if (!target?.closest('[data-dropdown]')) openMenu.value = null
  }

  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pointerdown', onPointerDown)

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('pointerdown', onPointerDown)
  })
})
</script>

<template>
  <header
    class="sticky top-0 z-50 text-tertiary-500 transition-[background-color,box-shadow] duration-300"
    :class="barSkin"
  >
    <!-- Barre compacte : marge annulée, logo réduit. -->
    <div
      class="flex items-center gap-2.5 px-2.5 transition-[padding,margin] duration-300 md:gap-5 md:px-5 lg:px-24"
      :class="compact ? 'mt-0 py-3' : 'mt-2.5 py-3 md:mt-4 lg:mt-6'"
    >
      <!-- Pendant le pré-lancement, le logo ramène à la boutique et non à `/`,
           qui affiche la page d'annonce : depuis un rayon, ce serait une sortie
           du site plutôt qu'un retour à l'accueil. À remettre sur « / » le jour
           de l'ouverture. -->
      <NuxtLink to="/home2" class="shrink-0" aria-label="DZUVO — accueil">
        <img
          src="/images/logos/dzuvo.png"
          alt="DZUVO"
          width="72"
          height="72"
          class="w-auto transition-[height] duration-300"
          :class="compact ? 'h-11 md:h-12' : 'h-14 md:h-24 lg:h-28'"
        >
      </NuxtLink>

      <!-- Ville de livraison -->
      <!-- Sous le seuil de bascule, le sélecteur vit dans le menu burger. -->
      <div class="relative hidden min-w-0 shrink nav:block nav:shrink-0" data-dropdown>
        <button
          class="flex w-full min-w-0 items-center gap-[7px] rounded-btn border border-tertiary-500/14 px-3 py-2 text-sm font-medium text-tertiary-500 transition-colors hover:border-secondary md:px-3.5"
          :class="openMenu === 'city' ? 'bg-tertiary-500/8' : 'bg-transparent'"
          type="button"
          aria-haspopup="true"
          :aria-expanded="openMenu === 'city'"
          aria-controls="city-panel"
          @click="toggleMenu('city')"
        >
          <svg class="shrink-0" width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
            <path d="M7 15s5.5-4.6 5.5-8.5a5.5 5.5 0 10-11 0C1.5 10.4 7 15 7 15z" stroke="currentColor" class="text-secondary" stroke-width="1.5" />
            <circle cx="7" cy="6.5" r="2" stroke="currentColor" class="text-secondary" stroke-width="1.5" />
          </svg>
          <span class="truncate">{{ cityLabel }}</span>
          <svg
            class="shrink-0 transition-transform"
            :class="openMenu === 'city' ? 'rotate-180' : ''"
            width="9" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </button>

        <div v-if="openMenu === 'city'" id="city-panel" class="left-0 flex min-w-[220px] flex-col p-2" :class="panel">
          <button
            class="flex items-center gap-2 rounded-lg px-3 py-[11px] text-left text-sm font-bold text-secondary transition-colors hover:bg-tertiary-500/6"
            type="button"
            @click="detect"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.5" />
              <circle cx="7.5" cy="7.5" r="1.6" fill="currentColor" />
              <path d="M7.5 0v3M7.5 12v3M0 7.5h3M12 7.5h3" stroke="currentColor" stroke-width="1.5" />
            </svg>
            {{ detectLabel }}
          </button>

          <hr class="mx-2 my-1 border-tertiary-500/10">

          <button
            v-for="option in cities"
            :key="option.name"
            class="rounded-md px-3 py-2.5 text-left  text-base transition-colors hover:bg-tertiary-500/6 hover:text-tertiary-500"
            :class="option.name === city ? 'font-bold text-secondary' : 'text-primary-light'"
            type="button"
            @click="selectCity(option.name)"
          >
            {{ option.name }}
          </button>
        </div>
      </div>

      <!-- Navigation principale (desktop) — alimentée par WordPress. -->
      <MegaMenu :items="navigation" />

      <!-- Actions (desktop) -->
      <div class="ml-auto hidden shrink-0 items-center gap-2 nav:flex">
        <div v-if="searchOpen" class="w-[260px]" :class="searchBox">
          <svg class="shrink-0 text-tertiary-800" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <input
            ref="desktopSearch"
            type="search"
            placeholder="Chercher un accessoire…"
            aria-label="Chercher un accessoire"
            class="w-full bg-transparent text-sm text-tertiary-500 outline-none placeholder:text-tertiary-800"
          >
          <button
            class="shrink-0 text-sm text-tertiary-800 transition-colors hover:text-tertiary-500"
            type="button"
            aria-label="Fermer la recherche"
            @click="searchOpen = false"
          >
            ✕
          </button>
        </div>
        <button v-else :class="iconButton" type="button" @click="openSearch">
          <svg width="20" height="20" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span :class="iconLabel">Rechercher</span>
        </button>

        <!-- Compte. Visiteur : un lien vers la connexion. Client identifié :
             son prénom, et un panneau qui mène à son espace ou l'en fait sortir. -->
        <div v-if="isLoggedIn" class="relative" data-dropdown>
          <button
            :class="iconButton"
            type="button"
            aria-haspopup="true"
            :aria-expanded="openMenu === 'account'"
            aria-controls="account-panel"
            @click="toggleMenu('account')"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" stroke-width="1.6" />
              <path d="M3.5 17c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
            <span :class="[iconLabel, 'max-w-[70px] truncate']">{{ firstName }}</span>
          </button>

          <div v-if="openMenu === 'account'" id="account-panel" class="right-0 flex min-w-[200px] flex-col p-2" :class="panel">
            <NuxtLink :class="accountLink" to="/compte" @click="openMenu = null">Mon compte</NuxtLink>
            <NuxtLink :class="accountLink" to="/panier" @click="openMenu = null">Mon panier</NuxtLink>
            <!-- `logout()` et non `logout` : la forme sans parenthèses passerait
                 l'événement souris en guise de destination de redirection. -->
            <button :class="[accountLink, 'w-full text-left text-secondary']" type="button" @click="openMenu = null; logout()">
              Se déconnecter
            </button>
          </div>
        </div>

        <NuxtLink v-else to="/connexion" :class="iconButton">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="6.5" r="3.2" stroke="currentColor" stroke-width="1.6" />
            <path d="M3.5 17c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span :class="iconLabel">Compte</span>
        </NuxtLink>

        <NuxtLink to="/panier" :class="iconButton" aria-label="Panier">
          <span class="relative">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 4h2l1.6 9.2a1.5 1.5 0 001.5 1.3h6.9a1.5 1.5 0 001.5-1.2L18 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="8.5" cy="17.5" r="1.2" fill="currentColor" />
              <circle cx="15" cy="17.5" r="1.2" fill="currentColor" />
            </svg>
            <!-- Le panier vient d'un cookie : rendu au client, sinon les pages
                 pré-générées afficheraient un compteur figé à la compilation. -->
            <ClientOnly>
              <span v-if="cartCount > 0" :class="badge" :aria-label="`${cartCount} article(s)`">{{ cartCount }}</span>
            </ClientOnly>
          </span>
          <span :class="iconLabel">Panier</span>
        </NuxtLink>

        <!-- CTA primaire : états définis par le guide de style. -->
        <!-- « Créer un compte » disparaît pour qui en a déjà un. -->
        <NuxtLink
          v-if="headerCta && !isLoggedIn"
          :to="headerCta.to"
          class="btn-primary ml-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M14 7.7A6 6 0 012.6 12L1 15l1.7-4.3A6 6 0 1114 7.7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
          {{ headerCta.label }}
        </NuxtLink>
      </div>

      <!-- Actions (mobile) -->
      <div class="ml-auto flex shrink-0 items-center gap-0.5 nav:hidden">
        <button :class="iconButton" type="button" @click="openSearch">
          <svg width="20" height="20" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span :class="iconLabel">Rechercher</span>
        </button>

        <NuxtLink to="/panier" :class="iconButton" aria-label="Panier">
          <span class="relative">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 4h2l1.6 9.2a1.5 1.5 0 001.5 1.3h6.9a1.5 1.5 0 001.5-1.2L18 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="8.5" cy="17.5" r="1.2" fill="currentColor" />
              <circle cx="15" cy="17.5" r="1.2" fill="currentColor" />
            </svg>
            <!-- Le panier vient d'un cookie : rendu au client, sinon les pages
                 pré-générées afficheraient un compteur figé à la compilation. -->
            <ClientOnly>
              <span v-if="cartCount > 0" :class="badge" :aria-label="`${cartCount} article(s)`">{{ cartCount }}</span>
            </ClientOnly>
          </span>
          <span :class="iconLabel">Panier</span>
        </NuxtLink>

        <button
          :class="iconButton"
          type="button"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span class="flex size-5 flex-col items-center justify-center gap-[5px]">
            <span
              class="h-0.5 w-5 rounded-sm bg-current transition-transform"
              :class="menuOpen ? 'translate-y-[7px] rotate-45' : ''"
            />
            <span class="h-0.5 w-5 rounded-sm bg-current transition-opacity" :class="menuOpen ? 'opacity-0' : ''" />
            <span
              class="h-0.5 w-5 rounded-sm bg-current transition-transform"
              :class="menuOpen ? '-translate-y-[7px] -rotate-45' : ''"
            />
          </span>
          <span :class="iconLabel">Menu</span>
        </button>
      </div>
    </div>

    <!-- Recherche mobile, pleine largeur sous la barre -->
    <div v-if="searchOpen" class="container pb-3.5 nav:hidden">
      <div :class="searchBox">
        <svg class="shrink-0 text-tertiary-800" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input
          ref="mobileSearch"
          type="search"
          placeholder="Chercher un accessoire…"
          aria-label="Chercher un accessoire"
          class="w-full bg-transparent text-sm text-tertiary-500 outline-none placeholder:text-tertiary-800"
        >
        <button
          class="shrink-0 text-sm text-tertiary-800 transition-colors hover:text-tertiary-500"
          type="button"
          aria-label="Fermer la recherche"
          @click="searchOpen = false"
        >
          ✕
        </button>
      </div>
    </div>
  </header>

  <TheMobileMenu :open="menuOpen" @close="menuOpen = false" />
</template>
