"use client"

import React from "react"
import { Home, Sparkles, Utensils, Archive, ToyBrick, ChevronRight, PiggyBank, Banknote, Package } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { categories } from "@/lib/products"
import { cn } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    "toy-brick": ToyBrick,
    sparkles: Sparkles,
    home: Home,
    utensils: Utensils,
    archive: Archive,
    "piggy-bank": PiggyBank,
    banknote: Banknote,
    package: Package,
}

interface MobileCategorySheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedCategory: string | null
    onSelectCategory: (categoryId: string | null) => void
}

export function MobileCategorySheet({
    open,
    onOpenChange,
    selectedCategory,
    onSelectCategory
}: MobileCategorySheetProps) {

    const handleSelect = (id: string | null) => {
        onSelectCategory(id)
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[300px] p-0">
                <SheetHeader className="p-4 bg-primary text-primary-foreground">
                    <SheetTitle className="text-primary-foreground flex items-center gap-2">
                        <span className="font-bold">Categorias</span>
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-80px)]">
                    <nav className="p-2 space-y-1">
                        <button
                            type="button"
                            onClick={() => handleSelect(null)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                                selectedCategory === null
                                    ? "bg-secondary/10 text-primary font-medium"
                                    : "text-foreground hover:bg-muted"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                                <Home className="w-4 h-4" />
                            </div>
                            <span>Todos os Produtos</span>
                            <ChevronRight className={cn(
                                "w-4 h-4 ml-auto transition-transform text-muted-foreground",
                                selectedCategory === null && "rotate-90 text-primary"
                            )} />
                        </button>

                        {categories.map((category) => {
                            const Icon = iconMap[category.icon] || Home
                            const isActive = selectedCategory === category.id
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => handleSelect(category.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                                        isActive
                                            ? "bg-secondary/10 text-primary font-medium"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                        isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span>{category.name}</span>
                                    <ChevronRight className={cn(
                                        "w-4 h-4 ml-auto transition-transform text-muted-foreground",
                                        isActive && "rotate-90 text-primary"
                                    )} />
                                </button>
                            )
                        })}
                    </nav>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
