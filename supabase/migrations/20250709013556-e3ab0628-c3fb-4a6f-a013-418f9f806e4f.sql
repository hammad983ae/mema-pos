-- Add address fields to customers table
ALTER TABLE public.customers 
ADD COLUMN address_line_1 TEXT,
ADD COLUMN address_line_2 TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state_province TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN country TEXT DEFAULT 'United States';

-- Add document and signature storage fields
ALTER TABLE public.customers 
ADD COLUMN id_document_path TEXT,
ADD COLUMN id_document_type TEXT,
ADD COLUMN signature_path TEXT,
ADD COLUMN verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID REFERENCES auth.users(id);

-- Create storage bucket for customer documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-documents', 'customer-documents', false);

-- Create storage bucket for customer signatures  
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-signatures', 'customer-signatures', false);

-- Create storage policies for customer documents
CREATE POLICY "Business members can upload customer documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'customer-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Business members can view customer documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'customer-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Business members can update customer documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'customer-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Business members can delete customer documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'customer-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Create storage policies for customer signatures
CREATE POLICY "Business members can upload customer signatures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'customer-signatures' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Business members can view customer signatures" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'customer-signatures' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Business members can update customer signatures" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'customer-signatures' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Business members can delete customer signatures" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'customer-signatures' AND
  EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);