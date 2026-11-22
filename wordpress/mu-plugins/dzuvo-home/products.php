<?php
/**
 * Section 6 — le carrousel de produits.
 *
 * Ici on ne saisit pas de produits : on en choisit. Le champ ne sert donc qu'à
 * retenir **des identifiants, dans un ordre** — rien d'autre.
 *
 * Nom, prix, promotion, note et stock ne sont pas recopiés dans la réponse :
 * le site les lit déjà dans WooCommerce par sa propre couche catalogue, celle
 * qui sert les fiches produit et le panier. Les republier ici reviendrait à
 * tenir deux prix pour un même article — et le jour où ils divergent, c'est la
 * page d'accueil qui ment, puisque le panier recalcule tout depuis la boutique.
 *
 * C'est aussi ce qui répare le bouton « Ajouter » du carrousel : les produits
 * mis en avant arrivent enfin sous la même forme que ceux du catalogue, celle
 * que le panier sait accepter.
 *
 * Le champ est une « Relation » ACF (gratuite) : recherche au fil de la frappe,
 * nombre limité, et ordre réglé à la souris — celui du carrousel.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Ancien emplacement de la sélection (avant ACF) : lu une seule fois, par la migration. */
const DZUVO_PRODUCTS_OPTION = 'dzuvo_home_products';
const DZUVO_PRODUCTS_MAX    = 12;

/** Nom du champ ACF qui porte la sélection. */
const DZUVO_PRODUCTS_FIELD = 'products';
const DZUVO_FEATURED_FIELD = 'featured_product';
const DZUVO_BUNDLE_FIELD   = 'bundle_products';
const DZUVO_BUNDLE_MAX     = 4;

/** Identifiants retenus, dans l'ordre d'affichage. */
function dzuvo_home_selected_product_ids() {
	$page_id = dzuvo_home_page_id();

	if ( ! $page_id ) {
		return [];
	}

	// ACF enregistre une relation sous forme de liste sérialisée d'identifiants.
	$stored = dzuvo_home_meta( $page_id, DZUVO_PRODUCTS_FIELD );

	return array_values( array_unique( array_filter( array_map( 'absint', (array) $stored ) ) ) );
}

dzuvo_home_add_field_group(
	'products',
	'Produits de l’accueil',
	[
		[
			'acf' => [
				'key'           => dzuvo_home_acf_key( 'products', DZUVO_PRODUCTS_FIELD ),
				'label'         => 'Produits mis en avant',
				'name'          => DZUVO_HOME_FIELD_PREFIX . DZUVO_PRODUCTS_FIELD,
				'type'          => 'relationship',
				'instructions'  => sprintf(
					'Choisissez les produits du carrousel, dans l’ordre où ils doivent apparaître (glissez pour réordonner). Prix, promotions, notes et disponibilité ne se saisissent pas ici : ils sont lus dans la fiche WooCommerce de chaque produit. %d produits au maximum. Sans sélection, le site garde celle livrée avec lui.',
					DZUVO_PRODUCTS_MAX
				),
				'required'      => 0,
				'post_type'     => [ 'product' ],
				'post_status'   => [ 'publish' ],
				'filters'       => [ 'search' ],
				'elements'      => [ 'featured_image' ],
				'max'           => DZUVO_PRODUCTS_MAX,
				'return_format' => 'id',
			],
		],
		[
			'acf' => [
				'key'           => dzuvo_home_acf_key( 'products', DZUVO_FEATURED_FIELD ),
				'label'         => 'Produit du moment',
				'name'          => DZUVO_HOME_FIELD_PREFIX . DZUVO_FEATURED_FIELD,
				'type'          => 'relationship',
				'instructions'  => 'Le produit mis en vedette sous le hero : prix, prix barré, stock et offres de quantité (« Acheter 2, -5 % ») sont lus dans sa fiche WooCommerce. Un seul produit. Sans sélection, le site garde le sien.',
				'required'      => 0,
				'post_type'     => [ 'product' ],
				'post_status'   => [ 'publish' ],
				'filters'       => [ 'search' ],
				'elements'      => [ 'featured_image' ],
				'max'           => 1,
				'return_format' => 'id',
			],
		],
		[
			'acf' => [
				'key'           => dzuvo_home_acf_key( 'products', DZUVO_BUNDLE_FIELD ),
				'label'         => 'Sélection de quatre produits',
				'name'          => DZUVO_HOME_FIELD_PREFIX . DZUVO_BUNDLE_FIELD,
				'type'          => 'relationship',
				'instructions'  => sprintf(
					'Les produits qui vont ensemble, dans l’ordre d’affichage. Le nom et le résumé de chaque fiche servent de titre et de texte. %d au maximum. Sans sélection, le site garde la sienne.',
					DZUVO_BUNDLE_MAX
				),
				'required'      => 0,
				'post_type'     => [ 'product' ],
				'post_status'   => [ 'publish' ],
				'filters'       => [ 'search' ],
				'elements'      => [ 'featured_image' ],
				'max'           => DZUVO_BUNDLE_MAX,
				'return_format' => 'id',
			],
		],
	],
	'dzuvo_home_location_home_page',
	20
);

/**
 * Identifiants des produits du carrousel, dans l'ordre choisi.
 *
 * C'est tout ce que WordPress a à dire ici. Le site va ensuite chercher ces
 * produits par sa couche catalogue, celle-là même qui sert les fiches produit
 * et le panier : une seule traduction de WooCommerce vers le site, donc un
 * seul endroit où un prix peut se tromper.
 *
 * Un produit dépublié ou supprimé est écarté sans bruit : il ne doit pas
 * rester en vitrine.
 */
function dzuvo_home_product_ids() {
	if ( ! function_exists( 'wc_get_product' ) ) {
		return [];
	}

	$out = [];

	foreach ( dzuvo_home_selected_product_ids() as $product_id ) {
		$product = wc_get_product( $product_id );

		if ( ! $product || 'publish' !== get_post_status( $product->get_id() ) ) {
			continue;
		}

		$out[] = $product->get_id();
	}

	return array_slice( $out, 0, DZUVO_PRODUCTS_MAX );
}

/**
 * Identifiants d'une relation ACF, les produits dépubliés ou supprimés écartés.
 * Même règle que pour le carrousel : rien d'absent ne reste en vitrine.
 */
function dzuvo_home_relation_product_ids( $field, $max ) {
	$page_id = dzuvo_home_page_id();

	if ( ! $page_id || ! function_exists( 'wc_get_product' ) ) {
		return [];
	}

	$stored = (array) dzuvo_home_meta( $page_id, $field );
	$out    = [];

	foreach ( array_unique( array_filter( array_map( 'absint', $stored ) ) ) as $product_id ) {
		$product = wc_get_product( $product_id );

		if ( $product && 'publish' === get_post_status( $product->get_id() ) ) {
			$out[] = $product->get_id();
		}
	}

	return array_slice( $out, 0, $max );
}

/** Produit du moment : un identifiant, ou rien. */
function dzuvo_home_featured_product_id() {
	$ids = dzuvo_home_relation_product_ids( DZUVO_FEATURED_FIELD, 1 );

	return $ids[0] ?? 0;
}

/** Les produits de la sélection, dans l'ordre choisi. */
function dzuvo_home_bundle_product_ids() {
	return dzuvo_home_relation_product_ids( DZUVO_BUNDLE_FIELD, DZUVO_BUNDLE_MAX );
}
