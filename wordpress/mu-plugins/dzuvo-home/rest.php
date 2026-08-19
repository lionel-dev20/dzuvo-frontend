<?php
/**
 * La route que lit le site : GET /wp-json/dzuvo/v1/home.
 *
 * Une seule requête sert toute la page d'accueil. La découper par section
 * multiplierait les allers-retours sur le chemin critique du rendu, pour un
 * contenu qui est de toute façon affiché d'un bloc.
 *
 * Lecture publique et non authentifiée, comme pour les menus : ce contenu est
 * déjà destiné à la page la plus visitée du site.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'dzuvo/v1', '/home', [
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'dzuvo_home_rest_response',
	] );
} );

/**
 * Interdit la mise en cache des routes « dzuvo ».
 *
 * L'hébergement pose `Cache-Control: public, max-age=604800` sur toutes les
 * réponses, API REST comprise — sept jours. Un menu corrigé aujourd'hui peut
 * donc être servi périmé pendant une semaine à qui passe par un cache
 * intermédiaire, sans que rien ne le signale.
 *
 * Ces routes existent pour refléter une saisie : elles doivent se relire.
 */
function dzuvo_home_no_cache( $response ) {
	if ( $response instanceof WP_REST_Response ) {
		$response->header( 'Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0' );
		$response->header( 'Expires', '0' );
		$response->header( 'Pragma', 'no-cache' );
	}

	return $response;
}

function dzuvo_home_rest_response() {
	// Chaque appel interroge la base : on ne les rejoue pas pour établir le
	// relevé ci-dessous.
	$slides       = dzuvo_home_slides();
	$offers       = dzuvo_home_offers();
	$spotlights   = dzuvo_home_spotlights();
	$banners      = dzuvo_home_banners();
	$product_ids  = dzuvo_home_product_ids();
	$testimonials = dzuvo_home_testimonials();
	$settings     = dzuvo_home_settings();

	return dzuvo_home_no_cache( rest_ensure_response( [
		'slides'       => $slides,
		'offers'       => $offers,
		'spotlights'   => $spotlights,
		'banners'      => $banners,
		'productIds'   => $product_ids,
		'testimonials' => $testimonials,
		// Forcé en objet : un tableau PHP vide se sérialise en `[]`, et le site
		// attend ici un dictionnaire de clés, pas une liste.
		'settings'     => (object) $settings,
		/*
		 * Sert au diagnostic : une section vide côté site peut vouloir dire
		 * « rien n'est publié » aussi bien que « WordPress n'a pas répondu ».
		 * Ce relevé tranche entre les deux.
		 */
		'counts'       => [
			'slides'       => count( $slides ),
			'offers'       => count( $offers ),
			'spotlights'   => count( $spotlights ),
			'banners'      => count( $banners ),
			'products'     => count( $product_ids ),
			'testimonials' => count( $testimonials['top'] ) + count( $testimonials['bottom'] ),
			'settings'     => count( $settings ),
		],
	] ) );
}
