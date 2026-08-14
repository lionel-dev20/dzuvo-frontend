/**
 * Produits mis en avant sur la page d'accueil.
 *
 * Visuels : PNG détourés sur fond transparent, déposés dans
 * public/images/produits/. Quelques produits pointent pour l'instant vers des
 * fichiers déjà présents ; les autres affichent un repli tant que le visuel
 * n'est pas livré.
 */
export interface Product {
  id: string
  name: string
  to: string
  /**
   * Identifiant WooCommerce, présent seulement sur les produits choisis dans
   * WordPress. Sans lui, le bouton « Ajouter » n'a rien à mettre au panier —
   * c'est la limite connue de cette liste de repli.
   */
  wooId?: number
  /** Achetable en un clic : ni rupture, ni produit à déclinaisons. */
  purchasable?: boolean
  image?: string
  /** « Promo », « Prix baissé »… Laisser vide pour ne rien afficher. */
  badge?: string
  rating: number
  reviews: number
  /** Disponibilité affichée sous la note. */
  availability: string
  inStock: boolean
  price: string
  oldPrice?: string
  discount?: string
  /** Mention légale ou prix unitaire, sous le prix. */
  note?: string
}

export const featuredProducts: Product[] = [
  {
    id: 'kit-crevaison',
    name: 'Kit de réparation crevaison par mèche',
    to: '/produits/kit-crevaison',
    image: '/images/produits/kit-crevaison.png',
    badge: 'Prix baissé',
    rating: 4.5,
    reviews: 328,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '24,99 $',
  },
  {
    id: 'gonfleur-12v',
    name: 'Gonfleur portatif 12 V à jauge numérique',
    to: '/produits/gonfleur-12v',
    image: '/images/hero/media.png',
    badge: 'N° 1 des ventes',
    rating: 4.6,
    reviews: 512,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '49,99 $',
  },
  {
    id: 'nettoyant-habitacle',
    name: 'Nettoyant désinfectant climatisation et habitacle',
    to: '/produits/nettoyant-habitacle',
    image: '/images/produits/nettoyant-habitacle.png',
    badge: 'Promo',
    rating: 3.9,
    reviews: 128,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '12,99 $',
    oldPrice: '18,99 $',
    discount: '-31 %',
    note: 'Soit 25,98 $ le litre',
  },
  {
    id: 'demarreur-lithium',
    name: 'Démarreur d’appoint lithium 1500 A',
    to: '/produits/demarreur-lithium',
    image: '/images/produits/demarreur-lithium.png',
    badge: 'Promo',
    rating: 4.8,
    reviews: 243,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '99,99 $',
    oldPrice: '129,99 $',
    discount: '-23 %',
  },
  {
    id: 'essuie-glaces',
    name: 'Balais d’essuie-glace toutes saisons',
    to: '/produits/essuie-glaces',
    image: '/images/hero/essuieglasse2.png',
    rating: 4.3,
    reviews: 654,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '29,99 $',
  },
  {
    id: 'tapis-toutes-saisons',
    name: 'Tapis toutes saisons à rebords, 4 pièces',
    to: '/produits/tapis-toutes-saisons',
    image: '/images/hero/tapisvoiture.png',
    badge: 'Promo',
    rating: 4.5,
    reviews: 321,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '69,99 $',
    oldPrice: '89,99 $',
    discount: '-22 %',
  },
  {
    id: 'glaciere-30l',
    name: 'Glacière thermoélectrique 30 L 12 V / 230 V',
    to: '/produits/glaciere-30l',
    image: '/images/produits/glaciere-30l.png',
    badge: 'Promo',
    rating: 4.4,
    reviews: 1078,
    availability: 'Livraison 2 à 4 jours',
    inStock: true,
    price: '79,99 $',
    oldPrice: '99,99 $',
    discount: '-20 %',
    note: 'dont 1,80 $ d’écofrais',
  },
  {
    id: 'chandelles-3t',
    name: 'Chandelles à crémaillère 3 t, la paire',
    to: '/produits/chandelles-3t',
    image: '/images/produits/chandelles-3t.png',
    badge: 'Promo',
    rating: 4.7,
    reviews: 106,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '39,99 $',
    oldPrice: '54,99 $',
    discount: '-26 %',
  },
  {
    id: 'autoradio-bt',
    name: 'Autoradio multimédia Bluetooth DX-1113',
    to: '/produits/autoradio-bt',
    image: '/images/produits/autoradio-bt.png',
    badge: 'Promo',
    rating: 3.9,
    reviews: 11,
    availability: 'Non disponible',
    inStock: false,
    price: '89,99 $',
    oldPrice: '149,99 $',
    discount: '-40 %',
  },
  {
    id: 'lave-glace-hiver',
    name: 'Lave-glace hiver -40 °C, 3,78 L',
    to: '/produits/lave-glace-hiver',
    image: '/images/produits/lave-glace-hiver.png',
    badge: 'Promo',
    rating: 4.1,
    reviews: 87,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '6,99 $',
    oldPrice: '8,99 $',
    discount: '-22 %',
    note: 'Soit 1,85 $ le litre',
  },
  {
    id: 'filtre-habitacle',
    name: 'Filtre d’habitacle à charbon actif',
    to: '/produits/filtre-habitacle',
    image: '/images/produits/filtre-habitacle.png',
    rating: 4.2,
    reviews: 198,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '19,99 $',
  },
  {
    id: 'balai-neige',
    name: 'Balai à neige télescopique et gratte-glace',
    to: '/produits/balai-neige',
    image: '/images/produits/balai-neige.png',
    badge: 'Prix baissé',
    rating: 4.6,
    reviews: 432,
    availability: 'Livraison 24 h',
    inStock: true,
    price: '24,99 $',
  },
]
