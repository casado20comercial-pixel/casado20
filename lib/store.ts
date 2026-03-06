import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, Category } from '@/lib/types'
import { ProductService } from './services/products'

export interface CartItem extends Product {
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id)
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
              : item
          ),
          isOpen: true,
        }
      }
      return {
        items: [...state.items, { ...product, quantity: 1 }],
        isOpen: true,
      }
    })
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }))
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((item) => item.id !== productId) }
      }
      return {
        items: state.items.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      }
    })
  },
  clearCart: () => set({ items: [] }),
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  },
}))

interface SearchStore {
  query: string
  isOpen: boolean
  setQuery: (query: string) => void
  openSearch: () => void
  closeSearch: () => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  isOpen: false,
  setQuery: (query) => set({ query }),
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: '' }),
}))


interface ProductStore {
  products: Product[]
  categories: Category[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  page: number
  currentCategory: string | null
  currentSearch: string | null
  lastUpdated: number | null
  fetchProducts: (refresh?: boolean, category?: string | null, search?: string | null) => Promise<void>
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      page: 1,
      currentCategory: null,
      currentSearch: null,
      lastUpdated: null,
      fetchProducts: async (refresh = false, category, search) => {
        const { page, products, hasMore, isLoading, isLoadingMore, currentCategory, currentSearch } = get()

        // Sync with existing or new filters
        const targetCategory = category !== undefined ? category : currentCategory
        const targetSearch = search !== undefined ? search : currentSearch

        const isCategoryChange = targetCategory !== currentCategory
        const isSearchChange = targetSearch !== currentSearch

        if (isLoading || isLoadingMore) return
        if (!refresh && !isCategoryChange && !isSearchChange && !hasMore) return

        const isInitialFetch = refresh || isCategoryChange || isSearchChange || products.length === 0
        const currentPage = isInitialFetch ? 1 : page + 1

        set({
          isLoading: isInitialFetch,
          isLoadingMore: !isInitialFetch,
          // Reset if any filter changed
          ...(isInitialFetch && { products: [], page: 1, hasMore: true }),
          currentCategory: targetCategory,
          currentSearch: targetSearch
        })

        try {
          const categoryQuery = targetCategory ? `&category=${targetCategory}` : ''
          const searchQuery = targetSearch ? `&q=${encodeURIComponent(targetSearch)}` : ''
          const response = await fetch(`/api/products?page=${currentPage}&limit=24${categoryQuery}${searchQuery}`)
          if (!response.ok) throw new Error('Falha ao buscar produtos')
          const data = await response.json()

          set({
            products: isInitialFetch ? data.products : [...products, ...data.products],
            categories: data.categories || [],
            hasMore: data.hasMore,
            page: currentPage,
            lastUpdated: Date.now(),
            isLoading: false,
            isLoadingMore: false
          })
        } catch (error) {
          console.error('[ProductStore] Erro ao sincronizar:', error)
          set({ isLoading: false, isLoadingMore: false })
        }
      },
    }),
    {
      name: 'mustang-product-cache',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
