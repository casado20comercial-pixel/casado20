
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const sb = createClient(supabaseUrl, supabaseKey);

    console.log('--- BUSCANDO EXEMPLO DE ERRO ---');

    // 1. Achar o produto avental
    const { data: products } = await sb
        .from('products')
        .select('*')
        .ilike('name', '%AVENTAL CHURRASCO%')
        .limit(1);

    if (!products?.length) {
        console.log('Produto Avental não encontrado no Catálogo Hiper.');
        return;
    }

    const p = products[0];
    console.log('ERP/HIPER:');
    console.log(`- Nome: ${p.name}`);
    console.log(`- Ref ERP: ${p.ref}`);
    console.log(`- EAN ERP: ${p.ean}`);
    console.log(`- Preço: ${p.price}`);
    console.log(`- URL Atual: ${p.image_url}`);

    if (p.image_url) {
        // 2. Achar a imagem no banco de extrações
        const { data: bank } = await sb
            .from('catalog_images_bank')
            .select('*')
            .eq('image_url', p.image_url)
            .limit(1);

        if (bank?.length) {
            console.log('\n--- DADOS EXTRAÍDOS DO PDF (Para esta imagem) ---');
            const b = bank[0];
            console.log(`- Nome no PDF: ${b.name}`);
            console.log(`- Ref no PDF: ${b.ref_id}`);
            console.log(`- EAN no PDF: ${b.ean}`);
            console.log(`- Preço no PDF: ${b.price}`);
            console.log(`- Categoria/MP: ${b.category}`);
            console.log(`- PDF de Origem: ${b.source_pdf}`);
            console.log(`- Página: ${b.page_number}`);
            console.log(`- BBox: ${JSON.stringify(b.bbox_json)}`);
        } else {
            console.log('\nEsta imagem vinculada não existe mais no catalog_images_bank (provavelmente é um resquício de rodadas anteriores).');
        }
    } else {
        console.log('\nEste produto está sem imagem vinculada no momento.');
    }
}
run();
