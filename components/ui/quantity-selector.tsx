"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuantitySelectorProps {
    quantity: number
    onChange: (quantity: number) => void
    max?: number
    className?: string
}

export function QuantitySelector({ quantity, onChange, max, className }: QuantitySelectorProps) {
    const decrement = () => {
        if (quantity > 1) {
            onChange(quantity - 1)
        }
    }

    const increment = () => {
        if (!max || quantity < max) {
            onChange(quantity + 1)
        }
    }

    return (
        <div className={cn("flex items-center border rounded-md h-12 w-fit bg-background", className)}>
            <Button
                variant="ghost"
                size="icon"
                onClick={decrement}
                disabled={quantity <= 1}
                className="h-full px-3 rounded-r-none hover:bg-muted"
            >
                <Minus className="w-4 h-4" />
                <span className="sr-only">Diminuir quantidade</span>
            </Button>

            <div className="w-12 text-center font-medium">
                {quantity}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={increment}
                disabled={max ? quantity >= max : false}
                className="h-full px-3 rounded-l-none hover:bg-muted"
            >
                <Plus className="w-4 h-4" />
                <span className="sr-only">Aumentar quantidade</span>
            </Button>
        </div>
    )
}
