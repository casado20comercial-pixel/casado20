"use client"

import React from "react"
import { ProductImage } from "@/components/ui/product-image"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Maximize2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
    product: Product
    className?: string
}

export function ProductImageGallery({ product, className }: ProductImageGalleryProps) {
    const galleryImages = product.images && product.images.length > 0
        ? product.images.slice(0, 3)
        : [product.image];

    const [selectedImage, setSelectedImage] = React.useState(galleryImages[0]);

    // Update selected image if product changes
    React.useEffect(() => {
        setSelectedImage(galleryImages[0]);
    }, [product.id]);

    return (
        <div className={cn("flex flex-col lg:flex-row gap-6", className)}>
            {/* Thumbnails - Sidebar on Desktop, Row on Mobile */}
            <div className="flex lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide lg:w-16">
                {galleryImages.map((img, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={cn(
                            "min-w-[64px] w-[64px] h-[64px] lg:w-16 lg:h-16 rounded-lg border-2 overflow-hidden bg-white dark:bg-card p-1 cursor-pointer shadow-sm transition-all",
                            selectedImage === img ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                        )}
                    >
                        <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                ))}
            </div>

            {/* Main Image Container */}
            <Dialog>
                <div className="relative flex-1 order-1 lg:order-2 flex justify-center items-center">
                    <DialogTrigger asChild>
                        <div className="relative aspect-square w-full max-w-[480px] rounded-2xl overflow-hidden bg-white dark:bg-card border shadow-sm cursor-pointer group">
                            {product.price > 200 && (
                                <div className="absolute top-4 left-4 z-10 bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded-sm shadow-md uppercase tracking-widest">
                                    Frete Grátis
                                </div>
                            )}
                            {/* Overlay de Imagem Ilustrativa */}
                            <div className="absolute bottom-4 left-4 z-10 bg-white/60 backdrop-blur-[2px] px-2 py-0.5 rounded-sm pointer-events-none">
                                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-none">
                                    Imagem Ilustrativa
                                </span>
                            </div>
                            <img
                                src={selectedImage}
                                alt={product.name}
                                className="w-full h-full object-contain p-10 lg:p-16 transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Overlay Indicator */}
                            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border">
                                <Maximize2 className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </DialogTrigger>
                </div>

                {/* Modal Content */}
                <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden h-[90vh]">
                    <div className="sr-only">
                        <DialogTitle>{product.name}</DialogTitle>
                        <DialogDescription>Imagem ampliada do produto {product.name}</DialogDescription>
                    </div>
                    <div className="relative w-full h-full bg-white dark:bg-card rounded-2xl flex items-center justify-center p-4 overflow-hidden">
                        {/* Overlay de Imagem Ilustrativa no Zoom */}
                        <div className="absolute bottom-6 left-6 z-10 bg-white/60 backdrop-blur-[2px] px-3 py-1 rounded-sm pointer-events-none">
                            <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-widest">
                                Imagem Ilustrativa
                            </span>
                        </div>
                        <img
                            src={selectedImage}
                            alt={product.name}
                            className="w-full h-full object-contain shadow-2xl"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
