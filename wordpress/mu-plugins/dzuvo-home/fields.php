<?php
/**
 * Cadre de saisie commun aux sections de la page d'accueil — branché sur ACF.
 *
 * Chaque section décrit ses champs dans un tableau (clé, libellé, type, aide).
 * Ce fichier traduit ces tableaux en groupes de champs ACF, et relit les
 * valeurs enregistrées. Les sections ne parlent donc jamais à ACF
 * directement : changer de mécanique de saisie ne touche que ce fichier.
 *
 * ACF **gratuit** suffit : aucun répéteur, aucune page d'options. Les listes
 * (slides, offres…) restent des types de contenu portant chacun un groupe de
 * champs, et les textes fixes se saisissent sur la page d'accueil WordPress.
 *
 * Deux choix qui ne se voient pas dans le code, et qui comptent :
 *
 * - **La lecture ne dépend pas d'ACF.** ACF stocke ses valeurs dans les
 *   métadonnées ordinaires de WordPress ; on les relit avec `get_post_meta`.
 *   Désactiver ACF ôte les écrans de saisie mais ne casse pas la route
 *   publique : le site continue de recevoir ce qui a été saisi.
 *
 * - **Le préfixe `home_`.** ACF enregistre, pour chaque champ `x`, une seconde
 *   métadonnée `_x` qui retient la clé du champ. Un champ nommé `dzuvo_x`
 *   écraserait donc l'ancienne métadonnée `_dzuvo_x` de la version sans ACF,
 *   et avec elle les contenus déjà saisis.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Préfixe des noms de champs ACF (donc des métadonnées). */
const DZUVO_HOME_FIELD_PREFIX = 'home_';

/**
 * Identifiant de la page WordPress qui porte les textes fixes et la sélection
 * de produits.
 *
 * Par ordre de priorité : la constante `DZUVO_HOME_PAGE_ID` (wp-config.php),
 * la page d'accueil statique de Réglages > Lecture, puis une page dont
 * l'adresse est « accueil ». Le filtre `dzuvo_home_page_id` a le dernier mot.
 *
 * Zéro veut dire « aucune page trouvée » : les groupes de champs ne s'affichent
 * alors nulle part, et l'administration le dit.
 */
function dzuvo_home_page_id() {
	static $resolved = null;

	if ( null !== $resolved ) {
		return $resolved;
	}

	$candidate = defined( 'DZUVO_HOME_PAGE_ID' ) ? (int) DZUVO_HOME_PAGE_ID : (int) get_option( 'page_on_front' );

	if ( ! $candidate ) {
		$page      = get_page_by_path( 'accueil' );
		$candidate = $page ? (int) $page->ID : 0;
	}

	$resolved = (int) apply_filters( 'dzuvo_home_page_id', $candidate );

	return $resolved;
}

/** Clé ACF d'un champ : stable, donc la même d'un site à l'autre. */
function dzuvo_home_acf_key( $group, $key ) {
	return 'field_dzuvo_' . $group . '_' . $key;
}

/**
 * Traduit un champ du schéma interne en champ ACF.
 *
 * Types du schéma : text, textarea, url, number, select, checkbox.
 *
 * `url` devient un champ texte et non un champ « URL » d'ACF : ce dernier
 * exige une adresse complète, et refuserait « /categories/batteries », qui est
 * précisément la forme attendue (une route du site, pas un domaine).
 */
