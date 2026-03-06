"use client"
import logo from "@/public/images/logo.png"
import Image from 'next/image'

interface HeroBannerProps {
  onViewOffers: () => void
}

export function HeroBanner({ onViewOffers }: HeroBannerProps) {
  return (
    <section className="w-full bg-black text-white p-6 relative overflow-hidden mb-8 border-b-4 border-secondary">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">

        {/* Lado Esquerdo: Logo e Identidade */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left w-70">
          <Image
            src={logo}
            alt="RioHome Utilidades e Decoração"
            className="w-60 h-auto object-contain mix-blend-screen -rotate-1"
          />
          <p className="text-white font-light text-[14.5px]">Conceito em Ultilidades para seu lar</p>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-neutral-800 to-transparent" />
      </div>
    </section>
  )
}
