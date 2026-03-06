-- Tabela de Espelhamento de Catálogo (Cache de Performance)
-- Tentamos criar, se não existir
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY,
    ean TEXT UNIQUE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    category TEXT DEFAULT 'Geral',
    brand TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que colunas específicas existam (caso a tabela já existisse antes sem elas)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.products ADD COLUMN category TEXT DEFAULT 'Geral';
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column category already exists, skipping';
    END;
    
    BEGIN
        ALTER TABLE public.products ADD COLUMN brand TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column brand already exists, skipping';
    END;
END $$;

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política de leitura
DROP POLICY IF EXISTS "Allow public read-only access" ON public.products;
CREATE POLICY "Allow public read-only access" ON public.products FOR SELECT USING (true);

-- Index para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_products_ean ON public.products(ean);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
