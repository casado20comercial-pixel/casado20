export interface Category {
  id: string
  name: string
  icon: string
}

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  badge?: 'best-seller' | 'new' | 'sale'
  stock: number
  // Campos B2B (Atacado)
  ipi?: number
  masterBox?: number
  subBox?: number
  material?: string
  ref?: string
}
