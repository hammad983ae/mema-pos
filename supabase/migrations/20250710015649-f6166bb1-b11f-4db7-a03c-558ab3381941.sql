-- Create shipping requests table
CREATE TABLE public.shipping_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  items_description TEXT NOT NULL,
  estimated_value DECIMAL(10,2),
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('urgent', 'high', 'standard', 'low')),
  shipping_method TEXT DEFAULT 'ground' CHECK (shipping_method IN ('overnight', 'express', 'ground', 'economy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  carrier TEXT,
  shipping_cost DECIMAL(10,2),
  notes TEXT,
  special_instructions TEXT,
  receipt_urls TEXT[],
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping request items table for detailed item tracking
CREATE TABLE public.shipping_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipping_request_id UUID NOT NULL REFERENCES public.shipping_requests(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  sku TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipping documents table for file attachments
CREATE TABLE public.shipping_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipping_request_id UUID NOT NULL REFERENCES public.shipping_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt', 'invoice', 'photo', 'packaging_slip', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shipping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shipping_requests
CREATE POLICY "Business members can view shipping requests" 
ON public.shipping_requests 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true
));

CREATE POLICY "Employees can create shipping requests" 
ON public.shipping_requests 
FOR INSERT 
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM user_business_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true
  ) 
  AND employee_id = auth.uid()
);

CREATE POLICY "Office staff can update shipping requests" 
ON public.shipping_requests 
FOR UPDATE 
USING (business_id IN (
  SELECT business_id 
  FROM user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager', 'office') 
    AND is_active = true
));

CREATE POLICY "Employees can update their own requests" 
ON public.shipping_requests 
FOR UPDATE 
USING (employee_id = auth.uid());

-- RLS Policies for shipping_request_items
CREATE POLICY "Business members can view shipping items" 
ON public.shipping_request_items 
FOR SELECT 
USING (shipping_request_id IN (
  SELECT id FROM public.shipping_requests 
  WHERE business_id IN (
    SELECT business_id 
    FROM user_business_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
));

CREATE POLICY "Employees can manage items for their requests" 
ON public.shipping_request_items 
FOR ALL 
USING (shipping_request_id IN (
  SELECT id FROM public.shipping_requests 
  WHERE employee_id = auth.uid()
));

CREATE POLICY "Office staff can manage all items" 
ON public.shipping_request_items 
FOR ALL 
USING (shipping_request_id IN (
  SELECT id FROM public.shipping_requests 
  WHERE business_id IN (
    SELECT business_id 
    FROM user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager', 'office') 
      AND is_active = true
  )
));

-- RLS Policies for shipping_documents
CREATE POLICY "Business members can view shipping documents" 
ON public.shipping_documents 
FOR SELECT 
USING (shipping_request_id IN (
  SELECT id FROM public.shipping_requests 
  WHERE business_id IN (
    SELECT business_id 
    FROM user_business_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
));

CREATE POLICY "Users can upload documents" 
ON public.shipping_documents 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() 
  AND shipping_request_id IN (
    SELECT id FROM public.shipping_requests 
    WHERE business_id IN (
      SELECT business_id 
      FROM user_business_memberships 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  )
);

-- Create storage bucket for shipping documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shipping-documents', 'shipping-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shipping documents
CREATE POLICY "Business members can view shipping docs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'shipping-documents' 
  AND auth.uid() IN (
    SELECT user_id 
    FROM user_business_memberships 
    WHERE is_active = true
  )
);

CREATE POLICY "Users can upload shipping docs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'shipping-documents' 
  AND auth.uid() IS NOT NULL
);

-- Create update trigger for shipping_requests
CREATE TRIGGER update_shipping_requests_updated_at
BEFORE UPDATE ON public.shipping_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_shipping_requests_business_id ON public.shipping_requests(business_id);
CREATE INDEX idx_shipping_requests_employee_id ON public.shipping_requests(employee_id);
CREATE INDEX idx_shipping_requests_status ON public.shipping_requests(status);
CREATE INDEX idx_shipping_requests_created_at ON public.shipping_requests(created_at);
CREATE INDEX idx_shipping_request_items_shipping_request_id ON public.shipping_request_items(shipping_request_id);
CREATE INDEX idx_shipping_documents_shipping_request_id ON public.shipping_documents(shipping_request_id);