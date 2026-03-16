
-- Create transmissions table for user sharing
CREATE TABLE public.transmissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_username text NOT NULL,
  image_url text NOT NULL,
  algorithm text DEFAULT 'LSB',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.transmissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own transmissions
CREATE POLICY "Users can insert own transmissions"
  ON public.transmissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can see transmissions they sent
CREATE POLICY "Users can view sent transmissions"
  ON public.transmissions FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);

-- Users can see transmissions sent to them (by username matching profile)
CREATE POLICY "Users can view received transmissions"
  ON public.transmissions FOR SELECT TO authenticated
  USING (
    recipient_username IN (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
      UNION
      SELECT display_name FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update transmissions sent to them (mark as read)
CREATE POLICY "Users can mark received as read"
  ON public.transmissions FOR UPDATE TO authenticated
  USING (
    recipient_username IN (
      SELECT username FROM public.profiles WHERE user_id = auth.uid()
      UNION
      SELECT display_name FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Enable realtime for transmissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transmissions;

-- Create storage bucket for encoded images
INSERT INTO storage.buckets (id, name, public) VALUES ('encoded-images', 'encoded-images', false);

-- Storage policies for encoded-images bucket
CREATE POLICY "Authenticated users can upload encoded images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'encoded-images');

CREATE POLICY "Authenticated users can read encoded images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'encoded-images');
