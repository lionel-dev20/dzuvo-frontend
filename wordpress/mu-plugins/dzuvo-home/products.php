<?php
/**
 * Section 6 — le carrousel de produits.
 *
 * Ici on ne saisit pas de produits : on en choisit. Cet écran ne sert donc
 * qu'à retenir **des identifiants, dans un ordre** — rien d'autre.
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
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_PRODUCTS_OPTION = 'dzuvo_home_products';
const DZUVO_PRODUCTS_MAX    = 12;

/** Identifiants des produits retenus, dans l'ordre d'affichage. */
function dzuvo_home_selected_product_ids() {
	return array_values( array_filter( array_map( 'absint', (array) get_option( DZUVO_PRODUCTS_OPTION, [] ) ) ) );
}

add_action( 'admin_menu', function () {
	add_submenu_page(
		'dzuvo-home',
		'Produits mis en avant',
		'Produits mis en avant',
		'edit_posts',
		'dzuvo-home-products',
		'dzuvo_home_render_products_page'
	);
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( 'page-daccueil_page_dzuvo-home-products' !== $hook && false === strpos( $hook, 'dzuvo-home-products' ) ) {
		return;
	}
	if ( ! function_exists( 'WC' ) ) {
		return;
	}

	// Champ de recherche de produits fourni par WooCommerce : il interroge la
	// boutique au fil de la frappe, ce qu'une liste déroulante ne peut pas
	// faire au-delà de quelques dizaines d'articles.
	wp_enqueue_script( 'wc-enhanced-select' );
	wp_enqueue_style( 'woocommerce_admin_styles' );
} );

function dzuvo_home_render_products_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( 'Droits insuffisants.' );
	}

	$woo_active = function_exists( 'wc_get_product' );
	$selected   = dzuvo_home_selected_product_ids();
	$saved      = isset( $_GET['enregistre'] );
	?>
	<div class="wrap">
		<h1>Produits mis en avant</h1>

		<?php if ( $saved ) : ?>
			<div class="notice notice-success is-dismissible"><p>Sélection enregistrée.</p></div>
		<?php endif; ?>

		<?php if ( ! $woo_active ) : ?>
			<div class="notice notice-error">
				<p>WooCommerce n’est pas actif sur ce site : aucun produit ne peut être choisi.
				Le carrousel de la page d’accueil garde la sélection livrée avec le site.</p>
			</div>
			<?php return; ?>
		<?php endif; ?>

		<p style="max-width:46rem">
			Choisissez les produits du carrousel, dans l’ordre où ils doivent apparaître.
			<strong>Prix, promotions, notes et disponibilité ne se saisissent pas ici</strong> :
			ils sont lus dans la fiche WooCommerce de chaque produit au moment de l’affichage.
			Pour changer un prix, c’est donc la fiche produit qu’il faut modifier.
			<?php echo (int) DZUVO_PRODUCTS_MAX; ?> produits au maximum sont retenus.
		</p>

		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="dzuvo_home_save_products">
			<?php wp_nonce_field( 'dzuvo_home_save_products' ); ?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="dzuvo-products">Produits</label></th>
					<td>
						<select
							id="dzuvo-products"
							name="products[]"
							multiple
							class="wc-product-search"
							style="width:100%;max-width:46rem"
							data-placeholder="Rechercher un produit…"
							data-action="woocommerce_json_search_products_and_variations"
						>
							<?php foreach ( $selected as $product_id ) : ?>
								<?php $product = wc_get_product( $product_id ); ?>
								<?php if ( $product ) : ?>
									<option value="<?php echo esc_attr( $product_id ); ?>" selected>
										<?php echo esc_html( wp_strip_all_tags( $product->get_formatted_name() ) ); ?>
									</option>
								<?php endif; ?>
							<?php endforeach; ?>
						</select>
						<p class="description">L’ordre de la liste est celui du carrousel. Retirez un produit avec la croix, ajoutez-en un en le cherchant par son nom.</p>
					</td>
				</tr>

			</table>

			<?php submit_button( 'Enregistrer la sélection' ); ?>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_dzuvo_home_save_products', function () {
	check_admin_referer( 'dzuvo_home_save_products' );

	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( 'Droits insuffisants.' );
	}

	$ids = array_map( 'absint', (array) ( $_POST['products'] ?? [] ) );
	$ids = array_values( array_unique( array_filter( $ids ) ) );

	update_option( DZUVO_PRODUCTS_OPTION, array_slice( $ids, 0, DZUVO_PRODUCTS_MAX ) );

	wp_safe_redirect( add_query_arg( 'enregistre', '1', admin_url( 'admin.php?page=dzuvo-home-products' ) ) );
	exit;
} );

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

	return $out;
}
