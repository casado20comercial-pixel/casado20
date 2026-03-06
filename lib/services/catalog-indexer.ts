import { GoogleDriveService } from './google-drive';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { processPdfBuffer } from '@/lib/pdf-processor';
import fs from 'fs';
import path from 'path';

const googleDriveService = new GoogleDriveService();

export class CatalogIndexingService {
    /**
     * Sincroniza os PDFs do Drive com o banco de dados.
     * Detecta novos arquivos ou modificados e inicia o mapeamento.
     */
    async syncAndIndex(onProgress?: (msg: string) => void) {
        if (!supabaseAdmin) throw new Error('Supabase Admin not initialized');

        onProgress?.('Iniciando verificação de catálogos no Google Drive...');
        const driveFiles = await googleDriveService.listPdfFiles();
        onProgress?.(`Encontrados ${driveFiles.length} arquivos no Drive.`);

        for (const file of driveFiles) {
            if (!file.id || !file.name) continue;

            // 1. Verificar se o catálogo já existe e se foi modificado
            const { data: existing } = await supabaseAdmin
                .from('catalogs')
                .select('*')
                .eq('drive_file_id', file.id)
                .maybeSingle();

            const lastModified = file.modifiedTime ? new Date(file.modifiedTime).toISOString() : null;

            if (existing && existing.last_modified === lastModified && existing.status === 'completed') {
                // Já processado e sem alterações
                continue;
            }

            onProgress?.(`Catálogo novo ou modificado: ${file.name}. Iniciando mapeamento...`);

            // 2. Registrar ou atualizar catálogo no banco
            const { data: catalog, error: upsertError } = await supabaseAdmin
                .from('catalogs')
                .upsert({
                    drive_file_id: file.id,
                    name: file.name,
                    last_modified: lastModified,
                    status: 'processing',
                    processed_at: new Date().toISOString()
                }, { onConflict: 'drive_file_id' })
                .select()
                .single();

            if (upsertError || !catalog) {
                console.error(`[INDEXER] Error upserting catalog ${file.name}:`, upsertError);
                continue;
            }

            // 3. Baixar e Processar o PDF
            try {
                const buffer = await googleDriveService.getFileBuffer(file.id, file.name);
                if (!buffer) throw new Error('Falha ao baixar PDF');

                // Limpar índice antigo se for atualização
                await supabaseAdmin.from('catalog_index').delete().eq('catalog_id', catalog.id);

                // Processar PDF para encontrar TODOS os códigos (passando validIds vazios ou null para scan completo)
                // Usaremos o processPdfBuffer mas com uma modificação para capturar tudo que achar
                const extracted = await processPdfBuffer(buffer, undefined, (msg) => {
                    onProgress?.(`[${file.name}] ${msg}`);
                }, undefined, true);

                // 4. Salvar resultados no catalog_index
                if (extracted.length > 0) {
                    onProgress?.(`Salvando ${extracted.length} entradas encontradas no catálogo ${file.name}...`);

                    // Preparar batch insert
                    const indexEntries = extracted.map(item => ({
                        catalog_id: catalog.id,
                        product_code: item.ean, // Pode ser EAN ou NCM
                        page_number: item.page
                    }));

                    // Inserir em lotes para não estourar limites
                    const batchSize = 100;
                    for (let i = 0; i < indexEntries.length; i += batchSize) {
                        const batch = indexEntries.slice(i, i + batchSize);
                        const { error: indexError } = await supabaseAdmin
                            .from('catalog_index')
                            .insert(batch);

                        if (indexError) throw indexError;
                    }
                }

                // 5. Marcar como concluído
                await supabaseAdmin
                    .from('catalogs')
                    .update({ status: 'completed' })
                    .eq('id', catalog.id);

                onProgress?.(`✅ Mapeamento concluído para: ${file.name}`);

            } catch (err: any) {
                console.error(`[INDEXER] Error processing ${file.name}:`, err);
                onProgress?.(`❌ Erro ao processar ${file.name}: ${err.message}`);
                await supabaseAdmin
                    .from('catalogs')
                    .update({ status: 'error' })
                    .eq('id', catalog.id);
            }
        }

        onProgress?.('🏁 Sincronização de catálogos finalizada.');
    }

    /**
     * Busca rápida no índice para um código de produto.
     */
    async findProductLocation(code: string): Promise<{ catalog_id: string, drive_file_id: string, name: string, page_number: number } | null> {
        if (!supabaseAdmin) return null;

        const { data, error } = await supabaseAdmin
            .from('catalog_index')
            .select(`
                page_number,
                catalogs (
                    id,
                    drive_file_id,
                    name
                )
            `)
            .eq('product_code', code)
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;

        const catalog = (data as any).catalogs;
        return {
            catalog_id: catalog.id,
            drive_file_id: catalog.drive_file_id,
            name: catalog.name,
            page_number: data.page_number
        };
    }
}
