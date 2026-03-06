-- Adicionar restrição de unicidade para o SKU na tabela de imagens
-- Isso permite o UPSERT (atualização) por SKU, garantindo que cada produto tenha uma imagem de referência principal clara.

-- Primeiro removemos o índice parcial que pode conflitar
DROP INDEX IF EXISTS uniq_primary_image_per_sku;

-- Criamos um índice único real no SKU
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS product_images_sku_key;
ALTER TABLE public.product_images ADD CONSTRAINT product_images_sku_key UNIQUE (sku);

-- Garantimos que a política de INSERT/UPDATE permita o UPSERT
DROP POLICY IF EXISTS "Service insert product images" ON public.product_images;
CREATE POLICY "Service insert product images"
ON public.product_images
FOR INSERT
WITH CHECK (true); -- Permitindo via service_role/admin no backend

DROP POLICY IF EXISTS "Service update product images" ON public.product_images;
CREATE POLICY "Service update product images"
ON public.product_images
FOR UPDATE
USING (true);
