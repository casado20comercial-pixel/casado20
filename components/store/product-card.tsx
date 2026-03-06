"use client"

import { ProductImage } from "@/components/ui/product-image"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from "@/lib/types"
import { useCartStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductCardProps {
  product: Product
  onAddToCart?: () => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { addItem } = useCartStore()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsAdding(true)
    addItem(product)
    onAddToCart?.()
    setTimeout(() => setIsAdding(false), 300)
  }

  return (
    <Link href={`/products/${product.id}`} className="block h-full cursor-pointer">
      <div className="group h-full relative flex flex-col justify-between">

        {/* Topo: Imagem + Ref */}
        <div>
          <div className="relative w-full aspect-square mb-2 flex items-center justify-center overflow-hidden bg-slate-50/50 rounded-lg">
            {!imageLoaded && <Skeleton className="absolute inset-0" />}
            {product.price > 200 && (
              <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                Frete Grátis
              </div>
            )}
            {/* Overlay de Imagem Ilustrativa */}
            <div className="absolute bottom-1 right-1 z-10 bg-white/60 backdrop-blur-[2px] px-1 rounded-[2px] pointer-events-none">
              <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-tighter leading-none">
                Imagem Ilustrativa
              </span>
            </div>
            <ProductImage
              product={product}
              className={cn(
                "max-w-full max-h-full w-auto h-auto object-contain mix-blend-multiply contrast-[1.1] brightness-[1.05] transition-transform duration-300 group-hover:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>

          <div className="space-y-1">
            {/* REF em destaque */}
            {product.ref && (
              <p className="text-xs font-black text-black">{product.ref}</p>
            )}
            {/* Nome */}
            <h3 className="text-xs text-neutral-600 font-medium leading-tight min-h-[2.5em]">
              {product.name}
            </h3>
            {/* Specs */}
            <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
              {product.material && <p>Mat: {product.material}</p>}
              {product.masterBox && <p>Cx Master: {product.masterBox} un.</p>}
              {product.stock !== undefined && (
                <p className={cn(
                  "mt-1 font-bold",
                  product.stock < 5 ? "text-amber-500" : "text-emerald-500"
                )}>
                  Estoque: {product.stock} un.
                </p>
              )}
            </div>
            {/* Disclaimer Jurídico & Entrega */}
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 leading-tight">
                ⚡ Entrega grátis hoje (pedidos até 15h)
              </p>
              <p className="text-[9px] text-neutral-400 italic leading-tight">
                *Imagens ilustrativas. Podem sofrer alterações de forma/tamanho.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé: Preço Box Horizontal (Compacto) */}
        <div className="mt-auto pt-2 flex justify-end w-full">
          <div className="relative bg-black text-white border-2 border-secondary border-dotted px-2 py-0.5 shadow-sm min-w-[100px] flex items-center justify-between">

            <span className="text-[10px] font-bold text-neutral-300 mr-1">R$</span>

            <div className="flex flex-col items-end leading-none">
              <span className="text-xl font-black tracking-tighter text-white">
                {product.price.toFixed(2).replace('.', ',')}
              </span>
              {product.ipi && (
                <span className="text-[8px] font-bold text-neutral-400 mt-px">
                  + IPI {product.ipi}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hover Action removido para manter look limpo */}

      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="h-full p-4 flex flex-col items-center gap-4">
      <Skeleton className="w-full aspect-4/5" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
