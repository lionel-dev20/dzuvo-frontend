<?php
/**
 * Plugin Name:  DZUVO — menus headless
 * Description:  Expose les menus WordPress au site Nuxt, avec des URL déjà traduites en routes du front.
 * Version:      1.0.0
 * Author:       DZUVO
 *
 * Pourquoi une extension « must-use » plutôt que du code dans wp-config.php :
 * wp-config est chargé avant WordPress, on ne peut donc pas y enregistrer
 * proprement un emplacement de menu ni une route REST. Un fichier déposé dans
 * mu-plugins est actif d'office, survit aux changements de thème et de mise à
 * jour, et se retire en supprimant ce seul fichier.
 *
 * Deux apports :
 *   1. Des emplacements de menu, pour que l'écran « Apparence > Menus »
 *      réapparaisse — un thème de blocs le masque par défaut.
 *   2. Une lecture publique du menu, avec les liens déjà convertis en routes
 *      du site Nuxt : une catégorie WooCommerce sort en « /categories/slug »
 *      et non en « /categorie-produit/slug », qui n'existe pas côté front.
 */

if (!defined('ABSPATH')) {
    exit;
}

const DZUVO_MENU_LOCATIONS = [
    'dzuvo-primary' => 'DZUVO — navigation principale',
    'dzuvo-footer'  => 'DZUVO — pied de page',
];

/**
 * Les emplacements rendent l'écran des menus disponible même sous un thème de
 * blocs, où l'édition de navigation passe normalement par l'éditeur de site.
 */
add_action('after_setup_theme', function () {
    add_theme_support('menus');
    register_nav_menus(DZUVO_MENU_LOCATIONS);
});

add_action('rest_api_init', function () {
    register_rest_route('dzuvo/v1', '/menus/(?P<location>[a-zA-Z0-9_-]+)', [
        'methods'  => 'GET',
        'callback' => 'dzuvo_menu_response',
        // Un menu de site est public par nature : il est déjà visible de tous
        // sur les pages WordPress. Aucune donnée privée n'est exposée ici.
        'permission_callback' => '__return_true',
        'args' => [
            'location' => [
                'validate_callback' => fn($value) => is_string($value) && $value !== '',
            ],
        ],
    ]);

    // Liste des emplacements et de leur état : utile pour diagnostiquer côté front.
    register_rest_route('dzuvo/v1', '/menus', [
        'methods'  => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function () {
            $assigned = get_nav_menu_locations();
            $out = [];

            foreach (DZUVO_MENU_LOCATIONS as $location => $label) {
                $menu_id = $assigned[$location] ?? 0;
                $menu    = $menu_id ? wp_get_nav_menu_object($menu_id) : null;

                $out[] = [
                    'location' => $location,
                    'label'    => $label,
                    'assigned' => (bool) $menu,
                    'menu'     => $menu ? $menu->name : null,
                    'count'    => $menu ? (int) $menu->count : 0,
                ];
            }

            return $out;
        },
    ]);
});

/**
 * Menu d'un emplacement, sous forme d'arbre.
 *
 * Un emplacement sans menu assigné n'est pas une erreur : on renvoie une
 * liste vide, et le front sait qu'il doit se rabattre sur autre chose.
 */
function dzuvo_menu_response(WP_REST_Request $request)
{
    $location = $request->get_param('location');
    $assigned = get_nav_menu_locations();
    $menu_id  = $assigned[$location] ?? 0;

    if (!$menu_id) {
        return rest_ensure_response([
            'location' => $location,
            'assigned' => false,
            'items'    => [],
        ]);
    }

    $items = wp_get_nav_menu_items($menu_id, ['update_post_term_cache' => false]);
    if (!is_array($items)) {
        $items = [];
    }

    return rest_ensure_response([
        'location' => $location,
        'assigned' => true,
        'items'    => dzuvo_menu_tree($items),
    ]);
}

