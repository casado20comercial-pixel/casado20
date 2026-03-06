import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Footer } from "@/components/store/footer"
import { CartDrawer } from "@/components/store/cart-drawer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: 'Casa do 20 | Conceito em Utilidades para o seu lar',
    template: '%s | Casa do 20'
  },
  description: 'Encontre as melhores utilidades domésticas, brinquedos, higiene e muito mais. Entrega rápida e preços incríveis!',
  generator: 'Next.js',
  applicationName: 'Casa do 20',
  referrer: 'origin-when-cross-origin',
  keywords: ['utilidades domésticas', 'brinquedos', 'higiene', 'decoração', 'casa do 20', 'preço baixo', 'delivery'],
  authors: [{ name: 'Casa do 20' }],
  creator: 'Casa do 20',
  publisher: 'Casa do 20',
  metadataBase: new URL('https://casado20.com.br'), // Substituir pela URL real quando tiver
  openGraph: {
    title: 'Casa do 20 | Conceito em Utilidades para o seu lar',
    description: 'Encontre as melhores utilidades domésticas, brinquedos, higiene e muito mais. Entrega rápida e preços incríveis!',
    url: 'https://casado20.com.br',
    siteName: 'Casa do 20',
    images: [
      {
        url: '/images/og-image.jpg', // Criar ou usar logo por enquanto
        width: 1200,
        height: 630,
        alt: 'Casa do 20 - Utilidades para o lar',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casa do 20 | Conceito em Utilidades para o seu lar',
    description: 'Encontre as melhores utilidades domésticas, brinquedos, higiene e muito mais.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: '/images/logo.webp',
  },
}

export const viewport: Viewport = {
  themeColor: '#2D1B4D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { ProductStoreProvider } from "@/components/providers/product-store-provider"

// ... (imports)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <ProductStoreProvider>
          <div className="grow">
            {children}
          </div>
          <Analytics />
          <Footer />
          <CartDrawer />
          <Toaster />
        </ProductStoreProvider>
      </body>
    </html>
  )
}
