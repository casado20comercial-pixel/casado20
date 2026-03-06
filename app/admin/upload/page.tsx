"use client"

import { useState, useEffect } from "react"
import {
    CheckCircle,
    Loader2,
    Sparkles,
    ImageIcon,
    Database,
    Globe,
    FileUp,
    ChevronLeft,
    ChevronRight,
    Search,
    Trash2,
    Plus,
    LayoutDashboard,
    Layers,
    RefreshCcw,
    Upload,
    Zap,
    Image as LucideImage
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Correct icon imports


interface Stats {
    total: number;
    enriched: number;
    missing: number;
    toEnrich: number;
    outOfStock: number;
    missingList: any[];
    dailyUsage: number;
    limit: number;
}

export default function AdminPage() {
    const { toast } = useToast()
    // Shared State
    const [activeTab, setActiveTab] = useState("enrichment")

    // Enrichment State
    const [stats, setStats] = useState<Stats | null>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [enriching, setEnriching] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentProduct, setCurrentProduct] = useState<string | null>(null)
    const [enrichLogs, setEnrichLogs] = useState<string[]>([])
    const [isSyncing, setIsSyncing] = useState(false)

    // Modal & Choice State
    const [showHydrateModal, setShowHydrateModal] = useState(false)
    const [hydrateType, setHydrateType] = useState<'upload' | null>(null)
    const [selectedPdfs, setSelectedPdfs] = useState<File[]>([])

    // Catalog Management State
    const [catalogProducts, setCatalogProducts] = useState<any[]>([])
    const [catalogLoading, setCatalogLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [catalogPage, setCatalogPage] = useState(1)
    const [catalogTotal, setCatalogTotal] = useState(0)
    const [selectedProductForPhotos, setSelectedProductForPhotos] = useState<any | null>(null)
    const [galleryLoading, setGalleryLoading] = useState<number | null>(null) // index do slot carregando

    // Bank View State
    const [bankImages, setBankImages] = useState<any[]>([])
    const [bankLoading, setBankLoading] = useState(false)
    const [bankPage, setBankPage] = useState(1)
    const [bankTotal, setBankTotal] = useState(0)

    // Mining State
    const [showMiningModal, setShowMiningModal] = useState(false)
    const [miningUrl, setMiningUrl] = useState("")
    const [isMining, setIsMining] = useState(false)

    const fetchStats = async () => {
        setStatsLoading(true)
        try {
            const res = await fetch(`/api/admin/enrichment-stats?limit=1`, { cache: "no-store" })
            const data = await res.json()
            if (data.success) setStats(data)
        } catch (err) {
            console.error("Failed to fetch stats", err)
        } finally {
            setStatsLoading(false)
        }
    }

    const fetchCatalog = async (pageNum = 1, currentQuery = searchTerm) => {
        setCatalogLoading(true)
        try {
            const res = await fetch(`/api/admin/products/search?q=${currentQuery}&page=${pageNum}&limit=12`)
            const data = await res.json()
            if (data.success) {
                setCatalogProducts(data.products || [])
                setCatalogTotal(data.total || 0)
            } else {
                setCatalogProducts([])
            }
        } catch (err) {
            console.error("Error fetching catalog", err)
        } finally {
            setCatalogLoading(false)
        }
    }

    const fetchBank = async (pageNum = 1) => {
        setBankLoading(true)
        try {
            const res = await fetch(`/api/admin/catalog-bank?page=${pageNum}&limit=12`)
            const data = await res.json()
            if (data.success) {
                setBankImages(data.images || [])
                setBankTotal(data.total || 0)
            }
        } catch (err) {
            console.error("Error fetching bank", err)
        } finally {
            setBankLoading(false)
        }
    }

    useEffect(() => {
        if (activeTab === "enrichment") {
            fetchStats()
        } else if (activeTab === "bank") {
            fetchBank(bankPage)
        } else if (activeTab === "catalog" && !searchTerm) {
            fetchCatalog(catalogPage)
        }
    }, [catalogPage, bankPage, activeTab])

    useEffect(() => {
        if (activeTab !== "catalog") return;
        const timeout = setTimeout(() => {
            setCatalogPage(1);
            fetchCatalog(1, searchTerm);
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm])

    const handleStartEnrichment = async (type: 'upload') => {
        if (selectedPdfs.length === 0) return
        setEnriching(true)
        setProgress(0)
        setEnrichLogs([`🚀 Iniciando construção do Banco de Imagens (PDF)...`])
        try {
            for (let i = 0; i < selectedPdfs.length; i++) {
                const file = selectedPdfs[i];
                setEnrichLogs(prev => [`📄 Processando Catálogo (${i + 1}/${selectedPdfs.length}): ${file.name}`, ...prev])
                const formData = new FormData()
                formData.append("file", file)
                formData.append("maxPages", "999")
                const res = await fetch("/api/admin/extract-catalog", { method: "POST", body: formData })
                if (!res.body) throw new Error("Sem feedback do servidor")
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let accumulated = ""
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    accumulated += decoder.decode(value, { stream: true })
                    const lines = accumulated.split("\n")
                    accumulated = lines.pop() || ""
                    for (const line of lines) {
                        if (!line.trim()) continue
                        try {
                            const data = JSON.parse(line)
                            if (data.type === "progress") setEnrichLogs(prev => [data.message, ...prev.slice(0, 100)])
                            else if (data.type === "complete") setEnrichLogs(prev => [`✨ Finalizado: ${file.name}`, ...prev])
                            else if (data.type === "error") setEnrichLogs(prev => [`❌ Erro no arquivo ${file.name}: ${data.message}`, ...prev])
                        } catch (e) { console.error("Error parsing log:", e) }
                    }
                }
                setProgress(Math.round(((i + 1) / selectedPdfs.length) * 100))
            }
        } catch (err: any) { setEnrichLogs(prev => [`❌ Erro crítico: ${err.message}`, ...prev]) }
        setEnriching(false)
        setCurrentProduct(null)
        setEnrichLogs(prev => ["🏁 Banco de Imagens atualizado!", ...prev])
        fetchStats()
        if (activeTab === "bank") fetchBank(bankPage)
    }

    const handleStartMining = async () => {
        if (!miningUrl) return
        setEnriching(true)
        setIsMining(true)
        setProgress(0)
        setEnrichLogs([`🕵️ Iniciando mineração no site do fornecedor...`])
        setShowMiningModal(false)

        try {
            const res = await fetch("/api/admin/mining", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: miningUrl, provider: 'qhouse' })
            })

            if (!res.body) throw new Error("Sem feedback do servidor")
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let accumulated = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                accumulated += decoder.decode(value, { stream: true })
                const lines = accumulated.split("\n")
                accumulated = lines.pop() || ""

                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const data = JSON.parse(line)
                        if (data.type === "progress") setEnrichLogs(prev => [data.message, ...prev.slice(0, 100)])
                        else if (data.type === "complete") setEnrichLogs(prev => [`✨ Mineração concluída!`, ...prev])
                        else if (data.type === "error") setEnrichLogs(prev => [`❌ Erro na mineração: ${data.message}`, ...prev])
                    } catch (e) { console.error("Error parsing log:", e) }
                }
            }
        } catch (err: any) {
            setEnrichLogs(prev => [`❌ Erro crítico: ${err.message}`, ...prev])
        } finally {
            setEnriching(false)
            setIsMining(false)
            fetchStats()
            if (activeTab === "bank") fetchBank(bankPage)
        }
    }

    const handleSyncCatalog = async () => {
        setIsSyncing(true)
        setEnrichLogs(prev => [`🔄 Iniciando sincronização completa com Hiper...`, ...prev])
        try {
            const res = await fetch("/api/admin/sync-catalog", { method: "POST" })
            const data = await res.json()
            if (data.success) {
                setEnrichLogs(prev => [`✅ Sincronização concluída: ${data.count} produtos atualizados.`, ...prev])
                fetchStats()
            } else { setEnrichLogs(prev => [`❌ Falha no Sync: ${data.error}`, ...prev]) }
        } catch (err) { setEnrichLogs(prev => [`⚠️ Erro de rede na sincronização`, ...prev]) }
        finally { setIsSyncing(false) }
    }

    const handleReconcile = async () => {
        setEnriching(true)
        setProgress(0)
        setEnrichLogs([`🔍 Iniciando motor de Match Probabilístico...`])
        try {
            const res = await fetch("/api/admin/match-images", { method: "POST" })
            if (!res.body) throw new Error("Sem feedback do servidor")
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let accumulated = ""
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                accumulated += decoder.decode(value, { stream: true })
                const lines = accumulated.split("\n")
                accumulated = lines.pop() || ""
                for (const line of lines) {
                    if (!line.trim()) continue
                    try {
                        const data = JSON.parse(line)
                        if (data.type === "progress") setEnrichLogs(prev => [data.message, ...prev.slice(0, 100)])
                        else if (data.type === "complete") setEnrichLogs(prev => [`✨ Match concluído!`, ...prev])
                        else if (data.type === "error") setEnrichLogs(prev => [`❌ Erro no Match: ${data.message}`, ...prev])
                    } catch (e) { console.error("Error parsing log:", e) }
                }
            }
        } catch (err: any) { setEnrichLogs(prev => [`❌ Erro no Match: ${err.message}`, ...prev]) }
        setEnriching(false)
        fetchStats()
    }

    const handleGalleryUpload = async (slot: number, file: File) => {
        if (!selectedProductForPhotos) return
        setGalleryLoading(slot)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("sku", selectedProductForPhotos.id)
        formData.append("ean", selectedProductForPhotos.ean || "")
        formData.append("slot", slot.toString())
        try {
            const res = await fetch("/api/admin/products/gallery", { method: "POST", body: formData })
            const data = await res.json()
            if (data.success) {
                toast({
                    title: "Sucesso!",
                    description: `Imagem enviada para o Slot ${slot + 1}`,
                })
                const refreshRes = await fetch(`/api/admin/products/search?q=${selectedProductForPhotos.id}&limit=1`)
                const refreshData = await refreshRes.json()
                if (refreshData.success && refreshData.products.length > 0) {
                    setSelectedProductForPhotos(refreshData.products[0])
                    fetchCatalog(catalogPage)
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro no Upload",
                    description: data.error || "Não foi possível carregar a imagem.",
                })
            }
        } catch (err) {
            console.error("Error uploading gallery image:", err)
            toast({
                variant: "destructive",
                title: "Erro de Rede",
                description: "Falha na comunicação com o servidor.",
            })
        }
        finally { setGalleryLoading(null) }
    }

    const handleGalleryDelete = async (imageUrl: string) => {
        if (!selectedProductForPhotos) return
        if (!confirm("Deseja realmente excluir esta imagem?")) return
        try {
            const res = await fetch("/api/admin/products/gallery", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sku: selectedProductForPhotos.id, imageUrl })
            })
            const data = await res.json()
            if (data.success) {
                toast({
                    title: "Removida",
                    description: "A imagem foi excluída com sucesso.",
                })
                const refreshRes = await fetch(`/api/admin/products/search?q=${selectedProductForPhotos.id}&limit=1`)
                const refreshData = await refreshRes.json()
                if (refreshData.success && refreshData.products.length > 0) {
                    setSelectedProductForPhotos(refreshData.products[0])
                    fetchCatalog(catalogPage)
                } else {
                    // Se não encontrar (fallback improvável), limpa localmente
                    setSelectedProductForPhotos({
                        ...selectedProductForPhotos,
                        image_url: selectedProductForPhotos.image_url === imageUrl ? null : selectedProductForPhotos.image_url,
                        product_images: (selectedProductForPhotos.product_images || []).filter((img: any) => img.image_url !== imageUrl)
                    })
                    fetchCatalog(catalogPage)
                }
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro na Exclusão",
                    description: data.error || "Ocorreu um erro ao remover a imagem.",
                })
            }
        } catch (err) {
            console.error("Error deleting image:", err)
            toast({
                variant: "destructive",
                title: "Erro de Rede",
                description: "Não foi possível conectar ao servidor.",
            })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Inteligência</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Gestão autônoma de catálogo e enriquecimento visual.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                        <button
                            onClick={() => setActiveTab("enrichment")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "enrichment" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Zap className="w-4 h-4" />
                            Automação
                        </button>
                        <button
                            onClick={() => setActiveTab("catalog")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "catalog" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Layers className="w-4 h-4" />
                            Vitrine
                        </button>
                        <button
                            onClick={() => setActiveTab("bank")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "bank" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <LucideImage className="w-4 h-4" />
                            Banco
                        </button>
                    </div>
                </div>

                {activeTab === "enrichment" ? (
                    /* --- SEÇÃO DE ENRIQUECIMENTO --- */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Status Cards */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Globe className="w-32 h-32" />
                                </div>
                                <CardHeader className="p-8">
                                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-2">Saúde do Catálogo</p>
                                    <div className="flex items-end gap-2">
                                        <CardTitle className="text-5xl font-black tabular-nums leading-none">
                                            {statsLoading ? "..." : `${Math.round((stats?.enriched || 0) / (stats?.total || 1) * 100)}%`}
                                        </CardTitle>
                                        <span className="text-emerald-400 font-bold mb-1">Completo</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 pt-0">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Total Enriquecido</span>
                                            <span className="font-bold">{stats?.enriched} / {stats?.total}</span>
                                        </div>
                                        <Progress value={(stats?.enriched || 0) / (stats?.total || 1) * 100} className="h-2 bg-slate-700 overflow-hidden rounded-full [&>div]:bg-emerald-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-xl bg-white p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 group">
                                        <div className="bg-amber-100 p-3 rounded-2xl group-hover:bg-amber-500 transition-colors">
                                            <LucideImage className="w-6 h-6 text-amber-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-slate-900">{stats?.toEnrich}</p>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Aguardando Fotos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="bg-rose-100 p-3 rounded-2xl group-hover:bg-rose-500 transition-colors">
                                            <RefreshCcw className="w-6 h-6 text-rose-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-slate-900">{stats?.outOfStock}</p>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Fora de Estoque</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Control Section */}
                        <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden relative">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <CardTitle className="text-2xl font-black text-slate-900 underline decoration-amber-500 decoration-4 underline-offset-8">Operações de Dados</CardTitle>
                                        <CardDescription className="mt-4 text-slate-500 font-medium">Acione os motores de inteligência e sincronização.</CardDescription>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleSyncCatalog}
                                            disabled={isSyncing}
                                            variant="outline"
                                            className="h-12 px-6 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest gap-3 hover:bg-slate-50"
                                        >
                                            <RefreshCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                                            Sync ERP
                                        </Button>
                                        <Button
                                            onClick={() => setShowHydrateModal(true)}
                                            disabled={enriching}
                                            variant="outline"
                                            className="h-12 px-6 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest gap-3 hover:bg-slate-50"
                                        >
                                            <FileUp className="w-4 h-4" />
                                            Extrair PDF
                                        </Button>
                                        <Button
                                            onClick={() => setShowMiningModal(true)}
                                            disabled={enriching}
                                            className="h-12 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-amber-500/20"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Minerar Web
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 gap-6">
                                    <div
                                        onClick={handleReconcile}
                                        className={cn(
                                            "group p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer hover:border-amber-500 hover:bg-amber-50/50",
                                            enriching ? "opacity-50 pointer-events-none grayscale" : "border-slate-200"
                                        )}
                                    >
                                        <div className="bg-amber-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                                            <Sparkles className="w-7 h-7 text-amber-600 group-hover:text-white" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-800 mb-3">Vincular Vitrine</h4>
                                        <p className="text-base text-slate-500 leading-relaxed font-medium">Inicia a varredura nuclear para associar fotos do acervo aos produtos sem imagem usando nossa inteligência interna.</p>
                                    </div>
                                </div>

                                {enriching && (
                                    <div className="mt-8 space-y-6 animate-in slide-in-from-top duration-500">
                                        <Card className="border-none bg-slate-900 border-l-4 border-amber-500 p-6 flex items-center gap-6 shadow-2xl">
                                            <div className="relative">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
                                                <div className="bg-slate-800 p-4 rounded-full relative border border-slate-700">
                                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-amber-600 uppercase font-black tracking-widest mb-1">Processando Agora</p>
                                                <h5 className="text-lg font-bold text-white truncate max-w-sm">{currentProduct || "Aguardando..."}</h5>
                                            </div>
                                        </Card>

                                        <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[10px] text-emerald-400 h-48 overflow-y-auto shadow-2xl border-t-4 border-emerald-500 whitespace-pre-wrap">
                                            {enrichLogs.map((log, i) => (
                                                <div key={i} className="mb-2 opacity-90 flex gap-3">
                                                    <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                                                    <span>{log}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : activeTab === "bank" ? (
                    /* --- SEÇÃO DO BANCO DE IMAGENS --- */
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <Card className="border-none shadow-xl bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                                                <ImageIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <CardTitle className="text-2xl font-black text-slate-900">Acervo Completo</CardTitle>
                                        </div>
                                        <CardDescription className="mt-2 text-slate-500">Total de {bankTotal} imagens extraídas de catálogos e uploads.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pb-4">
                                {bankLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Acessando acervo...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {bankImages.map((img) => (
                                            <Card key={img.id} className="group border-none shadow-lg bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100">
                                                <div className="relative aspect-square w-full bg-slate-50 p-4 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={img.image_url}
                                                        alt={img.name}
                                                        className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                        {img.ref_id && (
                                                            <Badge className="bg-slate-900/80 backdrop-blur border-none text-[8px] font-black uppercase tracking-widest">{img.ref_id}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {/* Bank Pagination */}
                                {!bankLoading && bankImages.length > 0 && (
                                    <div className="mt-12 flex items-center justify-center gap-4 border-t pt-8">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setBankPage(p => Math.max(1, p - 1))}
                                            disabled={bankPage === 1}
                                            className="rounded-xl border-slate-200"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <div className="h-10 px-4 bg-slate-100 flex items-center justify-center rounded-xl font-black text-xs text-slate-600 min-w-[80px]">
                                            {bankPage} / {Math.ceil(bankTotal / 12)}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setBankPage(p => p + 1)}
                                            disabled={bankPage * 12 >= bankTotal}
                                            className="rounded-xl border-slate-200"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    /* --- SEÇÃO GERENCIADOR DE VITRINE --- */
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <Card className="border-none shadow-xl bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/20">
                                            <LucideImage className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black text-slate-900">Gerenciador de Vitrine</CardTitle>
                                            <CardDescription className="text-slate-500">Busque produtos e refine sua vitrine manualmente.</CardDescription>
                                        </div>
                                    </div>
                                    <div className="relative w-full md:w-96">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar produto pelo nome..."
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {catalogLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4">
                                <div className="relative min-h-[400px]">
                                    {catalogLoading && catalogProducts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando catálogo...</p>
                                        </div>
                                    ) : catalogProducts.length === 0 ? (
                                        <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                            <h5 className="text-lg font-bold text-slate-400">Nenhum produto encontrado</h5>
                                            <p className="text-slate-400 text-sm">Tente outro termo de busca ou verifique sua conexão.</p>
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300",
                                            catalogLoading ? "opacity-40 pointer-events-none" : "opacity-100"
                                        )}>
                                            {catalogProducts.map((p) => (
                                                <Card key={p.id} className="group border-none shadow-lg bg-white overflow-hidden hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100">
                                                    <div className="relative aspect-square w-full bg-slate-50 p-6 flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={p.image_url || '/images/placeholder.png'}
                                                            alt={p.name}
                                                            className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                        <Badge
                                                            variant={p.image_url ? "secondary" : "destructive"}
                                                            className={cn(
                                                                "absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest shadow-lg px-2 border-none",
                                                                p.image_url ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                                            )}
                                                        >
                                                            {p.image_url ? "Com Foto" : "Sem Foto"}
                                                        </Badge>
                                                    </div>
                                                    <CardContent className="p-4 space-y-2">
                                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 min-h-10 leading-snug">
                                                            {p.name}
                                                        </h4>
                                                        <Button
                                                            size="sm"
                                                            className="w-full mt-2 bg-slate-900 hover:bg-black rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 h-9"
                                                            onClick={() => setSelectedProductForPhotos(p)}
                                                        >
                                                            <ImageIcon className="w-3 h-3 text-amber-500" />
                                                            Gerenciar Fotos
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Catalog Pagination */}
                                {!catalogLoading && catalogProducts.length > 0 && (
                                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 border-t pt-8">
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                            Total: <span className="text-slate-900">{catalogTotal}</span> produtos
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                                                disabled={catalogPage === 1}
                                                className="rounded-xl border-slate-200"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                            <div className="h-10 px-4 bg-slate-100 flex items-center justify-center rounded-xl font-black text-xs text-slate-600 min-w-[80px]">
                                                {catalogPage} / {Math.ceil(catalogTotal / 12)}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setCatalogPage(p => p + 1)}
                                                disabled={catalogPage * 12 >= catalogTotal}
                                                className="rounded-xl border-slate-200"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* --- MODAL DE HIDRATAÇÃO (PDF) --- */}
                <Dialog open={showHydrateModal} onOpenChange={(open) => {
                    setShowHydrateModal(open)
                    if (!open) { setHydrateType(null); setSelectedPdfs([]); }
                }}>
                    <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-xl">
                                    <FileUp className="w-6 h-6 text-amber-600" />
                                </div>
                                Extração de Catálogo
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium pt-2">
                                Suba um catálogo em PDF para que o Gemini extraia os produtos e alimente o acervo.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-6">
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="bg-white p-4 rounded-2xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-amber-500" />
                                    </div>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                                        {selectedPdfs.length > 0 ? `${selectedPdfs.length} arquivo(s)` : "Selecionar PDF"}
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept=".pdf"
                                    onChange={(e) => setSelectedPdfs(Array.from(e.target.files || []))}
                                />
                            </label>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={() => { handleStartEnrichment('upload'); setShowHydrateModal(false); }}
                                disabled={selectedPdfs.length === 0}
                                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95"
                            >
                                Iniciar Extração Atômica
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- MODAL DE MINERAÇÃO WEB --- */}
                <Dialog open={showMiningModal} onOpenChange={setShowMiningModal}>
                    <DialogContent className="sm:max-w-xl rounded-3xl border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="bg-amber-500 p-2 rounded-xl">
                                    <Globe className="w-6 h-6 text-white" />
                                </div>
                                Mineração Direta (Scraping)
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium pt-2">
                                Insira a URL da categoria do site do fornecedor (ex: QHouse) para minerar fotos e referências técnicas.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Categoria</Label>
                                <input
                                    type="text"
                                    placeholder="https://www.qhouseloja.com.br/acessorios-mobilia-c10"
                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl py-4 px-4 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
                                    value={miningUrl}
                                    onChange={(e) => setMiningUrl(e.target.value)}
                                />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                                    💡 Dica: Use URLs de categorias específicas para resultados mais rápidos e precisos. O motor irá extrair fotos em alta resolução vinculadas ao EAN e Referência.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                onClick={handleStartMining}
                                disabled={!miningUrl || isMining}
                                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 gap-3"
                            >
                                {isMining && <Loader2 className="w-4 h-4 animate-spin" />}
                                Iniciar Mineração Nuclear
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- DIALOG DE GERENCIAMENTO DE FOTOS --- */}
                <Dialog open={!!selectedProductForPhotos} onOpenChange={(open) => !open && setSelectedProductForPhotos(null)}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-xl">
                                    <LucideImage className="w-6 h-6 text-amber-600" />
                                </div>
                                Gestor de Mídias
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Gerencie as fotos de: <span className="text-slate-900 font-black italic">{selectedProductForPhotos?.name}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
                            {[0, 1, 2].map((idx) => {
                                const galleryImages = selectedProductForPhotos?.product_images || [];
                                // Lógica de slots: Slot 1 é o is_primary, os outros são o resto
                                let imgUrl = null;
                                if (idx === 0) {
                                    imgUrl = selectedProductForPhotos?.image_url;
                                } else {
                                    const secondaryImages = galleryImages.filter((img: any) => !img.is_primary);
                                    imgUrl = secondaryImages[idx - 1]?.image_url;
                                }

                                return (
                                    <div key={idx} className="space-y-3">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                                            Slot {idx + 1} {idx === 0 && "(Principal)"}
                                        </p>
                                        <div className="relative aspect-square w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 group overflow-hidden flex items-center justify-center">
                                            {galleryLoading === idx ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Processando...</span>
                                                </div>
                                            ) : imgUrl ? (
                                                <>
                                                    <img
                                                        src={imgUrl}
                                                        className="max-w-full max-h-full w-auto h-auto object-contain p-4 transition-all group-hover:blur-sm"
                                                        alt={`Preview ${idx + 1}`}
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="rounded-full w-10 h-10 shadow-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleGalleryDelete(imgUrl);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 cursor-pointer p-8 w-full h-full justify-center">
                                                    <Plus className="w-8 h-8 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Adicionar Mídia</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) handleGalleryUpload(idx, e.target.files[0])
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <DialogFooter className="border-t pt-6">
                            <Button
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-slate-200 font-bold text-slate-400 uppercase tracking-widest text-xs"
                                onClick={() => setSelectedProductForPhotos(null)}
                            >
                                Fechar Gestor
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
