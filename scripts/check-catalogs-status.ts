import { supabaseAdmin } from '../lib/supabaseClient';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkCatalogs() {
    console.log('[DRIVE INDEX] Consultando catálogos registrados...');

    // Consulta os catálogos
    const { data: catalogs, error: catError } = await supabaseAdmin
        .from('catalogs')
        .select('*');

    if (catError) {
        console.error('Erro ao buscar catálogos:', catError);
        return;
    }

    if (!catalogs || catalogs.length === 0) {
        console.log('ℹ️ Nenhum catálogo registrado na tabela "catalogs" ainda.');
        return;
    }

    console.log(`\n--- Status dos Catálogos (${catalogs.length}) ---`);
    for (const cat of catalogs) {
        // Conta quantos itens indexados para este catálogo
        const { count, error: countError } = await supabaseAdmin
            .from('catalog_index')
            .select('*', { count: 'exact', head: true })
            .eq('catalog_id', cat.id);

        console.log(`\n• Arquivo: ${cat.name}`);
        console.log(`  Status: ${cat.status.toUpperCase()}`);
        console.log(`  Itens Indexados: ${count || 0}`);
        console.log(`  Última Modificação: ${cat.last_modified}`);
        console.log(`  Processado em: ${cat.processed_at}`);
        if (cat.status === 'error') {
            console.log(`  ⚠️  Este catálogo apresentou erro no último processamento.`);
        }
    }
}

checkCatalogs();
