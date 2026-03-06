-- =========================================================
-- PRODUCT IMAGES (ENRICHMENT VIA SEARCH APIS)
-- =========================================================

create table if not exists product_images (
  id uuid default gen_random_uuid() primary key,

  sku text not null,            -- SKU / ID do Hiper
  ean text,                     -- Código de barras (opcional)

  image_url text not null,      -- URL final salva no Storage
  source text not null check (
    source in ('google_custom_search', 'duckduckgo', 'manual', 'fallback')
  ),

  confidence numeric(3,2) default 0
    check (confidence >= 0 and confidence <= 1),

  is_primary boolean default false,

  created_at timestamp with time zone
    default timezone('utc'::text, now()) not null
);

-- Evita duplicar a mesma imagem para o mesmo produto
create unique index if not exists uniq_product_image
on product_images (sku, image_url);

-- Garante apenas UMA imagem principal por produto
create unique index if not exists uniq_primary_image_per_sku
on product_images (sku)
where is_primary = true;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table product_images enable row level security;

-- Frontend pode apenas LER imagens
create policy "Public read product images"
on product_images
for select
using ( true );

-- Apenas backend (service_role) pode escrever
create policy "Service insert product images"
on product_images
for insert
with check ( auth.role() = 'service_role' );

create policy "Service update product images"
on product_images
for update
using ( auth.role() = 'service_role' );

-- =========================================================
-- API USAGE / RATE LIMIT CONTROL
-- =========================================================

create table if not exists api_usage_logs (
  id uuid default gen_random_uuid() primary key,

  service_name text not null check (
    service_name in ('google_custom_search', 'duckduckgo')
  ),

  usage_date date default CURRENT_DATE not null,
  request_count integer default 0 check (request_count >= 0),

  created_at timestamp with time zone
    default timezone('utc'::text, now()) not null,

  unique(service_name, usage_date)
);

alter table api_usage_logs enable row level security;

-- Somente backend controla custo e contagem
create policy "Service manage api usage logs"
on api_usage_logs
for all
using ( auth.role() = 'service_role' );
