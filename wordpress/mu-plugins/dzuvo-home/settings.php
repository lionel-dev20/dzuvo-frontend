<?php
/**
 * Titres et textes fixes de la page d'accueil.
 *
 * Ce qui n'est pas une liste — un titre de section, une accroche, les trois
 * engagements — n'a pas besoin d'un type de contenu à lui : ce serait quatre
 * clics pour changer trois mots. Tout tient donc sur un écran, dans l'ordre où
 * les sections apparaissent sur le site.
 *
 * Un champ laissé vide n'efface rien : le site garde le texte livré avec lui.
 * C'est ce qui permet de ne remplir que ce qu'on veut changer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DZUVO_SETTINGS_OPTION = 'dzuvo_home_settings';

/**
 * Description de l'écran : des groupes, et dans chacun des champs.
 *
 * Les clés voyagent telles quelles jusqu'au site : les renommer ici demande de
 * les renommer là-bas.
 */
function dzuvo_home_settings_schema() {
	return [
		[
			'title'  => 'Recherche de pièce',
			'intro'  => 'Le bloc de formulaire placé juste sous le carrousel.',
			'fields' => [
				[ 'key' => 'partRequestTitle', 'label' => 'Titre', 'type' => 'text', 'placeholder' => 'Trouver ma pièce ou mon accessoire' ],
				[ 'key' => 'partRequestIntro', 'label' => 'Texte au-dessus du champ', 'type' => 'textarea' ],
				[ 'key' => 'partRequestShortcut1Title', 'label' => 'Raccourci 1 — titre', 'type' => 'text', 'placeholder' => 'Parler à un conseiller' ],
				[ 'key' => 'partRequestShortcut1Note', 'label' => 'Raccourci 1 — précision', 'type' => 'text', 'placeholder' => 'du lundi au samedi' ],
				[ 'key' => 'partRequestShortcut1To', 'label' => 'Raccourci 1 — lien', 'type' => 'url', 'placeholder' => '/contact' ],
				[ 'key' => 'partRequestShortcut2Title', 'label' => 'Raccourci 2 — titre', 'type' => 'text', 'placeholder' => 'Suivre ma commande' ],
				[ 'key' => 'partRequestShortcut2Note', 'label' => 'Raccourci 2 — précision', 'type' => 'text', 'placeholder' => 'livraison programmée' ],
				[ 'key' => 'partRequestShortcut2To', 'label' => 'Raccourci 2 — lien', 'type' => 'url', 'placeholder' => '/compte' ],
			],
		],
		[
			'title'  => 'Vidéo',
			'intro'  => 'Le bandeau vidéo qui grandit au défilement. L’affiche de repli s’affiche tant que la vidéo n’a pas démarré, et reste seule si le fichier manque.',
			'fields' => [
				[ 'key' => 'videoSrc', 'label' => 'Fichier vidéo', 'type' => 'url', 'placeholder' => '/videos/dzuvo-presentation.mp4', 'help' => 'Adresse du fichier MP4. Un fichier téléversé dans la médiathèque convient.' ],
				[ 'key' => 'videoTitle', 'label' => 'Accroche', 'type' => 'text', 'placeholder' => 'Des pièces' ],
				[ 'key' => 'videoTitleAccent', 'label' => 'Accroche — fin en rouge', 'type' => 'text', 'placeholder' => 'de confiance' ],
			],
		],
		[
			'title'  => 'Engagements',
			'intro'  => 'Les trois arguments alignés sous la vidéo. Les pictogrammes sont fixes : compatibilité, livraison, garantie.',
			'fields' => [
				[ 'key' => 'keyPoint1Title', 'label' => 'Engagement 1 — titre', 'type' => 'text', 'placeholder' => 'Compatible toutes marques' ],
				[ 'key' => 'keyPoint1Text', 'label' => 'Engagement 1 — texte', 'type' => 'textarea' ],
				[ 'key' => 'keyPoint2Title', 'label' => 'Engagement 2 — titre', 'type' => 'text', 'placeholder' => 'Livraison programmée' ],
				[ 'key' => 'keyPoint2Text', 'label' => 'Engagement 2 — texte', 'type' => 'textarea' ],
				[ 'key' => 'keyPoint3Title', 'label' => 'Engagement 3 — titre', 'type' => 'text', 'placeholder' => 'Garantie DZUVO' ],
				[ 'key' => 'keyPoint3Text', 'label' => 'Engagement 3 — texte', 'type' => 'textarea' ],
			],
		],
		[
			'title'  => 'Titres des sections à listes',
			'intro'  => 'Le contenu de ces sections se gère dans les écrans dédiés ; seul leur titre se règle ici.',
			'fields' => [
				[ 'key' => 'offersTitle', 'label' => 'Offres du moment — titre', 'type' => 'text', 'placeholder' => 'Nos offres du moment' ],
				[ 'key' => 'productsTitle', 'label' => 'Produits — titre', 'type' => 'text', 'placeholder' => 'Nos produits du moment' ],
			],
		],
		[
			'title'  => 'Carte de livraison',
			'intro'  => 'Le titre se compose de deux lignes : la première en gris, la seconde en blanc. Les villes et les délais, eux, viennent du site.',
			'fields' => [
				[ 'key' => 'mapTitleTop', 'label' => 'Titre — première ligne', 'type' => 'text', 'placeholder' => 'Livraison programmée' ],
				[ 'key' => 'mapTitleBottom', 'label' => 'Titre — seconde ligne', 'type' => 'text', 'placeholder' => 'D’une ville à l’autre, partout au Canada' ],
				[ 'key' => 'mapCounterTitle', 'label' => 'Compteur — titre', 'type' => 'text', 'placeholder' => 'Ils nous font confiance' ],
				[ 'key' => 'mapCounterText', 'label' => 'Compteur — texte', 'type' => 'textarea' ],
				[ 'key' => 'mapCounterValue', 'label' => 'Compteur — nombre de clients', 'type' => 'number', 'help' => 'Le chiffre défile de zéro jusqu’à cette valeur quand la carte entre à l’écran.' ],
			],
		],
		[
			'title'  => 'Témoignages',
			'intro'  => 'Le titre de la section. Les avis se gèrent dans l’écran « Témoignages ».',
			'fields' => [
				[ 'key' => 'testimonialsTitleTop', 'label' => 'Titre — première ligne', 'type' => 'text', 'placeholder' => 'Ce que disent nos clients' ],
				[ 'key' => 'testimonialsTitleBottom', 'label' => 'Titre — seconde ligne', 'type' => 'text', 'placeholder' => 'd’un océan à l’autre' ],
				[ 'key' => 'testimonialsIntro', 'label' => 'Texte d’introduction', 'type' => 'textarea' ],
			],
		],
	];
}

