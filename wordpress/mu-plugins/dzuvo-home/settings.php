<?php
/**
 * Titres et textes fixes de la page d'accueil.
 *
 * Ce qui n'est pas une liste — un titre de section, une accroche, les trois
 * engagements — n'a pas besoin d'un type de contenu à lui : ce serait quatre
 * clics pour changer trois mots. Tout tient donc sur un seul écran : la page
 * d'accueil WordPress, avec un onglet par section, dans l'ordre où elles
 * apparaissent sur le site.
 *
 * Un champ laissé vide n'efface rien : le site garde le texte livré avec lui.
 * C'est ce qui permet de ne remplir que ce qu'on veut changer.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Ancien emplacement des réglages (avant ACF) : lu une seule fois, par la migration. */
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

/**
 * Valeurs saisies sur la page d'accueil, les champs vides écartés.
 *
 * Sans page d'accueil identifiée, rien n'est servi : le site garde ses textes.
 */
function dzuvo_home_settings() {
	$page_id = dzuvo_home_page_id();
	$out     = [];

	if ( ! $page_id ) {
		return $out;
	}

	foreach ( dzuvo_home_settings_fields() as $field ) {
		$value = dzuvo_home_sanitize_field( dzuvo_home_meta( $page_id, $field['key'] ), $field );

		if ( '' === $value ) {
			continue;
		}

		$out[ $field['key'] ] = 'number' === ( $field['type'] ?? 'text' ) ? 0 + $value : $value;
	}

	return $out;
}

/**
 * Le schéma devient un groupe ACF à onglets : un onglet par section du site,
 * précédé de son texte d'introduction.
 */
function dzuvo_home_settings_acf_fields() {
	$acf = [];

	foreach ( dzuvo_home_settings_schema() as $index => $group ) {
		$acf[] = [
			'acf' => [
				'key'       => dzuvo_home_acf_key( 'settings', 'tab' . $index ),
				'label'     => $group['title'],
				'name'      => '',
				'type'      => 'tab',
				'placement' => 'top',
				'endpoint'  => 0,
			],
		];

		if ( ! empty( $group['intro'] ) ) {
			$acf[] = [
				'acf' => [
					'key'       => dzuvo_home_acf_key( 'settings', 'intro' . $index ),
					'label'     => '',
					'name'      => '',
					'type'      => 'message',
					'message'   => ( $group['intro'] ?? '' ) . ' Un champ vide n’efface rien : le site garde alors son texte.',
					'new_lines' => '',
					'esc_html'  => 1,
				],
			];
		}

		foreach ( $group['fields'] as $field ) {
			$acf[] = $field;
		}
	}

	return $acf;
}

dzuvo_home_add_field_group(
	'settings',
	'Titres et textes des sections',
	dzuvo_home_settings_acf_fields(),
	'dzuvo_home_location_home_page',
	10
);
