
import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper, ScrapedProduct } from '../scraping-service';

export class QHouseScraper implements IScraper {
    name = 'QHouse';
    baseUrl = 'https://www.qhouseloja.com.br';

    async scrapeCategory(url: string): Promise<ScrapedProduct[]> {
        const products: ScrapedProduct[] = [];
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(response.data);

            const productLinks: string[] = [];
            $('.listagem .listagem-item .nome-produto').each((i, el) => {
                const href = $(el).attr('href');
                if (href) {
                    productLinks.push(href.startsWith('http') ? href : this.baseUrl + href);
                }
            });

            console.log(`[QHouse] Encontrados ${productLinks.length} produtos na categoria.`);

            // Para cada link, extrair detalhes (Limite de 20 por vez para segurança)
            for (const link of productLinks.slice(0, 50)) {
                try {
                    const detail = await this.scrapeProductDetail(link);
                    if (detail) products.push(detail);
                    // Pequeno delay para evitar bloqueio
                    await new Promise(r => setTimeout(r, 500));
                } catch (err) {
                    console.error(`[QHouse] Erro ao minerar detalhes de ${link}`);
                }
            }

        } catch (error: any) {
            console.error(`[QHouse] Erro ao carregar categoria ${url}:`, error.message);
        }
        return products;
    }

    async scrapeProductDetail(url: string): Promise<ScrapedProduct | null> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            const $ = cheerio.load(response.data);

            const name = $('h1').first().text().trim() || $('.nome-produto').first().text().trim();
            const sku = $('span[itemprop="sku"]').first().text().trim();
            const ean = $('span[itemprop="gtin13"]').first().text().trim();
            const imageUrl = $('meta[property="og:image"]').attr('content');

            // Tentativa de pegar o preço no texto se o meta falhar
            const priceText = $('.preco-venda').first().text().trim();
            const priceMatch = priceText.match(/R\$\s*([0-9.,]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : 0;

            if (!name || !imageUrl) return null;

            return {
                name,
                ref_id: sku,
                ean: ean || undefined,
                price: price || 0,
                image_url: imageUrl,
                category: 'Acessórios Mobília', // Pode ser dinâmico depois
                unit: 'UN'
            };
        } catch (error) {
            return null;
        }
    }
}
