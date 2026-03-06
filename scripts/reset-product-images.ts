
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function resetProductImages() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('❌ Erro: Variáveis de ambiente não encontradas.');
        return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('🧹 Iniciando limpeza total de vínculos de produtos...');

    // 1. Limpar image_url na tabela products
    console.log('--- Limpando tabela [products] ---');
    const { error: pError } = await supabaseAdmin
        .from('products')
        .update({ image_url: null })
        .filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

    if (pError) console.error('Erro ao limpar products:', pError.message);
    else console.log('✅ Vitrine principal (products) resetada.');

    // 2. Limpar tudo na tabela product_images (Galeria)
    console.log('--- Limpando tabela [product_images] ---');
    const { error: iError } = await supabaseAdmin
        .from('product_images')
        .delete()
        .filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

    if (iError) console.error('Erro ao limpar product_images:', iError.message);
    else console.log('✅ Galeria de imagens (product_images) resetada.');

    console.log('\n✨ Reset concluído! Pronto para uma nova calibragem.');
}

resetProductImages();
