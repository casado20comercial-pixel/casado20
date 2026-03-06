import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        if (!supabaseAdmin) throw new Error('Supabase Admin not initialized');

        // 1. Get total products from mirrored table
        const { count: total, error: totalError } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // 2. Get total enriched products count (from products table as source of truth)
        const { count: enrichedCount, error: enrichError } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .not('image_url', 'is', null);

        if (enrichError) throw enrichError;

        // 3. Get products missing images (those with stock > 0 and no image_url)
        const { count: missingWithStock, error: missingWithStockError } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .gt('stock', 0)
            .is('image_url', null);

        if (missingWithStockError) throw missingWithStockError;

        // 4. Get a paginated list of products missing images for the UI
        const { data: missingSample, error: sampleError } = await supabaseAdmin
            .from('products')
            .select('id, name, ean, ref')
            .gt('stock', 0)
            .is('image_url', null)
            .range(offset, offset + limit - 1)
            .order('name', { ascending: true });

        if (sampleError) throw sampleError;

        const missingList = (missingSample || []).map(p => ({
            id: p.id,
            name: p.name,
            sku: p.id,
            ean: p.ean,
            ncm: p.ref
        }));

        // 5. Get out of stock products count
        const { count: outOfStock, error: stockError } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('stock', 0);

        if (stockError) throw stockError;

        // 6. Final Statistics
        return NextResponse.json({
            success: true,
            total,
            enriched: enrichedCount || 0,
            missing: (total || 0) - (enrichedCount || 0), // Real total without images
            toEnrich: missingWithStock || 0, // Those we CAN enrich (with stock)
            outOfStock: outOfStock || 0,
            missingList: missingList,
            dailyUsage: 0,
            limit: 2000
        });

    } catch (error: any) {
        console.error('[STATS] Fatal Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown database error',
            details: error
        }, { status: 500 });
    }
}
