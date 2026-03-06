import * as dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis ANTES de importar o Supabase
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function wipeImages() {
    const { supabaseAdmin } = await import('../lib/supabaseClient');
    console.log('⚠️ INICIANDO LIMPEZA TOTAL DE IMAGENS ⚠️');

    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin não inicializado. Verifique seu .env.local');
        return;
    }

    try {
        // 1. Limpar tabela product_images
        console.log('🧹 Limpando tabela product_images...');
        const { error: err1 } = await supabaseAdmin
            .from('product_images')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (err1) {
            console.error('❌ Erro ao limpar product_images:', err1.message);
        } else {
            console.log('✅ Tabela product_images limpa.');
        }

        // 2. Resetar image_url na tabela products
        console.log('🧹 Resetando links de imagem na tabela products...');
        const { error: err2 } = await supabaseAdmin
            .from('products')
            .update({ image_url: null })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

        if (err2) {
            console.error('❌ Erro ao resetar image_url em products:', err2.message);
        } else {
            console.log('✅ Coluna image_url resetada para todos os produtos.');
        }

        // 3. Limpar Storage Bucket 'products'
        console.log('🧹 Esvaziando bucket de storage "products"...');

        // Listar todos os arquivos no bucket
        const { data: files, error: listError } = await supabaseAdmin.storage
            .from('products')
            .list('', { limit: 1000 });

        if (listError) {
            console.error('❌ Erro ao listar arquivos no storage:', listError.message);
        } else if (files && files.length > 0) {
            console.log(`🗑️ Removendo ${files.length} arquivos do storage...`);
            const fileNames = files.map(f => f.name);
            const { error: deleteError } = await supabaseAdmin.storage
                .from('products')
                .remove(fileNames);

            if (deleteError) {
                console.error('❌ Erro ao remover arquivos do storage:', deleteError.message);
            } else {
                console.log('✅ Bucket storage "products" esvaziado.');
            }
        } else {
            console.log('ℹ️ Bucket storage já estava vazio.');
        }

        console.log('\n✨ LIMPEZA CONCLUÍDA COM SUCESSO! ✨');

    } catch (error: any) {
        console.error('💥 Erro fatal durante a limpeza:', error.message);
    }
}

wipeImages();
