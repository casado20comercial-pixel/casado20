"use client"

import React from "react"

import { Home, Sparkles, Utensils, Archive, ToyBrick, ChevronRight, PiggyBank, Banknote, Package, Droplets } from "lucide-react"
import { categories } from "@/lib/products"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface CategorySidebarProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategorySidebar({ selectedCategory, onSelectCategory }: CategorySidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 bg-primary text-primary-foreground">
          <h2 className="font-semibold">Categorias</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <nav className="p-2">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                selectedCategory === null
                  ? "bg-secondary text-secondary-foreground font-medium"
                  : "text-card-foreground hover:bg-muted"
              )}
            >
              <Home className="w-5 h-5" />
              <span>Todos os Produtos</span>
              <ChevronRight className={cn(
                "w-4 h-4 ml-auto transition-transform",
                selectedCategory === null && "rotate-90"
              )} />
            </button>
            {categories.map((category) => {
              const Icon = iconMap[category.icon] || Home
              const isActive = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground font-medium"
                      : "text-card-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{category.name}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-auto transition-transform",
                    isActive && "rotate-90"
                  )} />
                </button>
              )
            })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  )
}
