import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '12', 10);
        const offset = (page - 1) * limit;

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
        }

        // Busca imagens com paginação
        const { data, count, error } = await supabaseAdmin
            .from('catalog_images_bank')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            images: data,
            total: count
        });

    } catch (error: any) {
        console.error('[API] Bank Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
