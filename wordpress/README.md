# Code WordPress

Ce dossier ne fait pas partie du site Nuxt. Il tient le code qui doit vivre
**dans WordPress** pour que le front fonctionne, et qui n'a nulle part ailleurs
où être versionné : `wp-config.php` et `wp-content/` appartiennent à
l'installation WordPress, pas à ce dépôt.

C'est précisément ce qui manquait. Le menu du site en ligne restait vide parce
que le code qui l'expose n'existait que sur le poste de développement, et
qu'aucun déploiement ne pouvait l'emporter.

## mu-plugins/dzuvo-headless-menus.php

Expose les menus WordPress au front, URL déjà traduites en routes Nuxt
(`/categorie-produit/x` → `/categories/x`, page Boutique → `/categories`…).
Sans lui, la route `dzuvo/v1/menus` n'existe pas et le header est vide.

**Installation, sur chaque WordPress — en ligne comme en local :**

1. Déposer le fichier dans `wp-content/mu-plugins/` (créer le dossier s'il
   n'existe pas). Une extension « must-use » est active d'office : rien à
   activer dans l'administration.
2. Vérifier que la route répond :
   ```bash
   curl -s https://VOTRE-WORDPRESS/wp-json/dzuvo/v1/menus
   ```
   La réponse liste les deux emplacements et leur état. Une erreur
   `rest_no_route` signifie que le fichier n'est pas lu.
3. Dans **Apparence > Menus**, composer le menu et cocher l'emplacement
   **« DZUVO — navigation principale »**. Tant qu'aucun menu n'y est assigné,
   la route renvoie `assigned: false` et le front n'affiche rien.

**Une seule copie à la fois.** Un bloc équivalent vit encore en fin de
`wp-config.php` sur l'installation MAMP locale (voir le README principal).
Les deux ensemble déclareraient deux fois les mêmes fonctions et feraient
tomber le site : sur une installation qui reçoit ce fichier, ce bloc doit être
retiré.

## mu-plugins/dzuvo-home.php (+ dossier dzuvo-home/)

Rend la page d'accueil du site pilotable depuis WordPress, avec **ACF**
(la version gratuite suffit). Le site Nuxt lit une seule route publique :
`GET /wp-json/dzuvo/v1/home`. Une section laissée vide garde le contenu livré
avec le site : rien ne disparaît par omission.

**Installation, sur chaque WordPress :**

1. Installer et activer **Advanced Custom Fields**.
2. Déposer `dzuvo-home.php` **et** le dossier `dzuvo-home/` dans
   `wp-content/mu-plugins/`.
3. Indiquer la page d'accueil : **Réglages > Lecture > Une page statique**.
   À défaut, une page dont l'adresse est « accueil » est utilisée, ou la
   constante `DZUVO_HOME_PAGE_ID` dans `wp-config.php`.
4. Ouvrir **Page d'accueil** dans le menu d'administration : la vue d'ensemble
   renvoie vers chaque section.

**Où se saisit quoi :**

| Section du site | Écran WordPress |
| --- | --- |
| Carrousel, offres, panneaux, bannières, témoignages | Page d'accueil > la liste correspondante (une fiche = un élément ; glisser les lignes pour l'ordre) |
| Titres et textes fixes (recherche de pièce, vidéo, engagements, carte, témoignages) | La page d'accueil WordPress, un onglet par section |
| Produits du carrousel | La page d'accueil WordPress, champ « Produits mis en avant » (prix et stock lus dans WooCommerce) |

**Reprise de l'existant.** Au premier chargement de l'administration avec ACF
actif, les contenus saisis avant ACF (anciens champs `_dzuvo_*`, options
`dzuvo_home_settings` et `dzuvo_home_products`) sont recopiés dans les champs
ACF. Rien n'est supprimé ni écrasé ; la reprise ne se rejoue pas.

**Sans ACF**, les écrans de saisie disparaissent (une alerte l'explique) mais la
route continue de servir ce qui a été saisi : la lecture passe par les
métadonnées WordPress, pas par ACF.

Une seule copie à la fois, comme pour les menus : ne pas laisser un bloc
équivalent dans `wp-config.php`.

### acf/dzuvo-homepage.json

Export des 7 groupes de champs ACF de la page d'accueil (68 champs), généré à
partir des définitions du mu-plugin. Il sert à les **importer à la main** :
*ACF > Outils > Importer des groupes de champs*.

Les groupes ciblant la page d'accueil utilisent la règle « page d'accueil
statique » (Réglages > Lecture), valable sur tout WordPress.

**Inutile si `dzuvo-home` est installé** : le mu-plugin déclare déjà ces groupes
(mêmes clés). Les importer en plus créerait des copies en base que ACF signale
comme « synchronisation disponible ». À n'utiliser que pour inspecter les
champs, ou pour travailler sans le mu-plugin. Si les champs sont modifiés dans
le mu-plugin, régénérer ce fichier.

## mu-plugins/dzuvo-product-offers.php

Ajoute à chaque produit WooCommerce des **offres de quantité** (« 2 articles :
-10 % »), affichées sur la fiche sous forme de lots et appliquées au panier et à
la commande par le site Nuxt.

**Installation :** déposer le fichier dans `wp-content/mu-plugins/`. Rien à
activer.

**Réglage, produit par produit :** Produits > modifier le produit > onglet
**Général**, sous les prix, bloc « Offres de quantité (site DZUVO) » :

| Champ | Exemple |
| --- | --- |
| Offre 1 — à partir de (articles) | 2 |
| Offre 1 — remise (%) | 10 |
| Offre 2 — à partir de (articles) | 3 |
| Offre 2 — remise (%) | 15 |

- La remise s'applique à **toutes** les unités dès que le seuil est atteint, sur
  le prix du moment (promotion comprise). Les offres ne se cumulent pas.
- Une offre incomplète (seuil < 2, remise vide ou > 90 %) est ignorée : mieux
  vaut aucune offre qu'une remise à moitié saisie.
- Laisser les champs vides : le produit n'a pas d'offre, la fiche garde le
  simple sélecteur de quantité.
- Un code avantage s'applique **après** l'offre, sur le prix déjà remisé.

## Avis clients

Ils se lisent et se modèrent dans WooCommerce (**Produits > Avis**) ; aucun code
WordPress n'est nécessaire.

- Un avis déposé sur le site arrive en **attente** : il ne paraît qu'une fois
  approuvé. Le courriel de l'auteur n'est jamais publié.
- Il paraît sur le site au plus tard deux minutes après l'approbation.
- Les avis doivent être activés : WooCommerce > Réglages > Produits >
  « Activer les avis sur les produits ».
