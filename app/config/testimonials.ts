/** Témoignages clients affichés en deux bandes défilantes. */
export interface Testimonial {
  id: string
  quote: string
  author: string
  city: string
  rating: number
}

/** Bande du haut : défile vers la gauche. */
export const testimonialsTop: Testimonial[] = [
  {
    id: 't1',
    quote: 'Le gonfleur tient dans le coffre et se branche en deux secondes. Fini les arrêts en station pour vérifier la pression.',
    author: 'Marc T.',
    city: 'Montréal',
    rating: 5,
  },
  {
    id: 't2',
    quote: 'Commandé le mardi, livré le jeudi à Québec. Les balais se posent sans outil, en deux minutes chrono.',
    author: 'Sophie L.',
    city: 'Québec',
    rating: 5,
  },
  {
    id: 't3',
    quote: 'Mon démarreur d’appoint m’a sauvé un matin à –28 °C. Il a redémarré la voiture du premier coup.',
    author: 'Jean-Philippe R.',
    city: 'Winnipeg',
    rating: 5,
  },
  {
    id: 't4',
    quote: 'Les tapis retiennent la neige et le calcium. Un coup de jet et ils sont comme neufs.',
    author: 'Amélie D.',
    city: 'Ottawa',
    rating: 4,
  },
  {
    id: 't5',
    quote: 'Service à la clientèle joignable et précis. Ils m’ont trouvé la bonne référence pour un modèle de 2011.',
    author: 'Karim B.',
    city: 'Toronto',
    rating: 5,
  },
  {
    id: 't6',
    quote: 'Bon rapport qualité-prix sur les filtres. J’ai fait l’entretien moi-même et économisé une visite au garage.',
    author: 'Nathalie G.',
    city: 'Calgary',
    rating: 4,
  },
]

/** Bande du bas : défile vers la droite. */
export const testimonialsBottom: Testimonial[] = [
  {
    id: 'b1',
    quote: 'Enfin des accessoires qui s’adaptent vraiment à tous les véhicules. J’équipe mes deux autos chez eux.',
    author: 'Daniel V.',
    city: 'Edmonton',
    rating: 5,
  },
  {
    id: 'b2',
    quote: 'La trousse d’hiver est complète et bien pensée. Le balai à neige est solide, il ne plie pas.',
    author: 'Isabelle M.',
    city: 'Saskatoon',
    rating: 5,
  },
  {
    id: 'b3',
    quote: 'Livraison programmée à la date convenue, sans mauvaise surprise. C’est rare et ça compte.',
    author: 'Olivier C.',
    city: 'Halifax',
    rating: 5,
  },
  {
    id: 'b4',
    quote: 'La glacière fonctionne aussi bien sur la route qu’au camping. Silencieuse et bien isolée.',
    author: 'Mélanie P.',
    city: 'Vancouver',
    rating: 4,
  },
  {
    id: 'b5',
    quote: 'Commande simple, suivi clair, produit conforme. Je recommande pour l’entretien courant.',
    author: 'Ahmed S.',
    city: 'Montréal',
    rating: 5,
  },
  {
    id: 'b6',
    quote: 'Même à Yellowknife j’ai été livré dans les délais annoncés. Rien à redire.',
    author: 'Louis F.',
    city: 'Yellowknife',
    rating: 5,
  },
]
