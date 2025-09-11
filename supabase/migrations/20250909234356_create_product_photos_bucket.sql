-- Create storage bucket for product photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete" ON storage.objects;

-- Create RLS policies for the bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'product-photos');

CREATE POLICY "Anyone can upload" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Anyone can update" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'product-photos');

CREATE POLICY "Anyone can delete" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'product-photos');