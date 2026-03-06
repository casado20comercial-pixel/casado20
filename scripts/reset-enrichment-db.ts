import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function resetDatabase() {
    const { supabaseAdmin } = await import('../lib/supabaseClient');

    if (!supabaseAdmin) {
        console.error('❌ [RESET] Erro: supabaseAdmin não inicializado. Verifique seu .env.local');
        return;
    }

    console.log('⚠️ [RESET] Iniciando limpeza total do banco de dados...');

    try {
        // 1. Limpar índices de catálogos
        console.log('- Limpando catalog_index...');
        const { error: err1 } = await supabaseAdmin.from('catalog_index').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err1) throw err1;

        // 2. Limpar catálogos
        console.log('- Limpando catalogs...');
        const { error: err2 } = await supabaseAdmin.from('catalogs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err2) throw err2;

        // 3. Limpar imagens de produtos
        console.log('- Limpando product_images...');
        const { error: err3 } = await supabaseAdmin.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err3) throw err3;

        // 4. Limpar produtos (Dados do Hiper)
        console.log('- Limpando products...');
        const { error: err4 } = await supabaseAdmin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err4) throw err4;

        console.log('✅ [RESET] Banco de dados limpo com sucesso!');

        // 4. Limpar cache local de PDFs apenas por segurança
        const cacheDir = path.join(process.cwd(), 'temp', 'pdf_cache');
        if (fs.existsSync(cacheDir)) {
            console.log('- Limpando cache local de PDFs...');
            const files = fs.readdirSync(cacheDir);
            for (const file of files) {
                fs.unlinkSync(path.join(cacheDir, file));
            }
        }

    } catch (error) {
        console.error('❌ [RESET] Erro durante a limpeza:', error);
    }
}

resetDatabase();
