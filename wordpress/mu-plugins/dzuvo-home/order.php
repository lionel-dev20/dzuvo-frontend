<?php
/**
 * Ordre d'affichage par glisser-déposer.
 *
 * L'ordre est celui de la page : la première slide s'affiche en premier, la
 * première offre occupe la première carte. Le demander sous forme de nombre
 * dans chaque contenu obligerait à ouvrir et renuméroter cinq fiches pour en
 * déplacer une seule. Les lignes du tableau se saisissent donc à la souris.
 *
 * WordPress fournit déjà jQuery UI Sortable dans l'administration : aucune
 * bibliothèque n'est ajoutée.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Types de contenu dont l'ordre se règle à la souris. */
function dzuvo_home_sortable_types() {
	return [ 'dzuvo_slide', 'dzuvo_offer', 'dzuvo_spotlight', 'dzuvo_banner', 'dzuvo_testimonial' ];
}

/**
 * Le tableau doit être trié par ordre manuel, sinon le glisser-déposer
 * réordonnerait un affichage classé par date : l'écran contredirait le site.
 */
add_action( 'pre_get_posts', function ( $query ) {
	if ( ! is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( ! in_array( $query->get( 'post_type' ), dzuvo_home_sortable_types(), true ) ) {
		return;
	}
	// Un tri demandé par l'utilisateur (clic sur une colonne) reste prioritaire.
	if ( $query->get( 'orderby' ) ) {
		return;
	}

	$query->set( 'orderby', 'menu_order' );
	$query->set( 'order', 'ASC' );
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	if ( 'edit.php' !== $hook ) {
		return;
	}

	$post_type = $_GET['post_type'] ?? '';
	if ( ! in_array( $post_type, dzuvo_home_sortable_types(), true ) ) {
		return;
	}

	wp_enqueue_script( 'jquery-ui-sortable' );

	$script = sprintf(
		'jQuery(function ($) {
			var list = $("#the-list");
			if (!list.length || list.find("tr").length < 2) return;

			var notice = $("<div class=\"notice notice-info inline\"><p>Glissez les lignes pour changer l’ordre d’affichage sur le site.</p></div>");
			$(".wp-header-end").after(notice);

			list.sortable({
				items: "tr",
				cursor: "move",
				axis: "y",
				helper: function (event, row) {
					// Sans cette reprise des largeurs, la ligne saisie s’effondre :
					// détachée du tableau, elle perd la mise en page des colonnes.
					row.children().each(function () { $(this).width($(this).width()); });
					return row;
				},
				update: function () {
					list.css("opacity", 0.6);
					$.post(ajaxurl, {
						action: "dzuvo_home_reorder",
						nonce: %s,
						ids: list.find("tr").map(function () {
							return this.id.replace("post-", "");
						}).get()
					}).always(function () { list.css("opacity", 1); });
				}
			});
		});',
		wp_json_encode( wp_create_nonce( 'dzuvo_home_reorder' ) )
	);

	wp_add_inline_script( 'jquery-ui-sortable', $script );
} );

/** Enregistre le nouvel ordre. Les positions repartent de 1, sans trou. */
add_action( 'wp_ajax_dzuvo_home_reorder', function () {
	check_ajax_referer( 'dzuvo_home_reorder', 'nonce' );

	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( 'droits insuffisants', 403 );
	}

	$ids = array_map( 'absint', (array) ( $_POST['ids'] ?? [] ) );
	$position = 0;

	foreach ( $ids as $id ) {
		if ( ! $id || ! current_user_can( 'edit_post', $id ) ) {
			continue;
		}
		if ( ! in_array( get_post_type( $id ), dzuvo_home_sortable_types(), true ) ) {
			continue;
		}

		$position++;
		wp_update_post( [ 'ID' => $id, 'menu_order' => $position ] );
	}

	wp_send_json_success( [ 'ordered' => $position ] );
} );

/**
 * Une nouvelle fiche se range en fin de liste.
 *
 * Sans cela, toutes les créations porteraient l'ordre 0 et se placeraient en
 * tête, devant un ordre déjà établi.
 */
add_action( 'wp_insert_post', function ( $post_id, $post, $update ) {
	if ( $update || ! in_array( $post->post_type, dzuvo_home_sortable_types(), true ) ) {
		return;
	}
	if ( 0 !== (int) $post->menu_order ) {
		return;
	}

	global $wpdb;
	$max = (int) $wpdb->get_var( $wpdb->prepare(
		"SELECT MAX(menu_order) FROM {$wpdb->posts} WHERE post_type = %s AND post_status != 'trash'",
		$post->post_type
	) );

	$wpdb->update( $wpdb->posts, [ 'menu_order' => $max + 1 ], [ 'ID' => $post_id ] );
	clean_post_cache( $post_id );
}, 10, 3 );
