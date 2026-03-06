import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        if (!supabaseAdmin) throw new Error('Supabase Admin not initialized');

        // Básico: busca todos e filtra apenas se tiver query
        let supabaseQuery = supabaseAdmin
            .from('products')
            .select('id, name, image_url, ean, ref', { count: 'exact' });

        if (query.trim()) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
            if (isUuid) {
                supabaseQuery = supabaseQuery.eq('id', query.trim());
            } else {
                supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
            }
        }

        const { data: products, error: prodError, count } = await supabaseQuery
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (prodError) throw prodError;

        // Busca as imagens para esses produtos manualmente (contornando a falta de FK)
        const skus = (products || []).map(p => p.id);
        const { data: allImages } = await supabaseAdmin
            .from('product_images')
            .select('*')
            .in('sku', skus);

        const productsWithImages = (products || []).map(p => ({
            ...p,
            product_images: (allImages || []).filter(img => img.sku === p.id)
        }));

        return NextResponse.json({
            success: true,
            products: productsWithImages,
            total: count || 0
        });

    } catch (error: any) {
        console.error('[ADMIN_SEARCH] Fatal:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
