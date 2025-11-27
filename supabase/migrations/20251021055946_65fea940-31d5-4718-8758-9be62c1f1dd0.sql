-- Create images table to store generated image metadata
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own images" 
ON public.images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" 
ON public.images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
ON public.images 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true);

-- Create storage policies
CREATE POLICY "Users can view their own generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');