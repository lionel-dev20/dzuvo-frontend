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
