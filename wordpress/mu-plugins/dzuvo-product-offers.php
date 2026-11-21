<?php
/**
 * Plugin Name:  DZUVO — offres de quantité
 * Description:  Ajoute à chaque fiche produit WooCommerce des offres « prenez-en plus, payez moins » (ex. 2 articles : -10 %), lues par le site Nuxt.
 * Version:      1.0.0
 * Author:       DZUVO
 *
 * Où se règle une offre : Produits > modifier un produit > onglet « Général »,
 * sous les prix. Deux offres au plus par produit.
 *
 *   Offre 1 : à partir de [2] articles, [10] % de remise
 *   Offre 2 : à partir de [3] articles, [15] % de remise
 *
 * La remise s'applique à **toutes** les unités de la ligne dès que le seuil est
 * atteint, et elle se calcule sur le prix du moment (promotion comprise).
 *
 * Les valeurs sont rangées dans des champs personnalisés **sans tiret bas
 * initial** (`dzuvo_offer1_qty`…) : WooCommerce ne publie pas dans son API les
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

/** Rangs d'offre proposés. Le site en lit deux : en ajouter ici ne suffit pas. */
const DZUVO_OFFER_RANKS = [ 1, 2 ];

add_action( 'woocommerce_product_options_pricing', function () {
	echo '<div class="options_group dzuvo-offers">';
	echo '<p class="form-field" style="margin-bottom:0"><strong>Offres de quantité (site DZUVO)</strong></p>';
	echo '<p class="description" style="margin:0 12px 8px 162px">Ex. « à partir de 2 articles, 10 % » : le client qui en prend 2 paie chacun 10 % moins cher. Laissez vide pour ne proposer aucune offre.</p>';

	foreach ( DZUVO_OFFER_RANKS as $rank ) {
		woocommerce_wp_text_input( [
			'id'                => "dzuvo_offer{$rank}_qty",
			'label'             => "Offre {$rank} — à partir de (articles)",
			'type'              => 'number',
			'desc_tip'          => true,
			'description'       => 'Nombre d’articles à partir duquel l’offre s’applique. 2 au minimum.',
			'custom_attributes' => [ 'min' => '2', 'max' => '99', 'step' => '1' ],
		] );
		woocommerce_wp_text_input( [
			'id'                => "dzuvo_offer{$rank}_percent",
			'label'             => "Offre {$rank} — remise (%)",
			'type'              => 'number',
			'desc_tip'          => true,
			'description'       => 'Pourcentage de remise sur la ligne, de 1 à 90.',
			'custom_attributes' => [ 'min' => '1', 'max' => '90', 'step' => '0.5' ],
		] );
	}

	echo '</div>';
} );

add_action( 'woocommerce_admin_process_product_object', function ( $product ) {
	foreach ( DZUVO_OFFER_RANKS as $rank ) {
		$qty_key     = "dzuvo_offer{$rank}_qty";
		$percent_key = "dzuvo_offer{$rank}_percent";

		// Les champs sont lus dans la requête d'enregistrement du produit ; WooCommerce
		// en a déjà vérifié le nonce et les droits avant d'appeler ce crochet.
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$qty = isset( $_POST[ $qty_key ] ) ? absint( wp_unslash( $_POST[ $qty_key ] ) ) : 0;
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$percent = isset( $_POST[ $percent_key ] ) ? (float) str_replace( ',', '.', wp_unslash( $_POST[ $percent_key ] ) ) : 0.0;

		// Une offre incomplète ou incohérente n'est pas gardée : mieux vaut
		// aucune offre qu'une remise à moitié saisie.
		if ( $qty < 2 || $qty > 99 || $percent <= 0 || $percent > 90 ) {
			$product->delete_meta_data( $qty_key );
			$product->delete_meta_data( $percent_key );
			continue;
		}

		$product->update_meta_data( $qty_key, (string) $qty );
		$product->update_meta_data( $percent_key, (string) $percent );
	}
} );
