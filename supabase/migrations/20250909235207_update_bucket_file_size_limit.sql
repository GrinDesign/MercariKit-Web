-- Update bucket file size limit to allow large uploads (before client-side resize)
-- Original files can be up to 15MB, but will be resized to ~200KB on client
UPDATE storage.buckets 
SET 
  file_size_limit = 15728640, -- 15MB (to accommodate large original files)
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
WHERE id = 'product-photos';