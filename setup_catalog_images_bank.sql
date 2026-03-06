-- ============================================================
-- TABELA MESTRE: BANCO DE IMAGENS EXTRAÍDAS DE CATÁLOGOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.catalog_images_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 1. IDENTIDADE DO ARQUIVO
    image_url TEXT NOT NULL,
    phash TEXT,

    -- 2. METADADOS EXTRAÍDOS
    ref_id TEXT,
    ean TEXT,
    name TEXT NOT NULL,
    price NUMERIC(10,2),
    unit TEXT,
    ncm TEXT,
    category TEXT,

    -- 3. NORMALIZAÇÃO AUTOMÁTICA (evita dor futura de matching)
    ean_normalized TEXT GENERATED ALWAYS AS (regexp_replace(coalesce(ean,''), '\D', '', 'g')) STORED,
    ncm_normalized TEXT GENERATED ALWAYS AS (regexp_replace(coalesce(ncm,''), '\D', '', 'g')) STORED,
    ref_id_normalized TEXT GENERATED ALWAYS AS (lower(trim(coalesce(ref_id,'')))) STORED,
    category_normalized TEXT GENERATED ALWAYS AS (lower(trim(coalesce(category,'')))) STORED,

    -- 4. RASTREABILIDADE
    source_pdf TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    bbox_json JSONB,
    model_version TEXT DEFAULT 'gemini-2.0-flash',

    -- 5. DIMENSÕES DA IMAGEM (debug + reprocessamento futuro)
    width INTEGER,
    height INTEGER,

    -- 6. CONFIANÇA DA EXTRAÇÃO (opcional mas estratégico)
    confidence NUMERIC(5,4),

    -- 7. AUDITORIA
    processed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    -- ========================================================
    -- CONSTRAINTS DE SANIDADE
    -- ========================================================

    CONSTRAINT chk_image_url CHECK (image_url ~ '^https://'),

    CONSTRAINT chk_bbox_format CHECK (
        bbox_json IS NULL OR (
            bbox_json ? 'ymin' AND
            bbox_json ? 'xmin' AND
            bbox_json ? 'ymax' AND
            bbox_json ? 'xmax'
        )
    )
);

-- ============================================================
-- IDEMPOTÊNCIA (impede duplicar processamento do mesmo item)
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_origin
ON public.catalog_images_bank (source_pdf, page_number, ref_id_normalized);

-- Deduplicação visual real
CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_phash
ON public.catalog_images_bank (phash)
WHERE phash IS NOT NULL;

-- ============================================================
-- ÍNDICES DE BUSCA OPERACIONAL (ERP / MATCH / API)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_catalog_ean_norm
ON public.catalog_images_bank (ean_normalized);

CREATE INDEX IF NOT EXISTS idx_catalog_ncm_norm
ON public.catalog_images_bank (ncm_normalized);

CREATE INDEX IF NOT EXISTS idx_catalog_ref_norm
ON public.catalog_images_bank (ref_id_normalized);

CREATE INDEX IF NOT EXISTS idx_catalog_category_norm
ON public.catalog_images_bank (category_normalized);

-- Busca típica: produto dentro de um catálogo específico
CREATE INDEX IF NOT EXISTS idx_catalog_lookup
ON public.catalog_images_bank (source_pdf, ean_normalized, ref_id_normalized);

-- ============================================================
-- PERFORMANCE EM ESCALA
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_catalog_processed_at
ON public.catalog_images_bank (processed_at DESC);

-- ============================================================
-- REALTIME (caso queira acompanhar ingestão ao vivo)
-- ============================================================

-- Nota: Certifique-se de que a publicação 'supabase_realtime' já existe
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_images_bank;
