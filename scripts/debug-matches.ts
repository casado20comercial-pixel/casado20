import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../lib/supabaseClient';

async function debug() {
    if (!supabaseAdmin) return;

    console.log('--- DIAGNÓSTICO DE MATCH ---');

    // 1. Pegar 10 produtos sem imagem
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('*')
        .is('image_url', null)
        .limit(10);

    // 2. Pegar 20 imagens do banco
    const { data: bank } = await supabaseAdmin
        .from('catalog_images_bank')
        .select('*')
        .limit(20);

    console.log('\n📦 PRODUTOS SEM IMAGEM (Amostra):');
    products?.forEach(p => console.log(`- ID: ${p.id} | Nome: ${p.name} | Ref: ${p.ref} | EAN: ${p.ean}`));

    console.log('\n🖼️ IMAGENS NO BANCO (Amostra):');
    bank?.forEach(b => console.log(`- ID: ${b.id} | Nome: ${b.name} | Ref: ${b.ref_id} | EAN: ${b.ean}`));
}

debug();
