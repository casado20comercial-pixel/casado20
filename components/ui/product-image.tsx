"use client"

import Image, { ImageProps } from "next/image"
import { useState, useEffect } from "react"
import type { Product } from "@/lib/types"

interface ProductImageProps extends Omit<ImageProps, "src" | "alt"> {
    product: Product
    alt?: string
}

export function ProductImage({ product, alt, ...props }: ProductImageProps) {
    // Strategy:
    // 1. Try EAN (product.ref) in Supabase
    // 2. Try ID in Supabase
    // 3. Fallback to Placeholder

    const SUPABASE_STORAGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products`

    const [src, setSrc] = useState<string>(product.image || "/images/placeholder.png")
    const [status, setStatus] = useState<'initial' | 'trying_ref' | 'trying_id' | 'placeholder'>('initial')

    useEffect(() => {
        // First priority: Official image_url from the database
        if (product.image && !product.image.includes('placeholder.png')) {
            setSrc(product.image)
            setStatus('initial')
        } else {
            // No official link, start the storage backup sequence
            tryNextSource('initial')
        }
    }, [product.image, product.ref, product.id])

    const tryNextSource = (currentStatus: string) => {
        const timestamp = new Date().getTime();

        if (currentStatus === 'initial') {
            if (product.ref && product.ref !== 'N/A') {
                setSrc(`${SUPABASE_STORAGE_URL}/${product.ref}.webp?t=${timestamp}`)
                setStatus('trying_ref')
            } else {
                tryNextSource('trying_ref')
            }
        }
        else if (currentStatus === 'trying_ref') {
            if (product.id) {
                setSrc(`${SUPABASE_STORAGE_URL}/${product.id}.webp?t=${timestamp}`)
                setStatus('trying_id')
            } else {
                tryNextSource('trying_id')
            }
        }
        else {
            setSrc("/images/placeholder.png")
            setStatus('placeholder')
        }
    }

    const handleError = () => {
        // Failed? Try next one in the hierarchy
        tryNextSource(status)
    }

    return (
        <Image
            width={1000}
            height={1000}
            {...props}
            src={src}
            alt={alt || product.name}
            onError={handleError}
        />
    )
}