function dzuvo_home_acf_field( $group, array $field ) {
	$type = $field['type'] ?? 'text';

	$acf = [
		'key'          => dzuvo_home_acf_key( $group, $field['key'] ),
		'label'        => $field['label'],
		'name'         => DZUVO_HOME_FIELD_PREFIX . $field['key'],
		'instructions' => $field['help'] ?? '',
		'required'     => 0,
	];

	switch ( $type ) {
		case 'textarea':
			return $acf + [
				'type'        => 'textarea',
				'rows'        => 3,
				'new_lines'   => '',
				'placeholder' => $field['placeholder'] ?? '',
			];

		case 'select':
			return $acf + [
				'type'          => 'select',
				'choices'       => $field['options'],
				'default_value' => $field['default'] ?? array_key_first( $field['options'] ),
				'allow_null'    => 0,
				'multiple'      => 0,
				'ui'            => 0,
				'return_format' => 'value',
			];

		case 'checkbox':
			return $acf + [
				'type'          => 'true_false',
				'ui'            => 1,
				'default_value' => 0,
				'message'       => '',
			];

		case 'number':
			return $acf + [
				'type' => 'number',
				'step' => $field['step'] ?? 1,
				'min'  => $field['min'] ?? '',
				'max'  => $field['max'] ?? '',
			];

		default:
			return $acf + [
				'type'        => 'text',
				'placeholder' => $field['placeholder'] ?? '',
			];
	}
}

/**
 * Déclare un groupe de champs ACF.
 *
 * @param string $id        Identifiant du groupe (sert aussi à fabriquer les clés de champs).
 * @param string $title     Titre affiché au-dessus des champs.
 * @param array  $fields    Champs au format du schéma interne, ou champs ACF
 *                          déjà formés (onglets, messages) s'ils portent un `key` ACF.
 * @param array|callable $location Règles d'affichage ACF, ou fonction qui les renvoie.
 * @param int    $order     Position quand plusieurs groupes partagent un écran.
 */
function dzuvo_home_add_field_group( $id, $title, array $fields, $location, $order = 0 ) {
	add_action( 'acf/init', function () use ( $id, $title, $fields, $location, $order ) {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		acf_add_local_field_group( [
			'key'                   => 'group_dzuvo_' . $id,
			'title'                 => $title,
			'fields'                => array_map(
				static fn( $field ) => isset( $field['acf'] ) ? $field['acf'] : dzuvo_home_acf_field( $id, $field ),
				$fields
			),
			// Un appelable est résolu ici, à `acf/init` : l'identifiant de la page
			// d'accueil n'est pas encore connu quand les fichiers se chargent.
			'location'              => is_callable( $location ) ? $location() : $location,
			'menu_order'            => $order,
			'position'              => 'normal',
			'style'                 => 'default',
			'label_placement'       => 'top',
			'instruction_placement' => 'label',
			'hide_on_screen'        => '',
		] );
	} );
}

/** Règle d'affichage : les fiches d'un type de contenu. */
function dzuvo_home_location_post_type( $post_type ) {
	return [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => $post_type ] ] ];
}

/** Règle d'affichage : la page d'accueil WordPress (aucune si introuvable). */
function dzuvo_home_location_home_page() {
	$page_id = dzuvo_home_page_id();

	// Un identifiant nul ferait correspondre la règle à « aucune page » côté
	// ACF, mais autant ne rien déclarer que laisser le doute.
	if ( ! $page_id ) {
		return [];
	}

	return [ [ [ 'param' => 'page', 'operator' => '==', 'value' => (string) $page_id ] ] ];
}

/**
 * Nettoyage d'une valeur selon le type de champ déclaré.
 *
 * Appliqué **à la lecture**. ACF enregistre ce qu'on lui donne, et ce contenu
 * part ensuite vers un autre site : mieux vaut ne jamais servir autre chose
 * que du texte brut, quelle que soit la manière dont la valeur est arrivée en
 * base (écran ACF, import, WP-CLI).
 */
function dzuvo_home_sanitize_field( $raw, array $field ) {
	$raw = is_scalar( $raw ) ? (string) $raw : '';

	switch ( $field['type'] ?? 'text' ) {
		case 'textarea':
			return sanitize_textarea_field( $raw );

		case 'number':
			return '' === trim( $raw ) ? '' : (string) ( 0 + $raw );

		case 'select':
			return array_key_exists( $raw, $field['options'] ?? [] ) ? $raw : '';

		case 'url':
			/*
			 * Les liens du site sont des routes du front (« /categories/x »),
			 * pas des adresses complètes : esc_url_raw les conserve telles
			 * quelles tout en écartant les protocoles indésirables.
			 */
			return esc_url_raw( trim( $raw ) );

		default:
			return sanitize_text_field( $raw );
	}
}

