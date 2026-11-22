<?php
/**
 * Plugin Name:  DZUVO — contenu de la page d'accueil
 * Description:  Rend la page d'accueil du site Nuxt modifiable depuis WordPress, section par section.
 * Version:      2.0.0
 * Author:       DZUVO
 *
 * WordPress ne charge automatiquement que les fichiers PHP posés à la racine
 * de mu-plugins/ : ce fichier est donc un chargeur, et le code vit dans le
 * sous-dossier du même nom, un fichier par section de la page d'accueil.
 *
 * Tout est servi au front par une seule route publique :
 *   GET /wp-json/dzuvo/v1/home
 *
 * La saisie passe par ACF (la version gratuite suffit) : les listes sont des
 * types de contenu portant chacun un groupe de champs, les textes fixes et la
 * sélection de produits se règlent sur la page d'accueil WordPress. La
 * lecture, elle, ne dépend pas d'ACF : voir fields.php.
 *
 * Rien n'est imposé au site : une section vide côté WordPress laisse le front
 * afficher le contenu livré avec le code. La page d'accueil ne peut donc pas
 * se retrouver blanche parce qu'un contenu n'a pas encore été saisi.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DZUVO_HOME_VERSION', '2.0.0' );
define( 'DZUVO_HOME_DIR', __DIR__ . '/dzuvo-home' );

/*
 * L'ordre compte : `fields.php` fournit le cadre de saisie dont dépendent les
 * sections, et `rest.php` assemble ce qu'elles ont déclaré.
 */
foreach ( [
	'fields.php',
	'order.php',
	'hero.php',
	'offers.php',
	'banners.php',
	'testimonials.php',
	'products.php',
	'settings.php',
	'migrate.php',
	'rest.php',
] as $part ) {
	require_once DZUVO_HOME_DIR . '/' . $part;
}

/**
 * Regroupe les écrans du plugin sous une entrée unique du menu d'administration.
 *
 * Sans cela, chaque type de contenu poserait sa propre entrée de premier niveau
 * et la colonne de gauche deviendrait illisible.
 */
add_action( 'admin_menu', function () {
	add_menu_page(
		'Page d’accueil',
		'Page d’accueil',
		'edit_posts',
		'dzuvo-home',
		'dzuvo_home_render_overview',
		'dashicons-layout',
		4
	);

	// Première entrée du sous-menu : la vue d'ensemble elle-même, sinon
	// WordPress y répète le titre du menu parent.
	add_submenu_page( 'dzuvo-home', 'Vue d’ensemble', 'Vue d’ensemble', 'edit_posts', 'dzuvo-home', 'dzuvo_home_render_overview' );
} );

/**
 * Entrée du sous-menu vers la page d'accueil WordPress, où se règlent les
 * textes fixes et les produits. Sans page identifiée, il n'y a rien à ouvrir.
 */
add_action( 'admin_menu', function () {
	$page_id = dzuvo_home_page_id();

	if ( $page_id ) {
		add_submenu_page( 'dzuvo-home', 'Titres, textes et produits', 'Titres, textes et produits', 'edit_posts', 'post.php?post=' . $page_id . '&action=edit' );
	}
} );

/**
 * Ce qui empêche la saisie, dit là où on la cherche : sur l'écran d'ensemble
 * et sur les listes. Sans cela, l'absence d'ACF ou de page se traduirait par
 * des écrans vides, sans explication.
 */
add_action( 'admin_notices', function () {
	$screen = get_current_screen();

	if ( ! $screen ) {
		return;
	}

	$ours = 'toplevel_page_dzuvo-home' === $screen->id || in_array( $screen->post_type, dzuvo_home_sortable_types(), true );

	if ( ! $ours ) {
		return;
	}

	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		echo '<div class="notice notice-error"><p><strong>ACF n’est pas actif.</strong> Installez et activez « Advanced Custom Fields » (la version gratuite suffit) : sans lui, les champs de saisie n’apparaissent pas. Le contenu déjà saisi continue d’être servi au site.</p></div>';
		return;
	}

	if ( ! dzuvo_home_page_id() ) {
		printf(
			'<div class="notice notice-warning"><p><strong>Aucune page d’accueil WordPress trouvée.</strong> Les titres, textes et produits se saisissent sur cette page. Choisissez-la dans <a href="%s">Réglages &gt; Lecture</a> (« Une page statique »), ou créez une page dont l’adresse est « accueil ».</p></div>',
			esc_url( admin_url( 'options-reading.php' ) )
		);
	}
} );

