
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

async function cleanupExternalImages() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
        return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('🧹 Iniciando limpeza de imagens externas...');
    console.log(`🏠 URLs internas devem começar com: ${supabaseUrl}`);

    // 1. Limpar tabela 'products'
    console.log('\n--- Analisando tabela [products] ---');
    const { data: products, error: pError } = await supabaseAdmin
        .from('products')
        .select('*')
        .not('image_url', 'is', null);

    if (pError) {
        console.error('Erro ao buscar produtos:', pError.message);
    } else {
        let pCount = 0;
        for (const product of products) {
            if (product.image_url && !product.image_url.startsWith(supabaseUrl)) {
                console.log(`🚫 Removendo imagem externa de: ${product.name}`);
                const { error: updateError } = await supabaseAdmin
                    .from('products')
                    .update({ image_url: null })
                    .eq('id', product.id);

                if (updateError) console.error(`Erro ao limpar ${product.name}:`, updateError.message);
                else pCount++;
            }
        }
        console.log(`✅ ${pCount} links externos removidos da vitrine principal (products).`);
    }

    // 2. Limpar tabela 'product_images'
    console.log('\n--- Analisando tabela [product_images] ---');
    const { data: images, error: iError } = await supabaseAdmin
        .from('product_images')
        .select('*')
        .not('image_url', 'is', null);

    if (iError) {
        console.error('Erro ao buscar galeria:', iError.message);
    } else {
        let iCount = 0;
        for (const img of images) {
            if (img.image_url && !img.image_url.startsWith(supabaseUrl)) {
                console.log(`🗑️ Deletando registro de galeria externa (URL: ${img.image_url})`);
                // Deletamos usando a própria URL como filtro se não houver um ID estável, 
                // mas geralmente há ID. Vamos tentar por ID se existir.
                const { error: deleteError } = await supabaseAdmin
                    .from('product_images')
                    .delete()
                    .eq(img.id ? 'id' : 'image_url', img.id || img.image_url);

                if (deleteError) console.error(`Erro ao deletar imagem:`, deleteError.message);
                else iCount++;
            }
        }
        console.log(`✅ ${iCount} imagens externas removidas da galeria (product_images).`);
    }

    console.log('\n✨ Faxina concluída! O banco agora contém apenas fotos oficiais ou manuais.');
}

cleanupExternalImages();
