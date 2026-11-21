<?php
/**
 * Plugin Name:  DZUVO — offres de quantité
 * Description:  Ajoute à chaque fiche produit WooCommerce des offres « prenez-en plus, payez moins » (ex. 2 articles : -10 %), lues par le site Nuxt.
 * Version:      1.0.0
 * Author:       DZUVO
 *
 * Où se règle une offre : Produits > modifier un produit > onglet « Général »,
 * sous les prix. Deux remises, aux quantités fixes de 2 et de 3 :
 *
 *   Acheter 2 articles : [10] % de remise
 *   Acheter 3 articles : [15] % de remise
 *
 * Sur la fiche, le client choisit entre « Acheter 1 » (prix actuel), « Acheter 2 »
 * et « Acheter 3 ». La remise s'applique à **toutes** les unités du lot et se
 * calcule sur le prix du moment (promotion comprise).
 *
 * Les valeurs sont rangées dans des champs personnalisés **sans tiret bas
 * initial** (`dzuvo_offer1_percent`, `dzuvo_offer2_percent`) : WooCommerce ne publie pas dans son API les
 * métadonnées dont la clé commence par « _ », et c'est par l'API que le site
 * les lit.
 *
 * C'est le site qui applique la remise au panier et à la commande — pas
 * WooCommerce : la boutique est headless, la commande est créée par l'API avec
 * le prix déjà remisé. Cette extension ne fait donc que **saisir** l'offre.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Offres proposées : rang => nombre d'articles. Le site lit ces deux rangs, pas d'autres. */
const DZUVO_OFFER_TIERS = [ 1 => 2, 2 => 3 ];

add_action( 'woocommerce_product_options_pricing', function () {
	echo '<div class="options_group dzuvo-offers">';
	echo '<p class="form-field" style="margin-bottom:0"><strong>Offres de quantité (site DZUVO)</strong></p>';
	echo '<p class="description" style="margin:0 12px 8px 162px">Sur la fiche, le client choisit « Acheter 1 » (prix actuel), « Acheter 2 » ou « Acheter 3 ». Indiquez ci-dessous la remise de chaque lot, ou laissez vide pour ne pas proposer le lot.</p>';

	foreach ( DZUVO_OFFER_TIERS as $rank => $quantity ) {
		woocommerce_wp_text_input( [
			'id'                => "dzuvo_offer{$rank}_percent",
			'label'             => "Acheter {$quantity} — remise (%)",
			'type'              => 'number',
			'desc_tip'          => true,
			'description'       => $rank > 1
				? 'Pourcentage de remise sur les 3 articles, de 1 à 90. Doit dépasser celle de « Acheter 2 », sinon le lot n’est pas proposé.'
				: 'Pourcentage de remise sur les 2 articles, de 1 à 90.',
			'custom_attributes' => [ 'min' => '1', 'max' => '90', 'step' => '0.5' ],
		] );
	}

	echo '</div>';
} );

add_action( 'woocommerce_admin_process_product_object', function ( $product ) {
	foreach ( DZUVO_OFFER_TIERS as $rank => $quantity ) {
		$percent_key = "dzuvo_offer{$rank}_percent";

		// Les quantités sont fixes : l'ancien champ « à partir de » n'existe plus.
		// On le retire pour qu'une valeur d'une version précédente ne détourne
		// pas le lot de sa quantité.
		$product->delete_meta_data( "dzuvo_offer{$rank}_qty" );

		// Les champs sont lus dans la requête d'enregistrement du produit ; WooCommerce
		// en a déjà vérifié le nonce et les droits avant d'appeler ce crochet.
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$percent = isset( $_POST[ $percent_key ] ) ? (float) str_replace( ',', '.', wp_unslash( $_POST[ $percent_key ] ) ) : 0.0;

		// Une remise vide ou hors bornes n'est pas gardée : mieux vaut aucun lot
		// qu'une remise à moitié saisie.
		if ( $percent <= 0 || $percent > 90 ) {
			$product->delete_meta_data( $percent_key );
			continue;
		}

		$product->update_meta_data( $percent_key, (string) $percent );
	}
} );
