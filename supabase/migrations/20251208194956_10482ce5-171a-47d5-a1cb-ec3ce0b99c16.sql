-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false);

-- Allow authenticated and anonymous users to upload files
CREATE POLICY "Anyone can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow anyone to read their uploaded files
CREATE POLICY "Anyone can read attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');