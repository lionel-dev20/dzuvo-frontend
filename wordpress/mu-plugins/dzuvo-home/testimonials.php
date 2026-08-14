<?php
/**
 * Section 9 — les témoignages clients.
 *
 * Le titre de la fiche est le nom affiché sous l'avis : c'est ce qui rend le
 * tableau de l'administration lisible, et cela évite un champ « auteur » qui
 * ferait double emploi avec lui.
 *
 * Les deux bandes défilantes ne se composent pas à la main : la liste est
 * coupée en son milieu, la première moitié défile vers la gauche, la seconde
 * vers la droite. Demander à quelle bande appartient chaque avis ajouterait un
 * choix sans conséquence visible pour qui rédige.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_TESTIMONIAL_TYPE = 'dzuvo_testimonial';

function dzuvo_home_testimonial_fields() {
	return [
		[
			'key'   => 'quote',
			'label' => 'Témoignage',
			'type'  => 'textarea',
			'help'  => 'Deux à trois lignes. Les cartes ont toutes la même largeur : un avis très long y sera à l’étroit.',
		],
		[
			'key'         => 'city',
			'label'       => 'Ville',
			'type'        => 'text',
			'placeholder' => 'Montréal',
		],
		[
			'key'   => 'rating',
			'label' => 'Note sur 5',
			'type'  => 'number',
			'help'  => 'Nombre entier de 1 à 5. Vide ou hors bornes : cinq étoiles.',
		],
	];
}

add_action( 'init', function () {
	dzuvo_home_register_type( DZUVO_TESTIMONIAL_TYPE, 'Témoignage', 'Témoignages', [
		// Pas de visuel : les cartes n'affichent ni photo ni avatar.
		'supports' => [ 'title' ],
	] );
} );

dzuvo_home_add_meta_box( DZUVO_TESTIMONIAL_TYPE, 'dzuvo_testimonial_details', 'Contenu du témoignage', dzuvo_home_testimonial_fields() );

add_filter( 'manage_' . DZUVO_TESTIMONIAL_TYPE . '_posts_columns', function ( $columns ) {
	return [
		'cb'     => $columns['cb'],
		'title'  => 'Client',
		'quote'  => 'Témoignage',
		'city'   => 'Ville',
		'rating' => 'Note',
	];
} );

add_action( 'manage_' . DZUVO_TESTIMONIAL_TYPE . '_posts_custom_column', function ( $column, $post_id ) {
	if ( 'quote' === $column ) {
		echo esc_html( wp_trim_words( get_post_meta( $post_id, '_dzuvo_quote', true ), 14 ) ?: '—' );
	}
	if ( 'city' === $column ) {
		echo esc_html( get_post_meta( $post_id, '_dzuvo_city', true ) ?: '—' );
	}
	if ( 'rating' === $column ) {
		$rating = (int) get_post_meta( $post_id, '_dzuvo_rating', true );
		echo esc_html( $rating >= 1 && $rating <= 5 ? str_repeat( '★', $rating ) : '★★★★★' );
	}
}, 10, 2 );

/**
 * Témoignages publiés, répartis en deux bandes.
 *
 * @return array{top: array, bottom: array}
 */
function dzuvo_home_testimonials() {
	$fields = dzuvo_home_testimonial_fields();
	$items  = [];

	foreach ( dzuvo_home_posts( DZUVO_TESTIMONIAL_TYPE, 30 ) as $post ) {
		$values = dzuvo_home_get_fields( $post->ID, $fields );
		$author = trim( $post->post_title );
		$quote  = trim( $values['quote'] ?? '' );

		// Un avis sans texte ni nom n'a rien à montrer.
		if ( '' === $quote || '' === $author ) {
			continue;
		}

		$rating = (int) ( $values['rating'] ?? 5 );

		$items[] = [
			'id'     => dzuvo_home_slug( $post ),
			'quote'  => $quote,
			'author' => $author,
			'city'   => $values['city'] ?? '',
			'rating' => ( $rating >= 1 && $rating <= 5 ) ? $rating : 5,
		];
	}

	/*
	 * Les deux bandes défilent en boucle, chacune affichant ses cartes en
	 * double. En dessous de quatre avis au total, la boucle se voit : on laisse
	 * alors le site servir sa propre liste plutôt que d'exposer une couture.
	 */
	if ( count( $items ) < 4 ) {
		return [ 'top' => [], 'bottom' => [] ];
	}

	$half = (int) ceil( count( $items ) / 2 );

	return [
		'top'    => array_slice( $items, 0, $half ),
		'bottom' => array_slice( $items, $half ),
	];
}
