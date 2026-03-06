"use client"

import { useState } from "react"
import { Header } from "@/components/store/header"
import { BottomNav } from "@/components/store/bottom-nav"
import { ProductGrid } from "@/components/store/product-grid"
import { CategorySidebar } from "@/components/store/category-sidebar"
import { HeroBanner } from "@/components/store/hero-banner"
import { MobileCategorySheet } from "@/components/store/mobile-category-sheet"


export default function StorePage() {
  const [activeTab, setActiveTab] = useState("home")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false)

  const handleViewOffers = () => {
    setSelectedCategory(null)
    setActiveTab("home")
    window.scrollTo({ top: 300, behavior: "smooth" })
  }

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    // Se selecionar uma categoria, muda a tab para categories (visual) mas mantém na home (conteúdo)
    // Na verdade, 'categories' tab é só um trigger no mobile.
    // Vamos manter activeTab como 'home' para ver os produtos, mas talvez destacar 'categories' se o drawer estiver aberto?
    // Simplificação: Se mudou categoria, estamos vendo produtos -> Home tab visualmente faz sentido ou mantém Categories?
    // Vamos resetar para 'home' pois é onde a grid está.
    setActiveTab("home")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTabChange = (tab: string) => {
    if (tab === "categories") {
      setIsCategorySheetOpen(true)
      setActiveTab("categories") // Highlight visual
    } else if (tab === "home") {
      setSelectedCategory(null) // Reset filter
      setActiveTab("home")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      setActiveTab(tab)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-4 pb-20"> {/* pb-20 para dar espaço ao BottomNav */}
        <div className="flex gap-6">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />

          <div className="flex-1 min-w-0">
            {/* Show Hero only if on Home tab AND no category selected */}
            {activeTab === "home" && !selectedCategory && (
              <HeroBanner onViewOffers={handleViewOffers} />
            )}

            <ProductGrid
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        </div>
      </main>

      <div className="h-16 md:hidden" /> {/* Spacer extra */}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <MobileCategorySheet
        open={isCategorySheetOpen}
        onOpenChange={setIsCategorySheetOpen}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
      />

    </div>
  )
}
