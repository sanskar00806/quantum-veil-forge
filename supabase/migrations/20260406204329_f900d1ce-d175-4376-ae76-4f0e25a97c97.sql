
-- Change room_id from uuid to text
ALTER TABLE public.messages ALTER COLUMN room_id TYPE text USING room_id::text;

-- Create storage policies for chat-images bucket
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-images');
