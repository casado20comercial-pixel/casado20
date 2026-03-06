
import { NextRequest, NextResponse } from 'next/server';
import { ScrapingService } from '@/lib/services/scraping-service';
import { QHouseScraper } from '@/lib/services/scrapers/qhouse-scraper';
import { GarboScraper } from '@/lib/services/scrapers/garbo-scraper';

export async function POST(req: NextRequest) {
    try {
        const { url, provider } = await req.json();

        if (!url) {
            return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
        }

        const scrapingService = new ScrapingService();
        let scraper;

        if (provider === 'qhouse' || url.includes('qhouse')) {
            scraper = new QHouseScraper();
        } else if (provider === 'garbo' || url.includes('garbo')) {
            scraper = new GarboScraper();
        } else {
            return NextResponse.json({ success: false, error: 'Provider not supported yet' }, { status: 400 });
        }

        // Create a ReadableStream for SSE
        const stream = new ReadableStream({
            async start(controller) {
                const sendProgress = (msg: any) => {
                    controller.enqueue(new TextEncoder().encode(JSON.stringify(msg) + '\n'));
                };

                try {
                    sendProgress({ type: 'progress', message: `🕵️ Iniciando mineração no site ${scraper.name}...` });

                    const products = await scraper.scrapeCategory(url);

                    sendProgress({ type: 'progress', message: `💎 Encontrados ${products.length} itens. Iniciando processamento de imagens...` });

                    let successCount = 0;
                    for (const product of products) {
                        const result = await scrapingService.processScrapedProduct(product, url);
                        if (result) {
                            successCount++;
                            sendProgress({ type: 'progress', message: `✅ Minerado: ${product.name} (Ref: ${product.ref_id})` });
                        }
                    }

                    sendProgress({ type: 'complete', message: `🎉 Mineração concluída! ${successCount} novos itens adicionados ao acervo.` });
                } catch (error: any) {
                    console.error('[MiningAPI] Error:', error);
                    sendProgress({ type: 'error', message: error.message });
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
