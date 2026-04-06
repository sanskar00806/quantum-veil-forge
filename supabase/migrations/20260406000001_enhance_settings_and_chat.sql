-- Enhance user_settings table with new columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS two_factor_auth BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS session_timeout INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_file_size INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS compress_images BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS backup_frequency TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'cyan',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium';

-- Ensure chat-images storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for chat-images if not exists
DO $$
BEGIN
    -- Enable RLS on storage.objects for chat-images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can upload chat images'
    ) THEN
        CREATE POLICY "Users can upload chat images"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can view their chat images'
    ) THEN
        CREATE POLICY "Users can view their chat images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'chat-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Users can delete their chat images'
    ) THEN
        CREATE POLICY "Users can delete their chat images"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- Create index on messages for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON messages(sender_id, receiver_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

-- Update profiles table to ensure it has necessary columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

COMMENT ON TABLE messages IS 'Stores encrypted chat messages between users';
COMMENT ON TABLE user_settings IS 'User preferences and configuration settings';
COMMENT ON TABLE profiles IS 'User profile information';
