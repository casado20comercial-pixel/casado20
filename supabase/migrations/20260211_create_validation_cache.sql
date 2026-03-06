-- =========================================================
-- IMAGE VALIDATION CACHE
-- Evita chamadas redundantes ao Gemini para a mesma imagem
-- =========================================================

create table if not exists image_validation_cache (
  id uuid default gen_random_uuid() primary key,
  
  url_hash text not null unique, -- Hash MD5 ou similar da URL da imagem
  image_url text not null,       -- URL original (para debug)
  
  is_valid boolean not null,
  confidence numeric(3,2) not null,
  reason text,
  
  last_validated_at timestamp with time zone 
    default timezone('utc'::text, now()) not null
);

-- Index para busca rápida por hash
create index if not exists idx_validation_url_hash on image_validation_cache (url_hash);

-- RLS
alter table image_validation_cache enable row level security;

create policy "Service manage validation cache"
on image_validation_cache
for all
using ( auth.role() = 'service_role' );
