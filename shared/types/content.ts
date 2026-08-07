export interface Service {
  slug: string
  title: string
  excerpt: string
  description: string
  icon: string
  features: string[]
  image?: string
}

export interface CaseStudy {
  slug: string
  client: string
  title: string
  excerpt: string
  sector: string
  year: number
  services: string[]
  cover: string
  results: { label: string, value: string }[]
}

export interface Testimonial {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
}

export interface TeamMember {
  name: string
  role: string
  photo?: string
  linkedin?: string
}

export interface JobOffer {
  slug: string
  title: string
  department: string
  location: string
  contract: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance'
  publishedAt: string
}

export interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  publishedAt: string
  readingTime: number
  cover?: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface Stat {
  value: string
  label: string
}
