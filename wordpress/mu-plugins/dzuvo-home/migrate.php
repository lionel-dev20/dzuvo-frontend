<?php
/**
 * Reprise, une seule fois, des contenus saisis avant le passage à ACF.
 *
 * La version précédente rangeait ses champs sous `_dzuvo_*` (fiches) et dans
 * deux options (textes fixes, produits). Sans cette reprise, activer ACF
 * afficherait des écrans de saisie vides par-dessus un site qui, lui, continue
 * de servir l'ancien contenu — jusqu'au premier enregistrement, qui l'effacerait.
 *
 * Règles de prudence :
 *
 * - **Rien n'est supprimé.** Les anciennes métadonnées et options restent en
 *   base : revenir en arrière ne coûte qu'un retour à la version précédente.
 * - **Rien n'est écrasé.** Un champ ACF déjà rempli l'emporte sur l'ancienne
 *   valeur, y compris si la reprise est relancée.
 * - **Elle attend ACF.** Les valeurs passent par `update_field()`, qui écrit
 *   aussi la référence de champ dont ACF a besoin pour afficher la valeur.
 *   Sans ACF actif, rien n'est marqué comme fait : la reprise aura lieu à
 *   l'activation.
 * - **Les textes fixes attendent leur page.** Tant qu'aucune page d'accueil
 *   n'est identifiée, il n'y a nulle part où les poser : la reprise des fiches
 *   se fait quand même, celle des textes patiente.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_MIGRATED_POSTS = 'dzuvo_home_acf_posts_migrated';
const DZUVO_MIGRATED_PAGE  = 'dzuvo_home_acf_page_migrated';

add_action( 'admin_init', 'dzuvo_home_migrate_to_acf' );

function dzuvo_home_migrate_to_acf() {
	if ( ! function_exists( 'update_field' ) || ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	if ( ! get_option( DZUVO_MIGRATED_POSTS ) ) {
		dzuvo_home_migrate_posts();
		update_option( DZUVO_MIGRATED_POSTS, gmdate( 'c' ) );
	}

	$page_id = dzuvo_home_page_id();

	if ( $page_id && ! get_option( DZUVO_MIGRATED_PAGE ) ) {
		dzuvo_home_migrate_page( $page_id );
		update_option( DZUVO_MIGRATED_PAGE, gmdate( 'c' ) );
	}
}

/**
 * Écrit une ancienne valeur dans le champ ACF, si celui-ci est encore vide.
 *
 * @param string $group  Identifiant du groupe ACF.
 * @param string $key    Clé du champ dans le schéma.
 * @param mixed  $legacy Ancienne valeur.
 */
function dzuvo_home_migrate_value( $post_id, $group, $key, $legacy ) {
	if ( '' === $legacy || null === $legacy || array() === $legacy ) {
		return;
	}

	// Déjà saisi dans ACF : on ne touche à rien.
	$current = dzuvo_home_meta( $post_id, $key );
	if ( '' !== $current && array() !== $current ) {
		return;
	}

	update_field( dzuvo_home_acf_key( $group, $key ), $legacy, $post_id );
}

/** Slides, offres, panneaux, bannières et témoignages. */
function dzuvo_home_migrate_posts() {
	$types = [
		DZUVO_SLIDE_TYPE       => [ 'slide', dzuvo_home_slide_fields() ],
		DZUVO_OFFER_TYPE       => [ 'offer', dzuvo_home_offer_fields() ],
		DZUVO_SPOTLIGHT_TYPE   => [ 'spotlight', dzuvo_home_spotlight_fields() ],
		DZUVO_BANNER_TYPE      => [ 'banner', dzuvo_home_banner_fields() ],
		DZUVO_TESTIMONIAL_TYPE => [ 'testimonial', dzuvo_home_testimonial_fields() ],
	];

	foreach ( $types as $post_type => [ $group, $fields ] ) {
		$ids = get_posts( [
			'post_type'        => $post_type,
			'post_status'      => 'any',
			'numberposts'      => -1,
			'fields'           => 'ids',
			'suppress_filters' => true,
		] );

		foreach ( $ids as $post_id ) {
			foreach ( $fields as $field ) {
				dzuvo_home_migrate_value(
					$post_id,
					$group,
					$field['key'],
					get_post_meta( $post_id, '_dzuvo_' . $field['key'], true )
				);
			}
		}
	}
}

/** Textes fixes et produits mis en avant, posés sur la page d'accueil. */
function dzuvo_home_migrate_page( $page_id ) {
	$settings = (array) get_option( DZUVO_SETTINGS_OPTION, [] );

	foreach ( dzuvo_home_settings_fields() as $field ) {
		dzuvo_home_migrate_value( $page_id, 'settings', $field['key'], $settings[ $field['key'] ] ?? '' );
	}

	dzuvo_home_migrate_value(
		$page_id,
		'products',
		DZUVO_PRODUCTS_FIELD,
		array_values( array_filter( array_map( 'absint', (array) get_option( DZUVO_PRODUCTS_OPTION, [] ) ) ) )
	);
}
