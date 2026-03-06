import { fetchProductsFromHiper } from '../lib/api';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function inspectHiperData() {
    try {
        console.log('[HIER_INSPECT] Buscando produtos do Hiper...');
        const products = await fetchProductsFromHiper();
        if (products && products.length > 0) {
            console.log('[HIER_INSPECT] Primeiro produto encontrado:');
            console.log(JSON.stringify(products[0], null, 2));

            // Procurar por NCM em qualquer campo
            const keys = Object.keys(products[0]);
            const ncmKey = keys.find(k => k.toLowerCase().includes('ncm'));
            if (ncmKey) {
                console.log(`\n✅ CAMPO NCM ENCONTRADO: "${ncmKey}" com valor: ${products[0][ncmKey]}`);
            } else {
                console.log('\n❌ Campo NCM não encontrado nos dados brutos.');
            }
        } else {
            console.log('Nenhum produto retornado.');
        }
    } catch (err) {
        console.error('Erro ao inspecionar:', err);
    }
}

inspectHiperData();
