// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { AppSidebar } from "@/components/app-sidebar" 

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="border-b bg-white px-4 sm:px-6 py-4 flex items-center justify-between">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 shrink-0">
                    Casa do 20 <span className="hidden sm:inline text-slate-500 font-normal">| Admin</span>
                </h1>
                <nav className="flex gap-3 sm:gap-4 text-[10px] sm:text-sm text-slate-600 font-bold uppercase tracking-wider">
                    <a href="/admin/upload" className="hover:text-black border-b-2 border-primary">Upload</a>
                    <a href="/" className="hover:text-black">Loja</a>
                </nav>
            </header>
            <main className="flex-1 container mx-auto p-6">
                {children}
            </main>
        </div>
    )
}
