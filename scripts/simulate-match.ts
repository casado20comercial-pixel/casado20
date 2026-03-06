
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

async function simulateFind() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Dados EXTRAÍDOS DA IMAGEM no PDF
    const imgName = 'CHURRASCO 2PÇS';
    const imgRef = 'UCO200';
    const imgEan = '7908323341783';

    console.log('--- SIMULANDO BUSCA "AS CEGAS" PARA A IMAGEM DOC PDF ---');
    console.log(`Dados da Foto: Nome="${imgName}", Ref="${imgRef}", EAN="${imgEan}"\n`);

    // PASSO 1: Busch por EAN
    console.log('1. Buscando no ERP por EAN (7908323341783)...');
    const { data: byEan } = await sb.from('products').select('*').eq('ean', imgEan);
    if (byEan?.length) {
        console.log(`   ✅ SUCESSO! Encontrei pelo EAN: "${byEan[0].name}"`);
    } else {
        console.log('   ❌ FALHA: Nenhum produto no ERP tem esse EAN.');
    }

    // PASSO 2: Busca por Referência
    console.log('\n2. Buscando no ERP por Referência (UCO200)...');
    const { data: byRef } = await sb.from('products').select('*').eq('ref', imgRef);
    if (byRef?.length) {
        console.log(`   ✅ SUCESSO! Encontrei pela Ref: "${byRef[0].name}"`);
    } else {
        console.log('   ❌ FALHA: Nenhum produto no ERP tem essa Referência.');
    }

    // PASSO 3: Busca por Nome
    console.log('\n3. Buscando no ERP por Palavra-Chave "CHURRASCO"...');
    const { data: byName } = await sb.from('products').select('*').ilike('name', '%CHURRASCO%').limit(10);
    if (byName?.length) {
        console.log(`   ⚠️ CANDIDATOS ENCONTRADOS NO ERP (${byName.length}):`);
        byName.forEach(p => {
            console.log(`   - "${p.name}" (EAN: ${p.ean} | Ref: ${p.ref} | Preço: ${p.price})`);
        });
    } else {
        console.log('   ❌ FALHA: Nenhum produto tem "Churrasco" no nome.');
    }
}
simulateFind();
