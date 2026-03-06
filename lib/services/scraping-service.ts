
import axios from 'axios';
import sharp from 'sharp';
import { supabaseAdmin } from '../supabaseClient';

export interface ScrapedProduct {
    name: string;
    ref_id: string;
    ean?: string;
    price?: number;
    image_url: string;
    category?: string;
    unit?: string;
}

export interface IScraper {
    name: string;
    baseUrl: string;
    scrapeCategory(url: string): Promise<ScrapedProduct[]>;
}

export class ScrapingService {
    /**
     * Calcula o pHash para deduplicação visual
     */
    async calculatePHash(buffer: Buffer): Promise<string> {
        try {
            const { data } = await sharp(buffer)
                .grayscale()
                .resize(9, 8, { fit: 'fill' })
                .raw()
                .toBuffer({ resolveWithObject: true });

            let hash = "";
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const left = data[row * 9 + col];
                    const right = data[row * 9 + col + 1];
                    hash += left < right ? "1" : "0";
                }
            }
            return BigInt("0b" + hash).toString(16).padStart(16, '0');
        } catch (e) {
            return "0000000000000000";
        }
    }

    /**
     * Baixa a imagem, otimiza e salva no Storage + Banco Mestre
     */
    async processScrapedProduct(product: ScrapedProduct, sourceUrl: string) {
        if (!supabaseAdmin) return null;

        try {
            // 1. Download
            const response = await axios.get(product.image_url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');

            // 2. Otimizar
            const processedBuffer = await sharp(buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer();

            const phash = await this.calculatePHash(processedBuffer);

            // 3. Nome do Arquivo
            const safeRef = (product.ref_id || 'unkn').replace(/[^a-z0-9]/gi, '_');
            const fileName = `scrape_${safeRef}_${Date.now()}.webp`;

            // 4. Upload Storage
            const { error: uploadError } = await supabaseAdmin.storage
                .from('products')
                .upload(fileName, processedBuffer, { contentType: 'image/webp', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);

            // 5. Salvar na Tabela Mestre
            const { error: dbError } = await supabaseAdmin.from('catalog_images_bank').insert({
                image_url: publicUrl,
                phash,
                ref_id: product.ref_id,
                ean: product.ean || null,
                name: product.name,
                price: product.price || 0,
                unit: product.unit || 'UN',
                category: product.category || 'Scraped',
                source_pdf: `Scrape: ${sourceUrl}`,
                page_number: 0,
                bbox_json: { ymin: 0, xmin: 0, ymax: 1000, xmax: 1000 },
                width: 800,
                height: 800,
                model_version: 'scraper-v1'
            });

            if (dbError && dbError.code !== '23505') {
                throw dbError;
            }

            return publicUrl;
        } catch (err: any) {
            console.error(`[Scraper] Erro ao processar ${product.name}:`, err.message);
            return null;
        }
    }
}
