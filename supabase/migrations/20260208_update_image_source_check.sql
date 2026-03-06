-- Allow 'brave_search' in the product_images source check constraint
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_source_check;

ALTER TABLE product_images 
ADD CONSTRAINT product_images_source_check 
CHECK (source IN ('google_custom_search', 'brave_search', 'manual_upload'));

-- Also add 'gemini_validation' to api_usage_logs service_name check if exists, or just ensure no check fails there
-- (api_usage_logs usually doesn't have a check constraint on service_name in previous setup, but good to be safe)
