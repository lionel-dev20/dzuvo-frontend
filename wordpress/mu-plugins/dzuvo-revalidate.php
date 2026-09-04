<?php
/**
 * Plugin Name:  DZUVO — purge du cache du site
 * Description:  Prévient le site Nuxt dès qu'un contenu change, pour qu'une publication paraisse aussitôt.
 * Version:      1.0.0
 * Author:       DZUVO
 *
 * Le problème que ce fichier résout est propre au headless : WordPress n'affiche
 * plus le site, il l'alimente. Le front garde donc les réponses de l'API en
 * cache — sans quoi chaque page vue rouvrirait une connexion vers WordPress — et
 * une modification publiée reste invisible tant que ce cache n'a pas expiré.
 *
 * L'éditeur, lui, clique « Mettre à jour », recharge le site, ne voit rien, et
 * conclut que sa modification n'a pas été prise. Le délai ne lui dit rien de ce
 * qu'il doit attendre : ni combien de temps, ni pourquoi.
 *
 * D'où cet appel. WordPress reste la source, et il annonce lui-même ses
 * changements ; le front n'a plus à deviner quand redemander.
 *
 * Configuration, dans wp-config.php :
 *
 *     define('DZUVO_SITE_URL', 'https://dzuvo.ca');
 *     define('DZUVO_REVALIDATE_SECRET', '…'); // même valeur que NUXT_REVALIDATE_SECRET
 *
 * Sans ces deux constantes, l'extension ne fait rien : le cache retombe alors
 * sur sa simple expiration, qui reste correcte, seulement plus lente.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Événements qui rendent le contenu servi au site périmé.
 *
 * La liste est volontairement large : une purge de trop ne coûte qu'une
 * relecture, une purge oubliée laisse une modification invisible — et c'est
 * précisément le défaut qu'on corrige ici.
 */
const DZUVO_REVALIDATE_HOOKS = [
    'save_post',              // page, article, produit
    'deleted_post',
    'wp_update_nav_menu',     // menu réorganisé
    'wp_delete_nav_menu',
    'updated_option',         // réglages du bloc « accueil »
    'woocommerce_update_product',
    'woocommerce_delete_product',
    'edited_product_cat',
    'delete_product_cat',
];

foreach (DZUVO_REVALIDATE_HOOKS as $hook) {
    add_action($hook, 'dzuvo_schedule_revalidate', 10, 0);
}

/**
 * Une seule purge par requête.
 *
 * Enregistrer dix produits d'un coup déclenche dix fois `save_post` ; sans ce
 * garde-fou, le site recevrait dix appels identiques. L'envoi est repoussé à la
 * fin de la requête (`shutdown`) pour ne jamais retarder l'écran de
 * l'administrateur.
 */
function dzuvo_schedule_revalidate(): void
{
    static $scheduled = false;

    if ($scheduled) {
        return;
    }

    $scheduled = true;
    add_action('shutdown', 'dzuvo_send_revalidate');
}

function dzuvo_send_revalidate(): void
{
    if (!defined('DZUVO_SITE_URL') || !defined('DZUVO_REVALIDATE_SECRET')) {
        return;
    }

    $url = rtrim(DZUVO_SITE_URL, '/') . '/api/revalidate';

    /*
     * `blocking => false` : WordPress n'attend pas la réponse. La purge est un
     * signal, pas une transaction — si le site est momentanément injoignable,
     * son cache expirera de lui-même, et rien ne justifie de faire patienter
     * l'éditeur devant un écran figé.
     */
    $response = wp_remote_post($url, [
        'timeout'  => 2,
        'blocking' => false,
        'headers'  => [
            'Content-Type'        => 'application/json',
            'X-Dzuvo-Revalidate'  => DZUVO_REVALIDATE_SECRET,
        ],
        'body'     => '{}',
    ]);

    if (is_wp_error($response)) {
        error_log('[dzuvo] purge du cache impossible : ' . $response->get_error_message());
    }
}
