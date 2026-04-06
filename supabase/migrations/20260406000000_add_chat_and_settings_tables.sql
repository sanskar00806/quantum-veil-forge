-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert own messages" ON public.messages
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = sender_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON public.messages(sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON public.messages(created_at);

-- Create user_settings table if not exists
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  encryption_level text DEFAULT 'AES-256',
  auto_save boolean DEFAULT true,
  notifications boolean DEFAULT true,
  dark_mode boolean DEFAULT true,
  language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

-- Create vault_items table if not exists
CREATE TABLE IF NOT EXISTS public.vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text,
  file_size bigint DEFAULT 0,
  encryption_method text DEFAULT 'AES-256+LSB',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for vault_items
CREATE POLICY "Users can view own vault items" ON public.vault_items
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault items" ON public.vault_items
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items" ON public.vault_items
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- Create storage bucket for vault files if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vault-files', 'vault-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for chat images if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vault-files bucket
CREATE POLICY "Authenticated users can upload vault files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vault-files')
DO NOTHING;

CREATE POLICY "Authenticated users can read vault files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vault-files')
DO NOTHING;

CREATE POLICY "Authenticated users can delete vault files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vault-files' AND auth.uid()::text = (storage.foldername(name))[1])
DO NOTHING;

-- Storage policies for chat-images bucket
CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images')
DO NOTHING;

CREATE POLICY "Anyone can read chat images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-images')
DO NOTHING;

CREATE POLICY "Users can delete their own chat images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1])
DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id 
ON public.vault_items(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
ON public.user_settings(user_id);
