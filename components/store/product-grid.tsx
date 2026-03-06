"use client"

import React, { useState, useEffect, useRef } from "react"
import { Product, Category } from "@/lib/types"
import { ProductCard, ProductCardSkeleton } from "./product-card"
import { useSearchStore, useProductStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Home, Sparkles, Utensils, Archive, ToyBrick, SearchX, PiggyBank, Banknote, Package, Droplets, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "toy-brick": ToyBrick,
  sparkles: Sparkles,
  home: Home,
  utensils: Utensils,
  archive: Archive,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  package: Package,
  droplets: Droplets,
}

interface ProductGridProps {
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
}

export function ProductGrid({ selectedCategory, onCategoryChange }: ProductGridProps) {
  const { query, setQuery } = useSearchStore()
  const {
    products,
    categories,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchProducts
  } = useProductStore()
  const { toast } = useToast()

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Initial fetch
  useEffect(() => {
    fetchProducts(true, selectedCategory, query)
  }, [])

  // Sync with filters + DEBOUNCE
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts(true, selectedCategory, query)
    }, 400) // 400ms delay to stop blinking

    return () => clearTimeout(timeout)
  }, [selectedCategory, query, fetchProducts])

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchProducts(false, selectedCategory, query)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, fetchProducts, selectedCategory, query])


  const handleAddToCart = (productName: string) => {
    toast({
      title: "Adicionado ao carrinho!",
      description: `${productName} foi adicionado.`,
      duration: 2000,
    })
  }

  let filteredProducts = products
  let title = "Todos os Produtos"

  if (query) {
    title = `Resultados para "${query}"`
  } else if (selectedCategory) {
    const category = categories.find((c: Category) => c.id === selectedCategory)
    title = category?.name || "Produtos"
  }

  const showSkeleton = isLoading && products.length === 0

  return (
    <div className="flex-1">
      {/* Mobile Category Pills */}
      <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-2">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === null
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Todos
          </button>
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Home
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === category.id
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {showSkeleton ? 'Carregando...' : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
        </p>
      </div>

      {/* Grid estilo Catálogo (Sem Gaps, Bordas Pontilhadas) - Agora 100% Clean sem bordas */}
      {showSkeleton ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-muted rounded-full p-6 mb-4">
            <SearchX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Não encontramos resultados para <span className="font-medium text-foreground">"{query}"</span>.
            Que tal tentar outro termo ou ver todas as ofertas?
          </p>
          <Button
            onClick={() => {
              setQuery('')
              onCategoryChange(null)
            }}
            variant="secondary"
            className="font-semibold"
          >
            Limpar Filtros e Ver Tudo
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product: Product) => (
              <div key={product.id} className="p-4 transition-shadow hover:shadow-[0_0_20px_rgba(0,0,0,0.05)] rounded-sm">
                <ProductCard
                  product={product}
                  onAddToCart={() => handleAddToCart(product.name)}
                />
              </div>
            ))}
          </div>

          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
            {isLoadingMore ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : hasMore ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando mais tesouros...
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Você chegou ao fim do catálogo! ✨
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
