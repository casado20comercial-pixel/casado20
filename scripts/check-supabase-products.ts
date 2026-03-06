const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { supabaseAdmin } = require('../lib/supabaseClient');

async function checkProducts() {
    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin not initialized');
        return;
    }

    try {
        const { count, error } = await supabaseAdmin
            .from('products')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        console.log(`📊 Total de produtos no Supabase: ${count}`);

        if (count && count > 0) {
            const { data: sample } = await supabaseAdmin
                .from('products')
                .select('*')
                .limit(1);
            console.log('Sample product:', JSON.stringify(sample, null, 2));
        }
    } catch (err) {
        console.error('Erro ao verificar produtos:', err);
    }
}

checkProducts();
