"use client"

import { Search, ShoppingCart, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCartStore, useSearchStore } from "@/lib/store"
import { useState } from "react"
import { searchProducts } from "@/lib/products"
import Image from "next/image"
import Link from "next/link"

export function Header() {
  const { getTotalItems, openCart } = useCartStore()
  const { query, setQuery, isOpen, openSearch, closeSearch } = useSearchStore()
  const [suggestions, setSuggestions] = useState<string[]>([])

  const handleSearchChange = (value: string) => {
    setQuery(value)
    if (value.length > 1) {
      const results = searchProducts(value)
      setSuggestions(results.slice(0, 5).map((p) => p.name))
    } else {
      setSuggestions([])
    }
  }

  const totalItems = getTotalItems()

  return (
    <>
      <div className="bg-secondary text-secondary-foreground py-1.5 px-4 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
        <span>🚚 Frete Grátis acima de R$ 200,00</span>
        <span className="hidden sm:inline opacity-30">|</span>
        <span>⚡ Pedidos até às 15h entregues hoje!</span>
      </div>
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
              <div className="bg-black relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-secondary">
                <Image src="/images/logo.webp" alt="Casa do 20" fill className="object-contain p-1" sizes="(max-width: 768px) 40px, 48px" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg leading-tight">Casa do 20</h1>
                <p className="text-xs text-primary-foreground/70">Utilidades para o lar</p>
              </div>
            </Link>

            {/* Search - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={openSearch}
                  onBlur={() => setTimeout(closeSearch, 200)}
                  className="pl-10 bg-background text-foreground border-0 h-10"
                />
                {isOpen && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-xl border overflow-hidden z-50">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm text-card-foreground hover:bg-muted transition-colors"
                        onClick={() => {
                          setQuery(suggestion)
                          closeSearch()
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-primary-foreground hover:bg-primary-foreground/10"
              onClick={openCart}
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Carrinho de compras</span>
            </Button>
          </div>

          {/* Search - Mobile */}
          <div className="md:hidden mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="mobile-search-input"
              type="search"
              placeholder="O que você procura?"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={openSearch}
              onBlur={() => setTimeout(closeSearch, 200)}
              className="pl-10 bg-background text-foreground border-0 h-10"
            />
            {isOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-xl border overflow-hidden z-50">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-card-foreground hover:bg-muted transition-colors"
                    onClick={() => {
                      setQuery(suggestion)
                      closeSearch()
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
