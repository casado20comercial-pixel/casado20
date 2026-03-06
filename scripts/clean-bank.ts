import { supabaseAdmin } from '../lib/supabaseClient';

async function resetAndClean() {
    console.log('🧹 Limpando o Banco de Imagens...');

    if (!supabaseAdmin) {
        console.error('Supabase Admin client is missing');
        return;
    }

    // 1. Limpar tabela do Banco de Imagens
    const { error: bankError } = await supabaseAdmin
        .from('catalog_images_bank')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (bankError) console.error('Erro limpando catalog_images_bank:', bankError);
    else console.log('✅ catalog_images_bank limpa.');

    // 2. Limpar a tabela de catálogos processados para permitir re-scan
    const { error: authError } = await supabaseAdmin
        .from('processed_catalogs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (authError) console.error('Erro limpando processed_catalogs:', authError);
    else console.log('✅ processed_catalogs limpa (Pronto para re-scan).');

    // 3. Limpar links de imagens dos produtos da tabela products
    const { error: prodError } = await supabaseAdmin
        .from('products')
        .update({ image_url: null })
        .neq('image_url', 'null');

    if (prodError) console.error('Erro zerando imagens em products:', prodError);
    else console.log('✅ Imagens removidas de products.');

    // 4. Limpar links de imagens da tabela product_images (se necessário)
    const { error: piError } = await supabaseAdmin
        .from('product_images')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (piError) console.error('Erro zerando imagens em product_images:', piError);
    else console.log('✅ Imagens removidas de product_images.');

    console.log('✨ Limpeza concluída!');
}

resetAndClean();
