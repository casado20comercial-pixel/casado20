import { supabaseAdmin } from '../lib/supabaseClient';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verifyCounts() {
    if (!supabaseAdmin) {
        console.error('❌ [VERIFY] Erro: supabaseAdmin não inicializado.');
        return;
    }

    console.log('[VERIFY] Contando registros no banco...');

    const tables = ['catalogs', 'catalog_index', 'product_images'];

    for (const table of tables) {
        const { count, error } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Erro ao contar ${table}:`, error.message);
        } else {
            console.log(`- Tabela ${table}: ${count} registros`);
        }
    }
}

verifyCounts();
