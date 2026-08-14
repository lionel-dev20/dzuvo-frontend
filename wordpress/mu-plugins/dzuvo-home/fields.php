<?php
/**
 * Cadre de saisie commun aux sections de la page d'accueil.
 *
 * Chaque section décrit ses champs dans un tableau ; ce fichier se charge de
 * les afficher, de les enregistrer et de les relire. Sans cela, le même code
 * de boîte à métadonnées — nonce, vérification des droits, nettoyage des
 * valeurs — serait recopié dans chaque type de contenu, avec le risque qu'une
 * copie oublie une de ces trois précautions.
 *
 * Les clés de métadonnées sont préfixées d'un tiret bas : WordPress les
 * considère alors comme internes et ne les expose pas dans l'écran
 * « Champs personnalisés », où une saisie libre les contredirait.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Déclare une boîte de saisie pour un type de contenu.
 *
 * @param string $post_type Type de contenu concerné.
 * @param string $id        Identifiant de la boîte.
 * @param string $title     Titre affiché au-dessus des champs.
 * @param array  $fields    Champs, au format décrit dans dzuvo_home_render_field().
 */
function dzuvo_home_add_meta_box( $post_type, $id, $title, array $fields ) {
	add_action( 'add_meta_boxes', function () use ( $post_type, $id, $title, $fields ) {
		add_meta_box(
			$id,
			$title,
			function ( $post ) use ( $id, $fields ) {
				wp_nonce_field( $id, $id . '_nonce' );
				echo '<div class="dzuvo-fields">';
				foreach ( $fields as $field ) {
					dzuvo_home_render_field( $post->ID, $field );
				}
				echo '</div>';
			},
			$post_type,
			'normal',
			'high'
		);
	} );

	add_action( 'save_post_' . $post_type, function ( $post_id ) use ( $post_type, $id, $fields ) {
		dzuvo_home_save_fields( $post_id, $post_type, $id, $fields );
	} );
}

/**
 * Affiche un champ.
 *
 * Types acceptés : text, textarea, url, number, select, checkbox.
 * Clés reconnues : key, label, type, help, placeholder, options, step.
 */
function dzuvo_home_render_field( $post_id, array $field ) {
	$key   = $field['key'];
	$type  = $field['type'] ?? 'text';
	$name  = '_dzuvo_' . $key;
	$value = get_post_meta( $post_id, $name, true );
	$id    = 'dzuvo-field-' . $key;

	echo '<p style="margin:0 0 1.1rem">';
	printf(
		'<label for="%s" style="display:block;font-weight:600;margin-bottom:.3rem">%s</label>',
		esc_attr( $id ),
		esc_html( $field['label'] )
	);

	switch ( $type ) {
		case 'textarea':
			printf(
				'<textarea id="%s" name="%s" rows="3" class="large-text" placeholder="%s">%s</textarea>',
				esc_attr( $id ),
				esc_attr( $name ),
				esc_attr( $field['placeholder'] ?? '' ),
				esc_textarea( $value )
			);
			break;

		case 'select':
			printf( '<select id="%s" name="%s">', esc_attr( $id ), esc_attr( $name ) );
			foreach ( $field['options'] as $option_value => $option_label ) {
				printf(
					'<option value="%s"%s>%s</option>',
					esc_attr( $option_value ),
					selected( $value, $option_value, false ),
					esc_html( $option_label )
				);
			}
			echo '</select>';
			break;

		case 'checkbox':
			printf(
				'<input type="checkbox" id="%s" name="%s" value="1"%s>',
				esc_attr( $id ),
				esc_attr( $name ),
				checked( $value, '1', false )
			);
			break;

		case 'number':
			printf(
				'<input type="number" id="%s" name="%s" value="%s" step="%s" class="small-text">',
				esc_attr( $id ),
				esc_attr( $name ),
				esc_attr( $value ),
				esc_attr( $field['step'] ?? '1' )
			);
			break;

		default:
			printf(
				'<input type="text" id="%s" name="%s" value="%s" class="large-text" placeholder="%s">',
				esc_attr( $id ),
				esc_attr( $name ),
				esc_attr( $value ),
				esc_attr( $field['placeholder'] ?? '' )
			);
	}

	if ( ! empty( $field['help'] ) ) {
		printf( '<span class="description" style="display:block;margin-top:.25rem">%s</span>', esc_html( $field['help'] ) );
	}

	echo '</p>';
}

/**
 * Enregistre les champs d'une boîte.
 *
 * Trois vérifications, dans cet ordre : la requête vient bien du formulaire
 * (nonce), ce n'est pas un enregistrement automatique — qui ne transporte pas
 * les champs et les effacerait — et l'utilisateur a le droit de modifier ce
 * contenu.
 */
function dzuvo_home_save_fields( $post_id, $post_type, $box_id, array $fields ) {
	$nonce = $_POST[ $box_id . '_nonce' ] ?? '';

	if ( ! is_string( $nonce ) || ! wp_verify_nonce( $nonce, $box_id ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	foreach ( $fields as $field ) {
		$name = '_dzuvo_' . $field['key'];
		$raw  = $_POST[ $name ] ?? null;

		// Une case décochée n'est pas envoyée : son absence vaut « non ».
		if ( ( $field['type'] ?? 'text' ) === 'checkbox' ) {
			update_post_meta( $post_id, $name, $raw ? '1' : '' );
			continue;
		}

		if ( null === $raw ) {
			continue;
		}

		update_post_meta( $post_id, $name, dzuvo_home_sanitize_field( $raw, $field ) );
	}
}

/** Nettoyage d'une valeur selon le type de champ déclaré. */
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
		$raw  = get_post_meta( $post_id, '_dzuvo_' . $field['key'], true );

		if ( 'checkbox' === $type ) {
			if ( '1' === $raw ) {
				$values[ $field['key'] ] = true;
			}
			continue;
		}

		if ( '' === $raw || null === $raw ) {
			continue;
		}

		$values[ $field['key'] ] = 'number' === $type ? 0 + $raw : $raw;
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
