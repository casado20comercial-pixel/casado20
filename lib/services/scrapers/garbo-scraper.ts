
import axios from 'axios';
import * as cheerio from 'cheerio';
import { IScraper, ScrapedProduct } from '../scraping-service';

export class GarboScraper implements IScraper {
    name = 'Garbo';
    baseUrl = 'https://www.garbo.com.br';

    async scrapeCategory(url: string): Promise<ScrapedProduct[]> {
        const products: ScrapedProduct[] = [];
        try {
            console.log(`[Garbo] Carregando categoria: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(response.data);

            const productLinks: string[] = [];
            // Seletor para produtos no grid da Garbo (Nuvemshop)
            $('.item-link').each((i, el) => {
                const href = $(el).attr('href');
                if (href) {
                    productLinks.push(href.startsWith('http') ? href : this.baseUrl + href);
                }
            });

            // Fallback se o seletor acima falhar
            if (productLinks.length === 0) {
                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && href.includes('/produtos/')) {
                        const fullUrl = href.startsWith('http') ? href : this.baseUrl + href;
                        if (!productLinks.includes(fullUrl)) {
                            productLinks.push(fullUrl);
                        }
                    }
                });
            }

            // Remover duplicatas
            const uniqueLinks = [...new Set(productLinks)];
            console.log(`[Garbo] Encontrados ${uniqueLinks.length} produtos potenciais.`);

            // Processar detalhes
            for (const link of uniqueLinks.slice(0, 50)) {
                try {
                    const detail = await this.scrapeProductDetail(link);
                    if (detail) products.push(detail);
                    await new Promise(r => setTimeout(r, 600)); // Delay amigável
                } catch (err) {
                    console.error(`[Garbo] Erro em ${link}`);
                }
            }

        } catch (error: any) {
            console.error(`[Garbo] Erro na categoria ${url}:`, error.message);
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

            // Tentar extrair de LD+JSON (Mais preciso na Nuvemshop)
            let ldData: any = null;
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html() || '{}');
                    if (json['@type'] === 'Product') {
                        ldData = json;
                    }
                } catch (e) { }
            });

            const name = ldData?.name || $('h1').first().text().trim();
            const sku = ldData?.sku || $('span[itemprop="sku"]').first().text().trim();
            const imageUrl = ldData?.image || $('meta[property="og:image"]').attr('content');

            // Preço
            let price = 0;
            if (ldData?.offers?.price) {
                price = parseFloat(ldData.offers.price);
            } else {
                const priceText = $('.js-price-display').first().text().trim();
                const priceMatch = priceText.match(/R\$\s*([0-9.,]+)/);
                price = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : 0;
            }

            if (!name || !imageUrl) return null;

            return {
                name,
                ref_id: sku || '',
                price: price || 0,
                image_url: imageUrl,
                category: 'Vestuário',
                unit: 'UN'
            };
        } catch (error) {
            return null;
        }
    }
}
