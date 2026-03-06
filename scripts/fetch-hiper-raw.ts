import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis do .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const HIPER_API_URL = process.env.HIPER_API_URL || 'http://ms-ecommerce.hiper.com.br';
const HIPER_APP_TOKEN = process.env.HIPER_APP_TOKEN;

async function fetchRawHiperProducts() {
    console.log('🚀 Iniciando consulta direta na API do Hiper...');

    if (!HIPER_APP_TOKEN) {
        console.error('❌ Erro: HIPER_APP_TOKEN não encontrado no .env.local');
        return;
    }

    try {
        // 1. Gerar o Bearer Token
        console.log('🔐 Gerando token de acesso...');
        const authResponse = await axios.get(`${HIPER_API_URL}/api/v1/auth/gerar-token/${HIPER_APP_TOKEN}`);
        const token = authResponse.data.token;

        if (!token) {
            console.error('❌ Não foi possível obter o token da Hiper');
            console.log('Resposta da Auth:', authResponse.data);
            return;
        }

        console.log('✅ Token obtido com sucesso!');

        // 2. Buscar os primeiros produtos
        console.log('📦 Buscando primeiros produtos...');
        const productsResponse = await axios.get(`${HIPER_API_URL}/api/v1/produtos/pontoDeSincronizacao`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                pontoDeSincronizacao: 0
            }
        });

        const allItems = productsResponse.data;
        // Dependendo da versão da API, o retorno pode ser um array direto ou um objeto com a chave produtos
        const products = Array.isArray(allItems) ? allItems : (allItems.produtos || allItems.products || []);

        console.log('\n--- 📄 RAW DATA (PRIMEIROS 3 PRODUTOS DA HIPER) ---');
        console.log(JSON.stringify(products.slice(0, 3), null, 2));
        console.log('--------------------------------------------------\n');

    } catch (error: any) {
        console.error('💥 Erro ao consultar API do Hiper:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Mensagem:', error.message);
        }
    }
}

fetchRawHiperProducts();