/** Valeur brute d'un champ ACF, relue dans les métadonnées. */
function dzuvo_home_meta( $post_id, $key ) {
	return get_post_meta( $post_id, DZUVO_HOME_FIELD_PREFIX . $key, true );
}

/**
 * Relit les champs d'un contenu, prêts à être servis.
 *
 * Les chaînes vides sont écartées : le front teste la présence d'une clé pour
 * décider d'afficher un élément, et une clé vide y ferait apparaître un badge
 * ou un prix sans contenu.
 */
function dzuvo_home_get_fields( $post_id, array $fields ) {
	$values = [];

	foreach ( $fields as $field ) {
		$type = $field['type'] ?? 'text';
		$raw  = dzuvo_home_meta( $post_id, $field['key'] );

		if ( 'checkbox' === $type ) {
			// ACF range une case cochée sous « 1 », décochée sous « 0 ».
			if ( '1' === (string) $raw ) {
				$values[ $field['key'] ] = true;
			}
			continue;
		}

		$clean = dzuvo_home_sanitize_field( $raw, $field );

		if ( '' === $clean ) {
			continue;
		}

		$values[ $field['key'] ] = 'number' === $type ? 0 + $clean : $clean;
	}

	return $values;
}

/**
 * Image mise en avant d'un contenu, en adresse absolue.
 *
 * Le front est servi par un autre domaine que WordPress : une adresse relative
 * y pointerait vers un fichier inexistant.
 */
function dzuvo_home_image_url( $post_id, $size = 'full' ) {
	$url = get_the_post_thumbnail_url( $post_id, $size );

	return $url ? esc_url_raw( $url ) : null;
}

/** Identifiant stable d'un contenu, pour les clés de boucle côté front. */
function dzuvo_home_slug( $post ) {
	return $post->post_name ? $post->post_name : 'item-' . $post->ID;
}

/**
 * Déclare un type de contenu de la page d'accueil.
 *
 * Tous partagent le même gabarit : rangés sous le menu « Page d'accueil »,
 * sans page ni archive publique — ils n'existent que pour alimenter le site
 * Nuxt, et une adresse WordPress qui les afficherait isolément n'aurait pas
 * de sens.
 */
function dzuvo_home_register_type( $slug, $singular, $plural, array $args = [] ) {
	register_post_type( $slug, array_merge( [
		'labels' => [
			'name'               => $plural,
			'singular_name'      => $singular,
			'add_new'            => 'Ajouter',
			'add_new_item'       => 'Ajouter — ' . $singular,
			'edit_item'          => 'Modifier — ' . $singular,
			'new_item'           => 'Nouveau — ' . $singular,
			'view_item'          => 'Voir',
			'search_items'       => 'Rechercher',
			'not_found'          => 'Aucun contenu pour l’instant.',
			'not_found_in_trash' => 'Rien dans la corbeille.',
			'all_items'          => $plural,
			'menu_name'          => $plural,
		],
		'public'              => false,
		'show_ui'             => true,
		'show_in_menu'        => 'dzuvo-home',
		'publicly_queryable'  => false,
		'exclude_from_search' => true,
		'has_archive'         => false,
		'rewrite'             => false,
		'hierarchical'        => false,
		'supports'            => [ 'title', 'thumbnail' ],
		'capability_type'     => 'post',
		'map_meta_cap'        => true,
	], $args ) );
}

/**
 * Contenus publiés d'un type, dans l'ordre choisi dans l'administration.
 *
 * @return WP_Post[]
 */
function dzuvo_home_posts( $post_type, $limit = 50 ) {
	return get_posts( [
		'post_type'        => $post_type,
		'post_status'      => 'publish',
		'numberposts'      => $limit,
		'orderby'          => [ 'menu_order' => 'ASC', 'date' => 'DESC' ],
		'suppress_filters' => false,
	] );
}
