-- Add recurrence start and end dates to implementations
ALTER TABLE public.implementations
ADD COLUMN recurrence_start_date date,
ADD COLUMN recurrence_end_date date,
ADD COLUMN delivery_completed boolean NOT NULL DEFAULT false,
ADD COLUMN delivery_completed_at timestamp with time zone;

-- Create storage bucket for implementation documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('implementation-documents', 'implementation-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for implementation documents
CREATE POLICY "Users can upload their own implementation documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'implementation-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own implementation documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'implementation-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own implementation documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'implementation-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);