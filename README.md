# Site marketing — squelette Nuxt 4

Structure de projet prête à recevoir le contenu. Rendu statique pré-généré (SEO),
CSS natif piloté par des design tokens, aucune dépendance UI externe.

**Le projet est volontairement vide** : les dossiers, les composants et la plomberie
technique sont en place, aucun contenu n'est écrit.

## Démarrer

```bash
npm install
cp .env.example .env   # renseigner les clés
npm run dev            # http://localhost:3000
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (+ pré-rendu) |
| `npm run preview` | Prévisualiser le build |
| `npm run generate` | Export 100 % statique |

## Architecture

```
app/
├── app.vue                 # Racine : <head> global, layout, page
├── error.vue               # Page d'erreur 404 / 500
├── assets/css/             # tokens.css → base.css → utilities.css (via main.css)
├── components/
│   ├── ui/                 # AppButton, AppCard, AppField, AppSection, AppAccordion
│   ├── layout/             # TheHeader, TheFooter, TheMobileMenu, BreadcrumbNav
│   ├── sections/           # Hero, Services, Features, Stats, Testimonials, LogoCloud, FAQ, CTA
│   ├── forms/              # ContactForm, NewsletterForm
│   └── common/             # BrandLogo, SocialLinks, LegalArticle
├── composables/            # useSeo, useStructuredData, useContactForm, useScrollLock
├── config/                 # site.ts (infos entreprise) + navigation.ts (menus) — à remplir
├── data/                   # Contenu local, ou à remplacer par un CMS
├── layouts/                # default (header + footer), minimal (landing pages)
├── middleware/             # Middlewares de route
├── pages/                  # Routes du site (coques vides)
├── plugins/                # analytics.client.ts (chargement conditionnel)
└── utils/                  # Helpers client
server/
├── api/                    # contact.post.ts, newsletter.post.ts
├── routes/                 # sitemap.xml.ts
└── utils/                  # mail.ts, rate-limit.ts
shared/                     # Code partagé client + serveur (alias `#shared`)
├── types/                  # navigation, content, forms
└── utils/                  # validation, format
public/                     # Fichiers servis tels quels (images, favicon, robots.txt)
```

### Routes

| URL | Fichier |
| --- | --- |
| `/` | `app/pages/index.vue` |
| `/services` · `/services/:slug` | `app/pages/services/` |
| `/realisations` · `/realisations/:slug` | `app/pages/realisations/` |
| `/blog` · `/blog/:slug` | `app/pages/blog/` |
| `/a-propos` | `app/pages/a-propos.vue` |
| `/carrieres` | `app/pages/carrieres/index.vue` |
| `/contact` | `app/pages/contact.vue` |
| `/legal/*` | `app/pages/legal/` (mentions, confidentialité, CGV, cookies) |
| `/sitemap.xml` | `server/routes/sitemap.xml.ts` |

## Conventions

- **Infos d'entreprise** : tout est centralisé dans [app/config/site.ts](app/config/site.ts)
  (coordonnées, réseaux, mentions légales) et [app/config/navigation.ts](app/config/navigation.ts) (menus).
  Header, footer, SEO et JSON-LD s'y alimentent — pas de duplication ailleurs.
- **Style** : aucune valeur codée en dur dans les composants, uniquement les variables de
  [app/assets/css/tokens.css](app/assets/css/tokens.css). Le reste vit dans des `<style scoped>`.
- **Composants** : `components: [{ path: '~/components', pathPrefix: false }]` — les sous-dossiers
  organisent le code sans préfixer les noms (`<HeroSection />`, pas `<SectionsHeroSection />`).
  Les noms de fichiers doivent donc rester uniques dans toute l'arborescence.
- **Textes** : les composants de section ne contiennent aucun texte, tout passe en props
  (`<HeroSection title="…" />`). Ils restent réutilisables page après page.
- **SEO** : chaque page appelle `useSeo({ title, description })`, et `useBreadcrumbSchema()`
  pour les pages profondes. Le JSON-LD Organization est posé par le layout par défaut dès que
  `siteConfig` est renseignée.
- **Validation** : une seule source dans [shared/utils/validation.ts](shared/utils/validation.ts),
  utilisée côté client pour l'affichage et rejouée côté serveur pour la sécurité.

## Navigation — gérée dans WordPress

Le menu principal ne vit plus dans le code. Il se saisit dans **Apparence > Menus**, à
l'emplacement **« DZUVO — navigation principale »**.

Trois pièces le rendent possible :

| Où | Quoi |
| --- | --- |
| [wordpress/mu-plugins/dzuvo-headless-menus.php](wordpress/mu-plugins/dzuvo-headless-menus.php) | Déclare les emplacements et expose le menu en lecture publique — **à déposer sur chaque WordPress** ([mode d'emploi](wordpress/README.md)) |
| `wp-config.php`, bloc « DZUVO — menus headless » | La même chose, en montage temporaire sur l'installation MAMP locale |
| [server/api/navigation.get.ts](server/api/navigation.get.ts) | Le lit et le met en cache |
| [app/components/layout/MegaMenu.vue](app/components/layout/MegaMenu.vue) | Le méga-menu du header |

**Pourquoi du code côté WordPress.** Les routes natives `/wp/v2/menus` exigent une
session d'administration : un site public ne peut pas les lire. Et surtout, les
permaliens WordPress ne sont pas les routes du front — le bloc traduit donc chaque
entrée (`/categorie-produit/x` → `/categories/x`, page Boutique → `/categories`,
Panier → `/panier`). Sans cette traduction, un menu correctement rempli enverrait les
visiteurs sur des pages inexistantes.

**Ce code est un montage temporaire.** Il vit en fin de `wp-config.php`, après
`require_once ABSPATH . 'wp-settings.php'` — seul endroit du fichier où WordPress est
chargé, et où `rest_api_init` n'est pas encore passé. Sa place définitive est
l'extension `wp-content/mu-plugins/dzuvo-headless-menus.php.disabled`, mise de côté
pour éviter une double déclaration : `wp-config.php` n'est pas versionné avec le thème,
échappe aux outils de développement, et la moindre erreur de syntaxe y rend le site
entièrement inaccessible, administration comprise. Le retour se fait en supprimant le
bloc et en retirant le suffixe « .disabled ».

**Aucun lien de secours.** Si l'emplacement est vide ou WordPress muet, la navigation
est vide et l'anomalie se voit — l'échec est mis en cache 15 secondes seulement, contre
5 minutes pour un menu servi. Afficher des rubriques de démonstration masquerait la
panne derrière des liens menant à des pages inexistantes.

**Mise en ligne.** Le menu ne s'active pas tout seul sur un nouveau serveur : trois
choses doivent y être réunies, et l'absence de n'importe laquelle donne le même
symptôme — une navigation vide, sans message d'erreur.

1. Le fichier [wordpress/mu-plugins/dzuvo-headless-menus.php](wordpress/mu-plugins/dzuvo-headless-menus.php)
   déposé dans `wp-content/mu-plugins/` du WordPress **en ligne** : `wp-config.php`
   n'est pas versionné, le montage local ne suit aucun déploiement.
2. `NUXT_WOO_BASE_URL` réglée sur ce WordPress-là. Elle vaut `http://localhost:8888/DZuvo`
   en développement : laissée telle quelle, le serveur en ligne interroge sa propre
   machine. Les clés `NUXT_WOO_CONSUMER_KEY` et `NUXT_WOO_CONSUMER_SECRET` sont
   propres à chaque installation WooCommerce — celles du poste local n'y ouvrent rien.
3. Un `npm run build` **après** les deux premiers points : la page d'accueil est
   pré-générée, elle fige le menu au moment du build (voir ci-dessous).

**À savoir.** Les trois pages pré-générées (`/`, `/connexion`, `/inscription`) figent les
libellés du menu au moment du build : une modification dans WordPress y apparaîtra au
prochain `npm run build`. Toutes les autres pages sont rendues à la demande et l'affichent
immédiatement (cache serveur de 5 minutes).

### Transition entre les pages — à ne pas repasser en `out-in`

`app.pageTransition` est volontairement **sans `mode: 'out-in'`**. Avec ce mode, quitter
l'accueil laissait un `<main>` vide : la page demandée n'était jamais insérée et seul un
rechargement l'affichait. `out-in` refuse de monter la page entrante avant la fin de la
sortie, ce qui se heurte au `<Suspense>` que Nuxt place autour de chaque page et aux pages
qui attendent leurs données. C'est une course, pas une page fautive : seul le départ de
l'accueil — la page la plus lourde — la perdait, et chaque moitié de cette page passait
isolément.

En contrepartie les deux pages se croisent 220 ms ; `.page-leave-active` sort la page
quittée du flux dans [app/assets/css/base.css](app/assets/css/base.css), sans quoi elles
s'empileraient le temps du fondu.

## Page d'accueil — gérée dans WordPress

Les neuf sections de l'accueil se saisissent dans l'administration, sous le menu
**« Page d'accueil »**. L'extension vit dans
[wordpress/mu-plugins/](wordpress/mu-plugins/) et se déploie en copiant
`dzuvo-home.php` **et** le dossier `dzuvo-home/` dans `wp-content/mu-plugins/`
du site WordPress. Aucune activation : les extensions « must-use » sont
chargées d'office.

| Écran | Ce qu'il pilote |
| --- | --- |
| Carrousel principal | Slides : titre, surtitre, sous-titre, visuel, boutons, saison |
| Offres du moment | Les quatre cartes promotionnelles |
| Panneaux larges | Les deux panneaux qui ferment les offres |
| Bannières d'accès | Les deux grandes photos cliquables |
| Témoignages | Les avis clients, répartis en deux bandes |
| Produits mis en avant | La sélection WooCommerce du carrousel |
| Titres et textes | Titres de section, engagements, vidéo, compteur |

L'ordre d'affichage se règle **en glissant les lignes** dans les tableaux : la
première ligne est la première slide, la première carte, le premier avis.

### Trois principes

**Le contenu livré avec le site reste, et sert de repli.** Les fichiers de
[app/config/](app/config/) n'ont pas disparu : ils s'affichent tant qu'une
section n'est pas saisie dans WordPress, et reprennent la main si WordPress est
muet. Le repli se décide **section par section** — remplir le carrousel ne vide
pas les témoignages. C'est aussi ce qui permet de reprendre la page
progressivement. Une navigation vide se remarque et se répare ; une page
d'accueil vide, elle, fait fuir le visiteur.

**Un champ vide n'efface rien.** Dans « Titres et textes », un champ laissé
vide veut dire « garder le texte d'origine », jamais « effacer ce titre ». On
ne remplit donc que ce qu'on veut changer.

**Les produits ne sont pas recopiés.** L'écran « Produits mis en avant » ne
retient que des identifiants, dans un ordre. Nom, prix, promotion, note et
stock sont lus par la couche catalogue du site — la même qui sert les fiches
produit et le panier. Un prix ne peut donc pas différer d'une page à l'autre,
et le bouton « Ajouter » du carrousel fonctionne enfin : les produits arrivent
sous la forme que le panier sait accepter. Pour changer un prix, c'est la fiche
WooCommerce qu'il faut modifier.

### Le chemin des données

| Où | Quoi |
| --- | --- |
| `wp-content/mu-plugins/dzuvo-home/` | Les écrans de saisie et `GET /wp-json/dzuvo/v1/home` |
| [server/utils/wp-home.ts](server/utils/wp-home.ts) | Le lit et vérifie la forme reçue, champ par champ |
| [server/api/home.get.ts](server/api/home.get.ts) | Le met en cache (5 min) et résout les produits |
| [app/composables/useHomeContent.ts](app/composables/useHomeContent.ts) | Sert le contenu aux sections, repli compris |

Rien de ce qui vient de WordPress n'est cru sur parole : ce contenu est saisi à
la main, et une fiche à moitié remplie ne doit pas vider la page. Une slide sans
titre, une bannière sans image, un avis sans texte sont écartés — ils
disparaissent de leur section sans emporter le reste.

Une seule requête sert les neuf sections, et la clé partagée du composable fait
que Nuxt ne la joue qu'une fois par rendu.

### L'accueil n'est plus figé au build

C'est la contrepartie de tout ceci, et elle est volontaire : `/` n'est plus
pré-rendue. Elle l'était, ce qui aurait imposé un `npm run build` après chaque
correction de texte — autant ne pas avoir d'administration du tout.

La règle `routeRules: { '/': { swr: 300 } }` dans
[nuxt.config.ts](nuxt.config.ts) garde l'essentiel du pré-rendu : la page est
servie depuis le cache, donc instantanément, et régénérée en arrière-plan passé
le délai. Une modification paraît **au plus tard cinq minutes** après
enregistrement, et le visiteur n'attend jamais WordPress.

Deux conséquences à connaître :

- le site a besoin d'un **serveur Node** (`.output/server`) ; un export
  100 % statique (`nuxt generate`) figerait de nouveau l'accueil ;
- l'accueil figure dans `prerender.ignore` sous la forme d'une expression
  exacte (`/^\/$/`). Sans elle, le robot du pré-rendu la reprendrait en suivant
  le logo des autres pages, et le fichier statique passerait devant la règle.

## Panier et commande

Le navigateur ne mémorise **que des identifiants et des quantités**, dans le cookie
`dzuvo_cart` (30 jours). Prix, stocks, remises et total sont recalculés à chaque
modification par [server/api/cart/index.post.ts](server/api/cart/index.post.ts) à partir de
WooCommerce : un panier trafiqué côté client ne peut pas fausser un montant, et un panier
laissé de côté n'affiche jamais un prix périmé.

| Élément | Rôle |
| --- | --- |
| [app/composables/useCart.ts](app/composables/useCart.ts) | État client : ajout, quantités, code avantage, tiroir |
| [server/utils/cart.ts](server/utils/cart.ts) | Calcul des lignes, des totaux et des règles de coupon |
| `POST /api/cart` | Résout le panier et renvoie l'état faisant foi |
| `GET /api/catalog/recommendations` | Ventes croisées du produit, complétées par sa rubrique |

### Villes desservies et quartiers

Une seule liste, [shared/config/cities.ts](shared/config/cities.ts), alimente **tout** ce
qui parle de villes : le sélecteur du header, la carte de livraison de l'accueil, le
formulaire de commande et sa validation — côté navigateur comme côté serveur. Ajouter une
ville, c'est éditer ce fichier, et rien d'autre.

Elle vit dans `shared/` parce que le serveur en a besoin : c'est lui qui rejoue la
validation de l'adresse, et il ne peut pas vérifier un quartier s'il ignore la liste.

Trois conséquences dans le tunnel de commande :

- la ville retenue dans le header est **proposée par défaut**, sans jamais écraser une
  saisie en cours ;
- les quartiers proposés sont **ceux de cette ville**, et changer de ville remet le
  quartier à zéro — un quartier d'ailleurs n'a pas cours ;
- la province **découle de la ville** : elle n'est plus demandée, seulement affichée.

L'option « Autre ville » reste ouverte pour le reste du Canada : saisie libre, province à
préciser, et pas de quartier — il n'y en a alors aucun à proposer, donc aucun à exiger.
WooCommerce n'ayant pas de champ « quartier », celui-ci rejoint la seconde ligne
d'adresse, après l'appartement.

### Commande et paiement

Le tunnel vit sur `/commande` : coordonnées, adresse canadienne, mode de livraison, puis
carte bancaire. Le visiteur ne quitte jamais le site.

| Élément | Rôle |
| --- | --- |
| [app/pages/commande/index.vue](app/pages/commande/index.vue) | Le tunnel, en une page |
| [app/composables/useCheckout.ts](app/composables/useCheckout.ts) | État du formulaire, livraison, ouverture du paiement |
| [app/components/checkout/CardPayment.vue](app/components/checkout/CardPayment.vue) | Champs de carte Stripe, habillés à la charte |
| `GET /api/checkout/shipping` | Méthodes issues des zones WooCommerce |
| `POST /api/checkout/session` | Crée la commande, arrête le montant, ouvre le PaymentIntent |
| `POST /api/checkout/confirm` | Revérifie le paiement auprès de Stripe et encaisse |
| `POST /api/stripe/webhook` | Même encaissement, pour qui ne revient jamais |

**L'ordre des opérations protège le montant.** Le panier est revalidé, WooCommerce crée la
commande et calcule le total, et c'est **ce total-là** qui part chez Stripe. Au retour, le
succès n'est jamais cru sur parole : le serveur redemande le PaymentIntent à Stripe et
vérifie le montant au centime près ainsi que la clé de commande.

Le numéro de carte n'atteint jamais ce site : il est saisi dans une iframe Stripe
(Elements), ce qui maintient le projet en périmètre PCI SAQ-A. `stripe` est la seule
dépendance ajoutée — côté serveur uniquement, et sans dépendance transitive.

Le paiement est monté en **mode différé** : les champs de carte existent avant qu'aucune
commande ne soit créée, si bien qu'un panier abandonné ne laisse pas de commande fantôme.

Le **webhook n'est pas facultatif** : sans lui, un client qui paie puis ferme l'onglet
laisse une commande en attente alors que l'argent est encaissé. En développement :
`stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### Limites connues, assumées

- Les **produits à déclinaisons** ne sont pas commandables tant qu'un sélecteur de
  variation n'existe pas — le bouton est désactivé et l'explique.
- Le carrousel de la page d'accueil s'alimente de
  [app/config/products.ts](app/config/products.ts) : sans identifiant WooCommerce, son
  bouton « Ajouter » ne peut pas être branché.
- **Aucune taxe n'est calculée** : les taxes sont désactivées dans WooCommerce. Les activer
  côté boutique suffit, le total de la commande en tiendra compte automatiquement.
- **Aucune zone de livraison n'est configurée** : une méthode standard gratuite est servie
  par défaut. Dès qu'une zone existe dans WooCommerce, ses tarifs prennent le relais.
- Les **quartiers** ne sont pas des données WooCommerce : ils vivent dans
  [shared/config/cities.ts](shared/config/cities.ts) et servent au bon de livraison, pas au
  calcul du tarif. Une zone de livraison par quartier supposerait de les déclarer côté
  boutique.

## Pour démarrer le contenu

1. [app/config/site.ts](app/config/site.ts) porte les informations de DZUVO Inc.
   Restent à compléter : le NEQ (dès réception des documents d'incorporation),
   l'hébergeur, les horaires et les réseaux sociaux. **Ce fichier part dans le
   navigateur** : aucune donnée interne ne doit y figurer — l'adresse qui reçoit
   les messages du formulaire se règle par `NUXT_CONTACT_RECIPIENT`, côté serveur.
   Le menu principal et la page d'accueil, eux, se saisissent dans WordPress (voir
   plus haut) ; [app/config/footer.ts](app/config/footer.ts) tient encore les
   colonnes du pied de page, dont plusieurs liens n'ont pas de page.
2. Remplir les pages de [app/pages/](app/pages/) en assemblant les composants de `sections/`.
3. Brancher la source de contenu : `app/data/` en local, ou `useAsyncData` vers un CMS
   (Sanity, Nuxt Content, Strapi) pour les services, réalisations et articles.
4. **Envoi d'emails** — [server/utils/mail.ts](server/utils/mail.ts) : choisir le fournisseur
   (Resend, Brevo, Postmark) et renseigner `MAIL_API_KEY`. Sans clé, l'envoi est simulé en
   développement et échoue explicitement en production.
5. **Newsletter** — [server/api/newsletter.post.ts](server/api/newsletter.post.ts) : appel API du fournisseur.
6. **Bandeau cookies** — obligatoire avant d'activer la mesure d'audience
   ([app/plugins/analytics.client.ts](app/plugins/analytics.client.ts)).
7. **Pages légales** — [app/pages/legal/](app/pages/legal/) : contenus à rédiger et faire valider juridiquement.
8. **Images** — à déposer dans `public/images/` (hero, services, équipe, logos, og-default.jpg).
