
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGeminiUsage() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ Erro: GOOGLE_GENERATIVE_AI_API_KEY não encontrada no .env.local');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log(`🚀 Testando a chave: ${apiKey.substring(0, 10)}... com o modelo Gemini 1.5 Flash`);

    try {
        const prompt = "Diga apenas 'Conexão OK' se você estiver funcionando corretamente.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`\n✅ Resposta da IA: ${text}`);
        console.log('\n---------------------------------------------------------');
        console.log('💡 STATUS DA CHAVE:');
        console.log('A chave está ATIVA e respondendo corretamente.');
        console.log('Para saber sobre o faturamento (Billing):');
        console.log('1. Se o Google AI Studio mostrar "Plan: Free of charge", você está no gratuito.');
        console.log('2. O limite do plano gratuito do Gemini 1.5 Flash é de 15 requisições por minuto (RPM) e 1 milhão de tokens por minuto (TPM).');
        console.log('3. Se você não configurou um cartão no Google Cloud Console, você ESTÁ no plano gratuito por padrão.');
        console.log('---------------------------------------------------------');

    } catch (error: any) {
        console.error('\n❌ Erro ao tentar gerar conteúdo:');
        if (error.message?.includes('429')) {
            console.error('⚠️ Limite de cota atingido (Quota Exceeded). Isso acontece no plano grátis se você fizer muitas chamadas rápidas.');
        } else if (error.message?.includes('403')) {
            console.error('🚫 Permissão Negada. Verifique se o faturamente está ativado ou se o modelo está liberado para sua região.');
        } else if (error.message?.includes('API_KEY_INVALID')) {
            console.error('🔑 Chave API Inválida.');
        } else {
            console.error('Detalhes:', error.message);
        }
    }
}

testGeminiUsage();