/** Tous les champs, à plat. */
function dzuvo_home_settings_fields() {
	$fields = [];
	foreach ( dzuvo_home_settings_schema() as $group ) {
		foreach ( $group['fields'] as $field ) {
			$fields[] = $field;
		}
	}

	return $fields;
}

/** Valeurs enregistrées, les champs vides écartés. */
function dzuvo_home_settings() {
	$stored = (array) get_option( DZUVO_SETTINGS_OPTION, [] );
	$out    = [];

	foreach ( dzuvo_home_settings_fields() as $field ) {
		$value = $stored[ $field['key'] ] ?? '';

		if ( '' === $value || null === $value ) {
			continue;
		}

		$out[ $field['key'] ] = 'number' === ( $field['type'] ?? 'text' ) ? 0 + $value : $value;
	}

	return $out;
}

add_action( 'admin_menu', function () {
	add_submenu_page(
		'dzuvo-home',
		'Titres et textes',
		'Titres et textes',
		'edit_posts',
		'dzuvo-home-settings',
		'dzuvo_home_render_settings_page'
	);
} );

function dzuvo_home_render_settings_page() {
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( 'Droits insuffisants.' );
	}

	$stored = (array) get_option( DZUVO_SETTINGS_OPTION, [] );
	?>
	<div class="wrap">
		<h1>Titres et textes des sections</h1>

		<?php if ( isset( $_GET['enregistre'] ) ) : ?>
			<div class="notice notice-success is-dismissible"><p>Modifications enregistrées.</p></div>
		<?php endif; ?>

		<p style="max-width:46rem">
			Les champs sont dans l’ordre des sections de la page d’accueil.
			<strong>Un champ vide n’efface rien</strong> : le site conserve alors le texte livré
			avec lui. Ne remplissez donc que ce que vous voulez changer — le texte gris de
			chaque champ montre ce qui s’affiche aujourd’hui.
		</p>

		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="dzuvo_home_save_settings">
			<?php wp_nonce_field( 'dzuvo_home_save_settings' ); ?>

			<?php foreach ( dzuvo_home_settings_schema() as $group ) : ?>
				<h2><?php echo esc_html( $group['title'] ); ?></h2>
				<?php if ( ! empty( $group['intro'] ) ) : ?>
					<p class="description" style="max-width:46rem"><?php echo esc_html( $group['intro'] ); ?></p>
				<?php endif; ?>

				<table class="form-table" role="presentation">
					<?php foreach ( $group['fields'] as $field ) : ?>
						<?php
						$key   = $field['key'];
						$type  = $field['type'] ?? 'text';
						$value = $stored[ $key ] ?? '';
						$id    = 'dzuvo-setting-' . $key;
						?>
						<tr>
							<th scope="row"><label for="<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $field['label'] ); ?></label></th>
							<td>
								<?php if ( 'textarea' === $type ) : ?>
									<textarea
										id="<?php echo esc_attr( $id ); ?>"
										name="<?php echo esc_attr( $key ); ?>"
										rows="3"
										class="large-text"
										placeholder="<?php echo esc_attr( $field['placeholder'] ?? '' ); ?>"
									><?php echo esc_textarea( $value ); ?></textarea>
								<?php elseif ( 'number' === $type ) : ?>
									<input
										type="number"
										id="<?php echo esc_attr( $id ); ?>"
										name="<?php echo esc_attr( $key ); ?>"
										value="<?php echo esc_attr( $value ); ?>"
										class="small-text"
									>
								<?php else : ?>
									<input
										type="text"
										id="<?php echo esc_attr( $id ); ?>"
										name="<?php echo esc_attr( $key ); ?>"
										value="<?php echo esc_attr( $value ); ?>"
										class="large-text"
										placeholder="<?php echo esc_attr( $field['placeholder'] ?? '' ); ?>"
									>
								<?php endif; ?>

								<?php if ( ! empty( $field['help'] ) ) : ?>
									<p class="description"><?php echo esc_html( $field['help'] ); ?></p>
								<?php endif; ?>
							</td>
						</tr>
					<?php endforeach; ?>
				</table>
			<?php endforeach; ?>

			<?php submit_button( 'Enregistrer' ); ?>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_dzuvo_home_save_settings', function () {
	check_admin_referer( 'dzuvo_home_save_settings' );

	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die( 'Droits insuffisants.' );
	}

	$values = [];

	foreach ( dzuvo_home_settings_fields() as $field ) {
		$raw = $_POST[ $field['key'] ] ?? '';
		$values[ $field['key'] ] = dzuvo_home_sanitize_field( $raw, $field );
	}

	update_option( DZUVO_SETTINGS_OPTION, $values );

	wp_safe_redirect( add_query_arg( 'enregistre', '1', admin_url( 'admin.php?page=dzuvo-home-settings' ) ) );
	exit;
} );
