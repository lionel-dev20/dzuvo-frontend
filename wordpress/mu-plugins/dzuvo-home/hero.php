<?php
/**
 * Section 1 — le carrousel principal.
 *
 * Une slide = un contenu. Le titre de la fiche est le titre affiché, l'image
 * mise en avant est le visuel détouré, le reste tient dans les champs.
 *
 * La saison n'est pas calculée ici : WordPress dit à quelle période appartient
 * chaque slide, et le site compose le carrousel au moment du rendu. Le calcul
 * resterait sinon figé dans une réponse gardée en mémoire, et une slide d'hiver
 * pourrait s'afficher un 2 avril.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_SLIDE_TYPE = 'dzuvo_slide';

/** Périodes d'affichage possibles pour une slide. */
function dzuvo_home_slide_seasons() {
	return [
		'brand'  => 'Slide de marque (toujours en tête, porte le titre du site)',
		'always' => 'Toute l’année',
		'winter' => 'Hiver seulement (octobre à mars)',
		'summer' => 'Été seulement (avril à septembre)',
	];
}

function dzuvo_home_slide_fields() {
	return [
		[
			'key'         => 'eyebrow',
			'label'       => 'Surtitre',
			'type'        => 'text',
			'placeholder' => 'N° 1 des ventes',
			'help'        => 'Courte mention affichée au-dessus du titre.',
		],
		[
			'key'   => 'subtitle',
			'label' => 'Sous-titre',
			'type'  => 'textarea',
			'help'  => 'Deux lignes au plus : au-delà, le texte passe sous le visuel sur mobile.',
		],
		[
			'key'     => 'season',
			'label'   => 'Période d’affichage',
			'type'    => 'select',
			'options' => dzuvo_home_slide_seasons(),
			'help'    => 'Une seule slide doit porter « Slide de marque » : c’est elle qui contient le titre principal de la page, celui que lisent les moteurs de recherche.',
		],
		[
			'key'         => 'cta1_label',
			'label'       => 'Bouton principal — texte',
			'type'        => 'text',
			'placeholder' => 'Explorer le catalogue',
		],
		[
			'key'         => 'cta1_to',
			'label'       => 'Bouton principal — lien',
			'type'        => 'url',
			'placeholder' => '/categories',
			'help'        => 'Adresse sur le site, commençant par une barre oblique. Exemple : /categories/gonfleurs-de-pneus',
		],
		[
			'key'   => 'cta2_label',
			'label' => 'Bouton secondaire — texte',
			'type'  => 'text',
			'help'  => 'Facultatif. Laisser vide pour n’afficher qu’un seul bouton.',
		],
		[
			'key'   => 'cta2_to',
			'label' => 'Bouton secondaire — lien',
			'type'  => 'url',
		],
	];
}

add_action( 'init', function () {
	dzuvo_home_register_type( DZUVO_SLIDE_TYPE, 'Slide', 'Carrousel principal' );
} );

dzuvo_home_add_meta_box(
	DZUVO_SLIDE_TYPE,
	'dzuvo_slide_details',
	'Contenu de la slide',
	dzuvo_home_slide_fields()
);

/**
 * Colonnes du tableau : la saison et le visuel se lisent d'un coup d'œil.
 * Sans elles, dix slides se ressemblent toutes et il faut ouvrir chaque fiche.
 */
add_filter( 'manage_' . DZUVO_SLIDE_TYPE . '_posts_columns', function ( $columns ) {
	return [
		'cb'      => $columns['cb'],
		'thumb'   => 'Visuel',
		'title'   => 'Titre',
		'eyebrow' => 'Surtitre',
		'season'  => 'Période',
	];
} );

add_action( 'manage_' . DZUVO_SLIDE_TYPE . '_posts_custom_column', function ( $column, $post_id ) {
	if ( 'thumb' === $column ) {
		echo has_post_thumbnail( $post_id )
			? get_the_post_thumbnail( $post_id, [ 60, 60 ] )
			: '<span class="description">—</span>';
	}

	if ( 'eyebrow' === $column ) {
		echo esc_html( get_post_meta( $post_id, '_dzuvo_eyebrow', true ) ?: '—' );
	}

	if ( 'season' === $column ) {
		$seasons = dzuvo_home_slide_seasons();
		$value   = get_post_meta( $post_id, '_dzuvo_season', true );
		echo esc_html( $seasons[ $value ] ?? 'Toute l’année' );
	}
}, 10, 2 );

/**
 * Slides publiées, telles que le site les attend.
 *
 * Une slide sans titre n'est pas servie : le carrousel afficherait un cadre
 * vide, plus déroutant qu'une slide manquante.
 */
function dzuvo_home_slides() {
	$fields = dzuvo_home_slide_fields();
	$out    = [];

	foreach ( dzuvo_home_posts( DZUVO_SLIDE_TYPE, 20 ) as $post ) {
		$title = trim( $post->post_title );
		if ( '' === $title ) {
			continue;
		}

		$values = dzuvo_home_get_fields( $post->ID, $fields );

		$ctas = [];
		foreach ( [ 1, 2 ] as $rank ) {
			$label = $values[ "cta{$rank}_label" ] ?? '';
			$to    = $values[ "cta{$rank}_to" ] ?? '';
			if ( '' !== $label && '' !== $to ) {
				$ctas[] = [ 'label' => $label, 'to' => $to ];
			}
		}

		$slide = [
			'id'       => dzuvo_home_slug( $post ),
			'eyebrow'  => $values['eyebrow'] ?? '',
			'title'    => $title,
			'subtitle' => $values['subtitle'] ?? '',
			'season'   => $values['season'] ?? 'always',
			'ctas'     => $ctas,
		];

		$image = dzuvo_home_image_url( $post->ID );
		if ( $image ) {
			$slide['image'] = $image;
		}

		$out[] = $slide;
	}

	return $out;
}
