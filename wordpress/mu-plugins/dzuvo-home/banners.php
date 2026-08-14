<?php
/**
 * Section 8 — les deux bannières d'accès.
 *
 * Une image, un libellé posé dessus, un lien. Le texte de remplacement est un
 * champ à part entière : ces bannières sont de grandes photos porteuses de
 * sens, et un lecteur d'écran n'a rien d'autre pour les annoncer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_BANNER_TYPE = 'dzuvo_banner';

function dzuvo_home_banner_fields() {
	return [
		[
			'key'         => 'label',
			'label'       => 'Texte du bouton',
			'type'        => 'text',
			'placeholder' => 'Pour les distributeurs',
			'help'        => 'Posé sur la photo, en bas à droite.',
		],
		[
			'key'         => 'to',
			'label'       => 'Lien',
			'type'        => 'url',
			'placeholder' => '/professionnels',
		],
		[
			'key'         => 'alt',
			'label'       => 'Description de l’image',
			'type'        => 'text',
			'placeholder' => 'Entrepôt DZUVO et préparation des commandes',
			'help'        => 'Lue par les lecteurs d’écran et affichée si la photo ne charge pas. À défaut, le texte du bouton est utilisé.',
		],
	];
}

add_action( 'init', function () {
	dzuvo_home_register_type( DZUVO_BANNER_TYPE, 'Bannière', 'Bannières d’accès' );
} );

dzuvo_home_add_meta_box( DZUVO_BANNER_TYPE, 'dzuvo_banner_details', 'Contenu de la bannière', dzuvo_home_banner_fields() );

add_filter( 'manage_' . DZUVO_BANNER_TYPE . '_posts_columns', function ( $columns ) {
	return [
		'cb'    => $columns['cb'],
		'thumb' => 'Visuel',
		'title' => 'Titre interne',
		'label' => 'Texte du bouton',
		'to'    => 'Lien',
	];
} );

add_action( 'manage_' . DZUVO_BANNER_TYPE . '_posts_custom_column', function ( $column, $post_id ) {
	if ( 'thumb' === $column ) {
		echo has_post_thumbnail( $post_id ) ? get_the_post_thumbnail( $post_id, [ 80, 45 ] ) : '<span class="description">—</span>';
	}
	if ( 'label' === $column ) {
		echo esc_html( get_post_meta( $post_id, '_dzuvo_label', true ) ?: '—' );
	}
	if ( 'to' === $column ) {
		echo esc_html( get_post_meta( $post_id, '_dzuvo_to', true ) ?: '—' );
	}
}, 10, 2 );

/**
 * Les deux bannières publiées.
 *
 * Une bannière sans image n'est pas servie : le bloc n'est qu'une photo, il
 * n'aurait rien à montrer.
 */
function dzuvo_home_banners() {
	$fields = dzuvo_home_banner_fields();
	$out    = [];

	foreach ( dzuvo_home_posts( DZUVO_BANNER_TYPE, 2 ) as $post ) {
		$values = dzuvo_home_get_fields( $post->ID, $fields );
		$image  = dzuvo_home_image_url( $post->ID );

		if ( ! $image || empty( $values['label'] ) ) {
			continue;
		}

		$out[] = [
			'id'    => dzuvo_home_slug( $post ),
			'label' => $values['label'],
			'to'    => $values['to'] ?? '/',
			'image' => $image,
			'alt'   => $values['alt'] ?? $values['label'],
		];
	}

	return $out;
}
