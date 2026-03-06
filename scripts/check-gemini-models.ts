
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkKeyPermissions() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ Erro: GOOGLE_GENERATIVE_AI_API_KEY não encontrada no .env.local');
        return;
    }

    console.log(`🔍 Consultando permissões da chave: ${apiKey.substring(0, 10)}...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const models = response.data.models;

        console.log('\n✅ Chave válida! Modelos que você pode usar:');

        const formattedModels = models.map((m: any) => ({
            ID: m.name.replace('models/', ''),
            Nome: m.displayName,
            Métodos: m.supportedGenerationMethods.join(', ')
        }));

        console.table(formattedModels);

    } catch (error: any) {
        console.error('\n❌ Erro na consulta de API:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Motivo:', error.response.data.error?.message || error.response.statusText);
            console.error('Código do Erro:', error.response.data.error?.status);
        } else {
            console.error('Mensagem:', error.message);
        }
    }
}

checkKeyPermissions();
