<?php
/**
 * Section 5 — « Nos offres du moment ».
 *
 * Deux formes distinctes, donc deux types de contenu plutôt qu'un seul avec un
 * sélecteur : une carte promotionnelle porte un bloc tarifaire, un panneau
 * large porte une photo et une accroche. Réunis, la moitié des champs serait
 * toujours hors sujet pour la fiche ouverte.
 *
 * Les quatre premières cartes et les deux premiers panneaux sont retenus : la
 * grille de la page d'accueil est dessinée pour ce compte.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_OFFER_TYPE     = 'dzuvo_offer';
const DZUVO_SPOTLIGHT_TYPE = 'dzuvo_spotlight';

function dzuvo_home_offer_fields() {
	return [
		[
			'key'         => 'to',
			'label'       => 'Lien',
			'type'        => 'url',
			'placeholder' => '/categories/batteries',
			'help'        => 'Rubrique ou produit visé par la carte.',
		],
		[
			'key'         => 'badge',
			'label'       => 'Pastille',
			'type'        => 'text',
			'placeholder' => 'Promo',
			'help'        => 'Facultatif. S’affiche en haut de la carte.',
		],
		[
			'key'         => 'headline',
			'label'       => 'Accroche chiffrée',
			'type'        => 'text',
			'placeholder' => 'Jusqu’à -30 %',
			'help'        => 'S’affiche en très grand, à la place du bloc de prix. Renseigner celle-ci ou le prix, pas les deux.',
		],
		[
			'key'         => 'fromLabel',
			'label'       => 'Mention avant le prix',
			'type'        => 'text',
			'placeholder' => 'À partir de',
		],
		[
			'key'         => 'oldPrice',
			'label'       => 'Ancien prix',
			'type'        => 'text',
			'placeholder' => '129,99 $',
			'help'        => 'Affiché barré, à côté de la remise.',
		],
		[
			'key'         => 'discount',
			'label'       => 'Remise',
			'type'        => 'text',
			'placeholder' => '-30 $',
		],
		[
			'key'         => 'price',
			'label'       => 'Prix affiché',
			'type'        => 'text',
			'placeholder' => '99,99 $',
		],
		[
			'key'         => 'note',
			'label'       => 'Précision sous le titre',
			'type'        => 'text',
			'placeholder' => 'offerts en bon d’achat*',
		],
		[
			'key'         => 'fineprint',
			'label'       => 'Mention légale',
			'type'        => 'text',
			'placeholder' => '*voir conditions',
		],
		[
			'key'         => 'until',
			'label'       => 'Validité',
			'type'        => 'text',
			'placeholder' => 'Jusqu’au 1er septembre 2026',
			'help'        => 'Texte libre : la date n’est pas contrôlée, l’offre ne disparaît pas toute seule.',
		],
	];
}

function dzuvo_home_spotlight_fields() {
	return [
		[
			'key'         => 'to',
			'label'       => 'Lien',
			'type'        => 'url',
			'placeholder' => '/categories/trousse-hiver',
		],
		[
			'key'         => 'ribbon',
			'label'       => 'Bandeau',
			'type'        => 'text',
			'placeholder' => 'Des prix malins pour les grands trajets',
			'help'        => 'Facultatif. Ruban posé au-dessus du titre.',
		],
		[
			'key'         => 'subtitle',
			'label'       => 'Sous-titre',
			'type'        => 'text',
			'placeholder' => '+ Diagnostic batterie et essuie-glaces',
		],
		[
			'key'   => 'note',
			'label' => 'Précision',
			'type'  => 'text',
		],
		[
			'key'   => 'cover',
			'label' => 'Photo plein cadre',
			'type'  => 'checkbox',
			'help'  => 'Coché : le texte se pose par-dessus la photo. Décoché : la photo occupe la moitié du panneau.',
		],
	];
}

add_action( 'init', function () {
	dzuvo_home_register_type( DZUVO_OFFER_TYPE, 'Offre', 'Offres du moment' );
	dzuvo_home_register_type( DZUVO_SPOTLIGHT_TYPE, 'Panneau', 'Panneaux larges' );
} );

dzuvo_home_add_meta_box( DZUVO_OFFER_TYPE, 'dzuvo_offer_details', 'Contenu de la carte', dzuvo_home_offer_fields() );
dzuvo_home_add_meta_box( DZUVO_SPOTLIGHT_TYPE, 'dzuvo_spotlight_details', 'Contenu du panneau', dzuvo_home_spotlight_fields() );

add_filter( 'manage_' . DZUVO_OFFER_TYPE . '_posts_columns', function ( $columns ) {
	return [
		'cb'    => $columns['cb'],
		'thumb' => 'Visuel',
		'title' => 'Titre',
		'offre' => 'Offre',
		'until' => 'Validité',
	];
} );

add_action( 'manage_' . DZUVO_OFFER_TYPE . '_posts_custom_column', function ( $column, $post_id ) {
	if ( 'thumb' === $column ) {
		echo has_post_thumbnail( $post_id ) ? get_the_post_thumbnail( $post_id, [ 60, 60 ] ) : '<span class="description">—</span>';
	}
	if ( 'offre' === $column ) {
		$price    = get_post_meta( $post_id, '_dzuvo_price', true );
		$headline = get_post_meta( $post_id, '_dzuvo_headline', true );
		echo esc_html( $headline ?: ( $price ?: '—' ) );
	}
	if ( 'until' === $column ) {
		echo esc_html( get_post_meta( $post_id, '_dzuvo_until', true ) ?: '—' );
	}
}, 10, 2 );

/** Les quatre cartes de la grille, dans l'ordre choisi. */
function dzuvo_home_offers() {
	$fields = dzuvo_home_offer_fields();
	$out    = [];

	foreach ( dzuvo_home_posts( DZUVO_OFFER_TYPE, 4 ) as $post ) {
		$title = trim( $post->post_title );
		if ( '' === $title ) {
			continue;
		}

		$card = array_merge(
			[ 'id' => dzuvo_home_slug( $post ), 'title' => $title ],
			dzuvo_home_get_fields( $post->ID, $fields )
		);

		$image = dzuvo_home_image_url( $post->ID );
		if ( $image ) {
			$card['image'] = $image;
		}

		// Sans lien, la carte n'est plus cliquable : on la renvoie tout de même,
		// le front la rendra inerte plutôt que de la faire disparaître.
		$out[] = $card;
	}

	return $out;
}

/** Les deux panneaux larges qui ferment la section. */
function dzuvo_home_spotlights() {
	$fields = dzuvo_home_spotlight_fields();
	$out    = [];

	foreach ( dzuvo_home_posts( DZUVO_SPOTLIGHT_TYPE, 2 ) as $post ) {
		$title = trim( $post->post_title );
		if ( '' === $title ) {
			continue;
		}

		$panel = array_merge(
			[ 'id' => dzuvo_home_slug( $post ), 'title' => $title ],
			dzuvo_home_get_fields( $post->ID, $fields )
		);

		$image = dzuvo_home_image_url( $post->ID );
		if ( $image ) {
			$panel['image'] = $image;
		}

		$out[] = $panel;
	}

	return $out;
}
