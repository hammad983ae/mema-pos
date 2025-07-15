-- Create document categories table
CREATE TABLE public.document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  parent_category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_current_version BOOLEAN DEFAULT true,
  parent_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  access_level TEXT NOT NULL DEFAULT 'business' CHECK (access_level IN ('public', 'business', 'managers_only', 'private')),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document access permissions table
CREATE TABLE public.document_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role TEXT CHECK (user_role IN ('business_owner', 'manager', 'employee', 'office')),
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit', 'delete', 'share')),
  granted_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document views/downloads tracking
CREATE TABLE public.document_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('view', 'download', 'edit', 'share')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('business-documents', 'business-documents', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]);

-- Create indexes for better performance
CREATE INDEX idx_documents_business_id ON public.documents(business_id);
CREATE INDEX idx_documents_category_id ON public.documents(category_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX idx_documents_access_level ON public.documents(access_level);
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX idx_document_categories_business_id ON public.document_categories(business_id);
CREATE INDEX idx_document_categories_parent ON public.document_categories(parent_category_id);
CREATE INDEX idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX idx_document_permissions_user_id ON public.document_permissions(user_id);
CREATE INDEX idx_document_activity_document_id ON public.document_activity(document_id);

-- Add RLS policies for document categories
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories in their business"
ON public.document_categories FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage categories"
ON public.document_categories FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager', 'office')
  AND is_active = true
));

-- Add RLS policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible documents"
ON public.documents FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND (
    access_level = 'public'
    OR access_level = 'business'
    OR (access_level = 'managers_only' AND EXISTS (
      SELECT 1 FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
      AND business_id = documents.business_id
      AND role IN ('business_owner', 'manager', 'office')
      AND is_active = true
    ))
    OR (access_level = 'private' AND uploaded_by = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.document_permissions dp
      WHERE dp.document_id = documents.id 
      AND dp.user_id = auth.uid()
      AND dp.permission_type = 'view'
      AND (dp.expires_at IS NULL OR dp.expires_at > now())
    )
  )
);

CREATE POLICY "Users can upload documents"
ON public.documents FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Users can update their own documents or with permission"
ON public.documents FOR UPDATE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.document_permissions dp
    WHERE dp.document_id = documents.id 
    AND dp.user_id = auth.uid()
    AND dp.permission_type = 'edit'
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND business_id = documents.business_id
    AND role IN ('business_owner', 'manager')
    AND is_active = true
  )
);

CREATE POLICY "Users can delete their own documents or managers can delete"
ON public.documents FOR DELETE
USING (
  uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.document_permissions dp
    WHERE dp.document_id = documents.id 
    AND dp.user_id = auth.uid()
    AND dp.permission_type = 'delete'
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
  OR EXISTS (
    SELECT 1 FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND business_id = documents.business_id
    AND role IN ('business_owner', 'manager')
    AND is_active = true
  )
);

-- Add RLS policies for document permissions
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view permissions for accessible documents"
ON public.document_permissions FOR SELECT
USING (
  document_id IN (
    SELECT id FROM public.documents 
    WHERE business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Managers can manage document permissions"
ON public.document_permissions FOR ALL
USING (
  document_id IN (
    SELECT id FROM public.documents d
    WHERE d.business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager')
      AND is_active = true
    )
  )
);

-- Add RLS policies for document activity
ALTER TABLE public.document_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can track their own document activity"
ON public.document_activity FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can view document activity"
ON public.document_activity FOR SELECT
USING (
  document_id IN (
    SELECT id FROM public.documents d
    WHERE d.business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager', 'office')
      AND is_active = true
    )
  )
);

-- Create storage policies for business documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT business_id::text FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can view documents they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'business-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT business_id::text FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can update their uploaded documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT business_id::text FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can delete their uploaded documents or managers can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT business_id::text FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND (
      role IN ('business_owner', 'manager')
      OR owner = auth.uid()
    )
    AND is_active = true
  )
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_document_categories_updated_at
  BEFORE UPDATE ON public.document_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();