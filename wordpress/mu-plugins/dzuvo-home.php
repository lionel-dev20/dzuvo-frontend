<?php
/**
 * Plugin Name:  DZUVO — contenu de la page d'accueil
 * Description:  Rend la page d'accueil du site Nuxt modifiable depuis WordPress, section par section.
 * Version:      1.0.0
 * Author:       DZUVO
 *
 * WordPress ne charge automatiquement que les fichiers PHP posés à la racine
 * de mu-plugins/ : ce fichier est donc un chargeur, et le code vit dans le
 * sous-dossier du même nom, un fichier par section de la page d'accueil.
 *
 * Tout est servi au front par une seule route publique :
 *   GET /wp-json/dzuvo/v1/home
 *
 * Rien n'est imposé au site : une section vide côté WordPress laisse le front
 * afficher le contenu livré avec le code. La page d'accueil ne peut donc pas
 * se retrouver blanche parce qu'un contenu n'a pas encore été saisi.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DZUVO_HOME_VERSION', '1.0.0' );
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

/** Écran d'accueil du plugin : ce qui est publié, et où le modifier. */
function dzuvo_home_render_overview() {
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
			'text'  => 'Les deux grandes images cliquables : distributeurs et catalogue.',
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
			'title' => 'Produits mis en avant',
			'text'  => 'La sélection du carrousel. Les prix, les promotions et le stock sont lus dans WooCommerce : ils ne se saisissent pas ici.',
			'url'   => admin_url( 'admin.php?page=dzuvo-home-products' ),
			'count' => count( dzuvo_home_selected_product_ids() ),
			'label' => 'produits sélectionnés',
		],
		[
			'title' => 'Titres et textes des sections',
			'text'  => 'Les intitulés fixes : vidéo, engagements, recherche de pièce, carte de livraison.',
			'url'   => admin_url( 'admin.php?page=dzuvo-home-settings' ),
			'count' => null,
			'label' => '',
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
					<a class="button button-primary" href="<?php echo esc_url( $section['url'] ); ?>">Modifier</a>
				</div>
			<?php endforeach; ?>
		</div>

		<h2 style="margin-top:2rem">Vérifier ce que reçoit le site</h2>
		<p>
			La page d’accueil du site lit cette adresse :
			<code><a href="<?php echo esc_url( rest_url( 'dzuvo/v1/home' ) ); ?>" target="_blank" rel="noopener"><?php echo esc_html( rest_url( 'dzuvo/v1/home' ) ); ?></a></code>
		</p>
		<p class="description">
			Le site garde ce contenu en mémoire cinq minutes : une modification peut mettre
			ce délai à apparaître en ligne. La page d’accueil étant pré-générée au moment du
			déploiement, elle demande en plus une reconstruction du site pour se figer à jour.
		</p>
	</div>
	<?php
}