/** Reconstruit la hiérarchie : WordPress ne livre qu'une liste à plat. */
function dzuvo_menu_tree(array $items, int $parent = 0): array
{
    $branch = [];

    foreach ($items as $item) {
        if ((int) $item->menu_item_parent !== $parent) {
            continue;
        }

        $target   = dzuvo_item_target($item);
        $children = dzuvo_menu_tree($items, (int) $item->ID);

        $entry = [
            'label' => wp_strip_all_tags($item->title),
            'to'    => $target['to'],
        ];

        // On n'émet que ce qui est renseigné : le front teste la présence.
        if ($item->description !== '') {
            $entry['description'] = wp_strip_all_tags($item->description);
        }
        if ($target['external']) {
            $entry['external'] = true;
        }
        if ($children) {
            $entry['children'] = $children;
        }

        $branch[] = $entry;
    }

    return $branch;
}

/**
 * Traduit un élément de menu en route du site Nuxt.
 *
 * C'est le cœur de l'extension. Les permaliens WordPress ne correspondent pas
 * aux routes du front : sans cette conversion, un menu correctement rempli
 * pointerait vers des pages inexistantes.
 */
function dzuvo_item_target($item): array
{
    if ($item->type === 'taxonomy') {
        $term = get_term((int) $item->object_id);

        if ($term instanceof WP_Term) {
            $path = $term->taxonomy === 'product_cat'
                ? '/categories/' . $term->slug
                : '/' . $term->slug;

            return ['to' => $path, 'external' => false];
        }
    }

    if ($item->type === 'post_type') {
        $post = get_post((int) $item->object_id);

        if ($post instanceof WP_Post) {
            $path = match ($post->post_type) {
                'product' => '/produits/' . $post->post_name,
                'page'    => dzuvo_page_path($post),
                default   => '/' . $post->post_name,
            };

            return ['to' => $path, 'external' => false];
        }
    }

    if ($item->type === 'post_type_archive' && $item->object === 'product') {
        return ['to' => '/categories', 'external' => false];
    }

    return dzuvo_custom_target((string) $item->url);
}

/**
 * Page WordPress → route Nuxt.
 *
 * Les pages fonctionnelles de WooCommerce ont leur équivalent sur le front,
 * sous un autre nom : « boutique » y devient « /categories », « commander »
 * devient « /commande ». Sans cette table, un menu pointant vers la boutique
 * enverrait le visiteur sur une page inexistante.
 */
function dzuvo_page_path(WP_Post $page): string
{
    if ((int) get_option('page_on_front') === $page->ID) {
        return '/';
    }

    if (function_exists('wc_get_page_id')) {
        $woo_routes = [
            'shop'      => '/categories',
            'cart'      => '/panier',
            'checkout'  => '/commande',
            'myaccount' => '/compte',
        ];

        foreach ($woo_routes as $woo_page => $route) {
            if ((int) wc_get_page_id($woo_page) === $page->ID) {
                return $route;
            }
        }
    }

    return '/' . $page->post_name;
}

/**
 * Lien libre : rendu relatif s'il pointe vers ce site, laissé absolu et marqué
 * externe sinon — le front ouvrira alors un nouvel onglet.
 */
function dzuvo_custom_target(string $url): array
{
    if ($url === '' || $url === '#') {
        return ['to' => '#', 'external' => false];
    }

    $home = wp_parse_url(home_url());
    $link = wp_parse_url($url);

    // Déjà relatif : rien à faire.
    if (empty($link['host'])) {
        return ['to' => '/' . ltrim($url, '/'), 'external' => false];
    }

    if (strtolower($link['host']) !== strtolower($home['host'] ?? '')) {
        return ['to' => $url, 'external' => true];
    }

    // Même hôte : on retire le sous-dossier de l'installation WordPress,
    // sans quoi « /DZuvo/contact » ne résoudrait rien côté Nuxt.
    $base = rtrim($home['path'] ?? '', '/');
    $path = $link['path'] ?? '/';

    if ($base !== '' && str_starts_with($path, $base)) {
        $path = substr($path, strlen($base));
    }

    $path = '/' . trim($path, '/');

    return ['to' => $path === '/' ? '/' : $path, 'external' => false];
}
