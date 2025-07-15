-- Create tax configuration tables
CREATE TABLE public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Sales Tax", "State Tax", "VAT"
  rate DECIMAL(5,4) NOT NULL, -- e.g., 0.0825 for 8.25%
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_compound BOOLEAN NOT NULL DEFAULT false, -- For compound tax calculations
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create tax exemptions table
CREATE TABLE public.tax_exemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  exemption_type TEXT NOT NULL, -- 'customer', 'product', 'category'
  entity_id UUID NOT NULL, -- customer_id, product_id, or category_id
  tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE CASCADE,
  exemption_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create order tax details table for reporting
CREATE TABLE public.order_tax_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tax_rate_id UUID NOT NULL REFERENCES public.tax_rates(id),
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  taxable_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  is_compound BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_exemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tax_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_rates
CREATE POLICY "Business members can view tax rates" 
ON public.tax_rates FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Office and managers can manage tax rates" 
ON public.tax_rates FOR ALL 
USING (business_id IN (
  SELECT business_id FROM user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager', 'office') 
  AND is_active = true
));

-- RLS Policies for tax_exemptions
CREATE POLICY "Business members can view tax exemptions" 
ON public.tax_exemptions FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Office and managers can manage tax exemptions" 
ON public.tax_exemptions FOR ALL 
USING (business_id IN (
  SELECT business_id FROM user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager', 'office') 
  AND is_active = true
));

-- RLS Policies for order_tax_details
CREATE POLICY "Business members can view order tax details" 
ON public.order_tax_details FOR SELECT 
USING (order_id IN (
  SELECT o.id FROM orders o 
  JOIN stores s ON s.id = o.store_id 
  WHERE s.business_id IN (
    SELECT business_id FROM user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

CREATE POLICY "System can insert order tax details" 
ON public.order_tax_details FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_tax_rates_updated_at
BEFORE UPDATE ON public.tax_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_tax_rates_business_id ON public.tax_rates(business_id);
CREATE INDEX idx_tax_rates_active ON public.tax_rates(business_id, is_active);
CREATE INDEX idx_tax_exemptions_business_id ON public.tax_exemptions(business_id);
CREATE INDEX idx_tax_exemptions_entity ON public.tax_exemptions(exemption_type, entity_id);
CREATE INDEX idx_order_tax_details_order_id ON public.order_tax_details(order_id);