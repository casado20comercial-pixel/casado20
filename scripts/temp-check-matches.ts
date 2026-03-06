
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function checkMatches() {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data, error } = await client
        .from('products')
        .select('name, image_url, ean, ref')
        .not('image_url', 'is', null)
        .limit(50);

    if (error) {
        console.error('Erro:', error.message);
        return;
    }

    console.log('JSON_START');
    console.log(JSON.stringify(data, null, 2));
    console.log('JSON_END');
}

checkMatches();
