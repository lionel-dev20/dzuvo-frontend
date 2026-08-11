import type { NavItem } from '#shared/types/navigation'

/**
 * Navigation du site.
 *
 * Le menu principal ne vit plus ici : il est saisi dans WordPress, sous
 * « Apparence > Menus », à l'emplacement « DZUVO — navigation principale ».
 * Le front le lit par /api/navigation, qui traduit déjà les permaliens
 * WordPress en routes du site (voir le bloc « DZUVO — menus headless » en fin
 * de wp-config.php).
 *
 * Il n'y a plus aucun lien de secours : ce que WordPress ne donne pas ne
 * s'affiche pas.
 */

/**
 * Appel à l'action du header. Il reste ici : c'est une décision de conversion,
 * pas une entrée de navigation à confier à l'éditeur de contenu.
 */
export const headerCta: NavItem | null = { label: 'Créer un compte', to: '/inscription' }
