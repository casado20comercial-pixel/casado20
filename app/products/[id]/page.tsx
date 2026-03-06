import { notFound } from "next/navigation"
import { Header } from "@/components/store/header"
import { ProductDetails } from "@/components/store/product-details"
import { ContinueShoppingButton } from "@/components/store/continue-shopping-button"
import { ProductCard } from "@/components/store/product-card"
import { ProductService } from "@/lib/services/products"
import { Clock, CheckCircle2 } from "lucide-react"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await ProductService.getById(id)

  if (!product) {
    notFound()
  }

  // Fetch related products from the same category using our new paginated/filtered service
  const { products: relatedPool } = await ProductService.getAll(1, 10, product.category)
  const relatedProducts = relatedPool
    .filter(p => p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 grow max-w-7xl">
        <ProductDetails product={product}>
          {/* Tabs/Accordion for Product Info - Redesigned for modern feel */}
          <div className="mt-16 grid md:grid-cols-2 gap-12 border-t pt-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                Características
              </h2>
              <div className="prose prose-neutral max-w-none">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none pl-0">
                  <li className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">Material: {product.material || "Qualidade Premium"}</span>
                  </li>
                  <li className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">Ref: {product.ref || product.id}</span>
                  </li>
                  {product.masterBox && (
                    <li className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">Cx. Master: {product.masterBox} un</span>
                    </li>
                  )}
                  <li className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium">Design Funcional</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                Qualidade Casa do 20
              </h2>
              <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed">
                <p>
                  Na <strong>Casa do 20</strong>, selecionamos cada item pensando na durabilidade e no design que seu ambiente merece.
                  Este produto da categoria <strong>{product.category}</strong> passou por nossa curadoria para garantir o melhor custo-benefício.
                </p>
                <p className="mt-4 text-sm italic">
                  * Imagens meramente ilustrativas de acordo com o catálogo oficial do fornecedor.
                </p>
              </div>
              <div className="pt-4">
                <ContinueShoppingButton variant="ghost" className="font-bold underline" />
              </div>
            </div>
          </div>
        </ProductDetails>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black tracking-tighter">VOCÊ TAMBÉM PODE GOSTAR</h2>
              <div className="h-1 flex-1 bg-muted mx-8 hidden sm:block" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="h-full hover:-translate-y-2 transition-transform duration-300">
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <div className="h-16 lg:hidden" />
    </div>
  )
}
