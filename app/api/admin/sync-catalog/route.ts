import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { fetchProductsFromHiper } from '@/lib/api';

/**
 * Auto-categorization logic (reused from ProductService)
 */
function getCategory(name: string): string {
    const n = name.toUpperCase();
    if (n.includes('BRINQUEDO') || n.includes('BONECA') || n.includes('CARRO')) return 'toys';
    if (n.includes('HIGIENE') || n.includes('SABONETE') || n.includes('ESCOVA')) return 'hygiene';
    if (n.includes('COZINHA') || n.includes('PANELA') || n.includes('PRATO') || n.includes('COPO') || n.includes('AMASSADOR')) return 'kitchen';
    if (n.includes('LIMPEZA') || n.includes('DETERGENTE') || n.includes('VASSOURA')) return 'cleaning';
    if (n.includes('ORGANIZADOR') || n.includes('CAIXA') || n.includes('CESTO') || n.includes('BALEIRO')) return 'organization';
    return 'Geral';
}

export async function POST() {
    try {
        // 1. Fetch from Hiper
        const rawProducts = await fetchProductsFromHiper();
        if (!Array.isArray(rawProducts)) {
            throw new Error('Invalid data from Hiper');
        }

        // 2. Map and Prepare for Upsert (Bringing ALL to Mirror)
        const mappedProducts = rawProducts.map(p => ({
            id: p.id,
            ean: p.codigoDeBarras || String(p.codigo) || 'N/A',
            ref: p.ncm || null,
            name: p.nome || 'Produto sem nome',
            price: Number(p.preco || 0),
            stock: Number(p.quantidadeEmEstoque || 0),
            category: getCategory(p.nome || ''),
            brand: p.marca || null,
            updated_at: new Date().toISOString()
        }));

        // 3. Upsert into Supabase (Batch processing to avoid limits)
        if (!supabaseAdmin) throw new Error('Supabase Admin not initialized');

        // Batch upsert (Supabase handles batching well, but let's be safe if count is huge)
        const { error } = await supabaseAdmin
            .from('products')
            .upsert(mappedProducts, { onConflict: 'id' });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            count: mappedProducts.length,
            message: 'Catalog synchronized successfully'
        });

    } catch (error: any) {
        console.error('[SYNC] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
