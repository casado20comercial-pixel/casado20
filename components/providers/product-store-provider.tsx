"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useProductStore } from "@/lib/store"

const ProductStoreContext = createContext<boolean>(false)

export function ProductStoreProvider({ children }: { children: React.ReactNode }) {
    const [isHydrated, setIsHydrated] = useState(false)

    // Wait for hydration to complete
    useEffect(() => {
        const handleHydration = async () => {
            // Manually trigger hydration if skipHydration is true, 
            // or just wait for the persist middleware to do its thing.
            // In Zustand 5 with persist, we can check rehydrate store.
            await useProductStore.persist.rehydrate()
            setIsHydrated(true)
        }

        handleHydration()
    }, [])

    if (!isHydrated) {
        // Return a fragment or a skeleton during hydration to avoid mismatch
        return <>{children}</>
    }

    return (
        <ProductStoreContext.Provider value={isHydrated}>
            {children}
        </ProductStoreContext.Provider>
    )
}

export const useIsHydrated = () => useContext(ProductStoreContext)
