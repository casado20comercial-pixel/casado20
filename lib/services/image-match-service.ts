import { supabaseAdmin } from '../supabaseClient';

export interface MatchResult {
    productId: string;
    productName: string;
    bankImageId: string;
    imageUrl: string;
    score: number;
    reason: string;
}

export class ImageMatchService {
    private normalizeText(text: string): string {
        return (text || '')
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[^\w\s]/gi, ' ') // Remove pontuação
            .replace(/\s+/g, ' ') // Espaços extras
            .trim();
    }

    private getTokens(text: string): string[] {
        const stopWords = new Set(['de', 'para', 'com', 'sem', 'em', 'um', 'uma', 'os', 'as', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'por', 'ao', 'aos', 'ou', 'e', 'x', 'a', 'o', 'le', 'la', 'les', 'des', 'du', 'au', 'aux']);
        const units = /^\d+(ml|l|kg|g|cm|mm|pcs|un|unid|pecas|jog|jogo|kit|conjunto)$/i;

        return this.normalizeText(text)
            .split(' ')
            .filter(w => w.length >= 2 && !stopWords.has(w) && !units.test(w));
    }

    private extractSpecs(text: string) {
        const normalized = this.normalizeText(text);

        // Melhoria no Regex para capturar volume e quantidade com mais precisão
        const volumeMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(ml|l|litro|litros)/i);
        const qtyMatch = normalized.match(/(\d+)\s*(pcs|un|unid|pecas|jog|jogo|kit|conjunto)/i);
        const dimMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm)/i);

        return {
            volume: volumeMatch ? volumeMatch[1].replace(',', '.') + (volumeMatch[2].toLowerCase().startsWith('l') ? 'l' : 'ml') : null,
            quantity: qtyMatch ? qtyMatch[1] : null,
            dimension: dimMatch ? dimMatch[1].replace(',', '.') + dimMatch[2].toLowerCase() : null,
            isKit: /kit|conjunto|jogo/i.test(normalized)
        };
    }

    /**
     * Busca o melhor match no banco de imagens para um produto específico
     */
    async findMatchForProduct(product: any, candidatesList?: any[]): Promise<MatchResult | null> {
        if (!supabaseAdmin) return null;

        // --- 1. REGRA DE OURO: MATCH POR EAN (Soberania Total) ---
        // Se bater o EAN, para tudo e vincula. Confiança 100%.
        if (!candidatesList) {
            const { data: eanMatch } = await supabaseAdmin
                .from('catalog_images_bank')
                .select('*')
                .eq('ean', product.ean)
                .not('ean', 'is', null)
                .limit(1);

            if (eanMatch?.length) {
                const best = eanMatch[0];
                return {
                    productId: product.id,
                    productName: product.name,
                    bankImageId: best.id,
                    imageUrl: best.image_url,
                    score: 500, // Score altíssimo para priorizar EAN
                    reason: `EAN Identico (${product.ean})`
                };
            }
        }

        const productSpecs = this.extractSpecs(product.name);
        let candidates = candidatesList;

        if (!candidates) {
            // Se não achou por EAN, busca candidatos por palavra-chave para análise radical
            const searchTokens = this.getTokens(product.name);
            const primaryWord = searchTokens[0] || '';

            const { data } = await supabaseAdmin
                .from('catalog_images_bank')
                .select('*')
                .ilike('name', `%${primaryWord}%`)
                .limit(200);
            candidates = data || [];
        }

        if (!candidates || candidates.length === 0) return null;

        let bestMatch: MatchResult | null = null;
        let highestScore = 0;

        const productTokens = this.getTokens(product.name);
        if (productTokens.length === 0) return null;

        for (const cand of candidates) {
            // Re-checagem de EAN se estiver na lista da memória
            if (product.ean && cand.ean && product.ean === cand.ean) {
                return {
                    productId: product.id,
                    productName: product.name,
                    bankImageId: cand.id,
                    imageUrl: cand.image_url,
                    score: 500,
                    reason: 'EAN Identico (Scan)'
                };
            }

            const candSpecs = this.extractSpecs(cand.name);

            // 🚫 TRAVA RADICAL 1: Conflito de Especificações Físicas
            if (productSpecs.volume && candSpecs.volume && productSpecs.volume !== candSpecs.volume) continue;
            if (productSpecs.quantity && candSpecs.quantity && productSpecs.quantity !== candSpecs.quantity) continue;
            if (productSpecs.dimension && candSpecs.dimension && productSpecs.dimension !== candSpecs.dimension) continue;
            if (productSpecs.isKit !== candSpecs.isKit) continue;

            // 🚫 TRAVA RADICAL 2: Divergência de Preço Severa (35%)
            // Se o preço for muito diferente, o match é cancelado, a menos que o EAN batesse.
            if (product.price && cand.price) {
                const priceDiff = Math.abs(product.price - cand.price) / product.price;
                if (priceDiff > 0.35) continue;
            }

            const candTokens = this.getTokens(cand.name);
            if (candTokens.length === 0) continue;

            // Pontuação por Tokens
            let matchedTokens = 0;
            productTokens.forEach(pt => {
                if (candTokens.includes(pt) || cand.name.toLowerCase().includes(pt)) {
                    matchedTokens++;
                }
            });

            let candMatched = 0;
            candTokens.forEach(ct => {
                if (productTokens.includes(ct) || product.name.toLowerCase().includes(ct)) {
                    candMatched++;
                }
            });

            const coverage = matchedTokens / productTokens.length;
            const candCoverage = candMatched / candTokens.length;

            let score = Math.round((coverage * 60) + (candCoverage * 40));
            let reasons = [];

            if (coverage > 0.6) reasons.push(`Tokens (${Math.round(coverage * 100)}%)`);

            // Bônus de Ref (Muito valioso)
            if (cand.ref_id && product.name.toLowerCase().includes(cand.ref_id.toLowerCase())) {
                score += 40;
                reasons.push(`Ref OK: ${cand.ref_id}`);
            }

            // Critério de Aceitação: Mínimo 70 agora para ser SUPER radical
            if (score > highestScore && score >= 70) {
                highestScore = score;
                bestMatch = {
                    productId: product.id,
                    productName: product.name,
                    bankImageId: cand.id,
                    imageUrl: cand.image_url,
                    score: score,
                    reason: reasons.join(', ')
                };
            }
        }

        return bestMatch;
    }

    /**
     * Executa a reconciliação ROBUSTA (Nuclear Mode)
     */
    async reconcileMissingImages(onProgress?: (msg: string) => void) {
        if (!supabaseAdmin) return;

        onProgress?.('🚀 Iniciando Varredura Radical (Anti-Erro)...');

        let allBankImages: any[] = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error: bankError } = await supabaseAdmin
                .from('catalog_images_bank')
                .select('*')
                .range(from, from + step - 1);

            if (bankError) {
                onProgress?.('❌ Erro ao carregar acervo.');
                return;
            }

            if (data && data.length > 0) {
                allBankImages = [...allBankImages, ...data];
                from += step;
                onProgress?.(`📚 Carregando acervo: ${allBankImages.length} imagens...`);
                if (data.length < step) hasMore = false;
            } else {
                hasMore = false;
            }
        }

        onProgress?.('🔍 Buscando produtos sem imagem...');
        const { data: products, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .is('image_url', null);

        if (error || !products) return;

        let matchesFound = 0;
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const match = await this.findMatchForProduct(product, allBankImages);

            if (match) {
                await supabaseAdmin.from('products').update({ image_url: match.imageUrl }).eq('id', product.id);
                await supabaseAdmin.from('product_images').insert({
                    sku: product.id,
                    ean: product.ean || null,
                    image_url: match.imageUrl,
                    is_primary: true,
                    source: 'manual_upload'
                });
                matchesFound++;
                onProgress?.(`✨ [VINCULADO] ${product.name} (Score: ${match.score})`);
            }
        }
        onProgress?.(`🏁 Finalizado. ${matchesFound} vínculos garantidos.`);
    }
}
