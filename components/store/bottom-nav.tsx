"use client"

import { Home, Grid3X3, Search, ShoppingCart } from "lucide-react"
import { useCartStore, useSearchStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { getTotalItems, openCart } = useCartStore()
  const { openSearch } = useSearchStore()
  const totalItems = getTotalItems()

  const tabs = [
    { id: "home", label: "Início", icon: Home },
    { id: "categories", label: "Categorias", icon: Grid3X3 },
    { id: "search", label: "Buscar", icon: Search },
    { id: "cart", label: "Carrinho", icon: ShoppingCart, badge: totalItems },
  ]

  const handleTabClick = (tabId: string) => {
    if (tabId === "cart") {
      openCart()
    } else if (tabId === "search") {
      // Focus on search input (mobile specific)
      const searchInput = document.getElementById('mobile-search-input')
        || document.querySelector('input[type="search"]') as HTMLInputElement

      searchInput?.focus()
      // Optional: scroll top to see header
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      onTabChange(tabId)
    }
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
