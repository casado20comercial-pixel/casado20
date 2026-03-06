import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Configuração de ambiente
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function runTest() {
    console.log('🚀 INICIANDO TESTE DE EXTRAÇÃO DE CATÁLOGO PDF');

    // Importação dinâmica para garantir que o dotenv carregou
    const { PdfExtractionService } = await import('../lib/services/pdf-extraction-service');
    const pdfService = new PdfExtractionService();

    // PEGAR O PDF (Vou assumir que o usuário colocou no raiz ou passou por argumento)
    const pdfFileName = process.argv[2];
    if (!pdfFileName) {
        console.error('❌ Uso: npx tsx scripts/process-catalog-test.ts nome-do-arquivo.pdf');
        process.exit(1);
    }

    const pdfPath = path.join(process.cwd(), pdfFileName);
    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ Arquivo não encontrado: ${pdfPath}`);
        process.exit(1);
    }

    try {
        // Passo 1: Converter PDF para Imagens (Limitado a 5 páginas)
        const pageImages = await pdfService.convertPdfToImages(pdfPath, 5);
        console.log(`✅ ${pageImages.length} páginas convertidas.`);

        for (const imagePath of pageImages) {
            console.log(`\n--- 📄 Processando Página: ${path.basename(imagePath)} ---`);

            // Passo 2: Gemini Extrai Dados
            const extractedProducts = await pdfService.extractProductsFromImage(imagePath);
            console.log(`🔍 Gemini encontrou ${extractedProducts.length} produtos.`);

            for (const item of extractedProducts) {
                console.log(`🔹 Analisando: "${item.product_name}" (Ref: ${item.ref_id})`);

                // Passo 3: Matching Engine "2 de 3"
                const matchResult = await pdfService.findMatchInDatabase(item);

                if (matchResult) {
                    console.log(`✅ MATCH ENCONTRADO!`);
                    console.log(`   Banco: "${matchResult.product.name}" (EAN: ${matchResult.product.ean})`);
                    console.log(`   Método: ${matchResult.method}`);

                    // Passo 4: Recorte e Salvamento
                    console.log(`   ✂️ Recortando e salvando imagem...`);
                    const publicUrl = await pdfService.processProductCrop(imagePath, matchResult.product, item.box_2d);
                    console.log(`   🔗 Imagem gerada: ${publicUrl}`);
                } else {
                    console.log(`❌ Nenhum match confiável no banco de dados.`);
                }
            }
        }

        console.log('\n✨ PROCESSO DE TESTE FINALIZADO! ✨');

    } catch (error: any) {
        console.error('💥 Erro fatal no script:', error.message);
    }
}

runTest();
