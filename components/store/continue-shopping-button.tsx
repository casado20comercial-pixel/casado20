"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContinueShoppingButtonProps {
    className?: string
    onClick?: () => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ContinueShoppingButton({ className, onClick, variant }: ContinueShoppingButtonProps) {
    return (
        <Link href="/" className="w-full" onClick={onClick}>
            <Button
                variant={variant}
                className={cn(
                    "w-full gap-2 font-bold text-lg h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg transition-transform active:scale-95",
                    className
                )}
            >
                <LayoutGrid className="w-5 h-5" />
                Continuar Comprando
            </Button>
        </Link>
    )
}