/** Écran d'accueil du plugin : ce qui est publié, et où le modifier. */
function dzuvo_home_render_overview() {
	$page_id   = dzuvo_home_page_id();
	$page_url  = $page_id ? get_edit_post_link( $page_id, 'raw' ) : admin_url( 'options-reading.php' );
	$page_verb = $page_id ? 'Modifier' : 'Choisir la page d’accueil';

	$sections = [
		[
			'title' => 'Carrousel principal',
			'text'  => 'Les slides du haut de page. La slide de marque porte le titre principal du site ; les autres tournent selon la saison.',
			'url'   => admin_url( 'edit.php?post_type=dzuvo_slide' ),
			'count' => wp_count_posts( 'dzuvo_slide' )->publish,
			'label' => 'slides publiées',
		],
		[
			'title' => 'Offres du moment',
			'text'  => 'Les quatre cartes promotionnelles et les deux panneaux larges qui les suivent.',
			'url'   => admin_url( 'edit.php?post_type=dzuvo_offer' ),
			'count' => wp_count_posts( 'dzuvo_offer' )->publish,
			'label' => 'offres publiées',
		],
		[
			'title' => 'Panneaux larges',
			'text'  => 'Les deux panneaux qui ferment les offres : préparation hivernale et conseils.',
			'url'   => admin_url( 'edit.php?post_type=dzuvo_spotlight' ),
			'count' => wp_count_posts( 'dzuvo_spotlight' )->publish,
			'label' => 'panneaux publiés',
		],
		[
			'title' => 'Bannières d’accès',
			'text'  => 'Les deux grandes images cliquables avant les engagements : surtitre, titre, bouton et lien.',
			'url'   => admin_url( 'edit.php?post_type=dzuvo_banner' ),
			'count' => wp_count_posts( 'dzuvo_banner' )->publish,
			'label' => 'bannières publiées',
		],
		[
			'title' => 'Témoignages',
			'text'  => 'Les avis clients des deux bandes défilantes. Ils se répartissent automatiquement entre le haut et le bas.',
			'url'   => admin_url( 'edit.php?post_type=dzuvo_testimonial' ),
			'count' => wp_count_posts( 'dzuvo_testimonial' )->publish,
			'label' => 'témoignages publiés',
		],
		[
			'title' => 'Produits de l’accueil',
			'text'  => 'Le produit du moment, la sélection de quatre produits et le carrousel. Les prix, les promotions, les offres de quantité et le stock sont lus dans WooCommerce : ils ne se saisissent pas ici.',
			'url'   => $page_url,
			'count' => count( dzuvo_home_selected_product_ids() ) + count( dzuvo_home_bundle_product_ids() ) + ( dzuvo_home_featured_product_id() ? 1 : 0 ),
			'verb'  => $page_verb,
			'label' => 'produits sélectionnés',
		],
		[
			'title' => 'Titres et textes des sections',
			'text'  => 'Un onglet par section : hero, produit du moment, sélection, livraison, engagements, appel final. Un champ vide garde le texte du site.',
			'url'   => $page_url,
			'count' => null,
			'label' => '',
			'verb'  => $page_verb,
		],
	];
	?>
	<div class="wrap">
		<h1>Page d’accueil</h1>
		<p style="max-width:46rem">
			Chaque bloc ci-dessous correspond à une section de la page d’accueil du site,
			dans l’ordre où le visiteur les rencontre. Une section laissée vide ici garde
			le contenu livré avec le site : rien ne disparaît par omission.
		</p>

		<div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(20rem,1fr));margin-top:1.5rem">
			<?php foreach ( $sections as $section ) : ?>
				<div class="card" style="max-width:none;margin:0">
					<h2 style="margin-top:0"><?php echo esc_html( $section['title'] ); ?></h2>
					<p><?php echo esc_html( $section['text'] ); ?></p>
					<?php if ( null !== $section['count'] ) : ?>
						<p><strong><?php echo (int) $section['count']; ?></strong> <?php echo esc_html( $section['label'] ); ?></p>
					<?php endif; ?>
					<a class="button button-primary" href="<?php echo esc_url( $section['url'] ); ?>"><?php echo esc_html( $section['verb'] ?? 'Modifier' ); ?></a>
				</div>
			<?php endforeach; ?>
		</div>

		<h2 style="margin-top:2rem">Vérifier ce que reçoit le site</h2>
		<p>
			La page d’accueil du site lit cette adresse :
			<code><a href="<?php echo esc_url( rest_url( 'dzuvo/v1/home' ) ); ?>" target="_blank" rel="noopener"><?php echo esc_html( rest_url( 'dzuvo/v1/home' ) ); ?></a></code>
		</p>
		<p class="description">
			Le site garde ce contenu en mémoire cinq minutes, mais WordPress le prévient à
			chaque enregistrement : une modification apparaît en ligne en quelques secondes.
		</p>
	</div>
	<?php
}
