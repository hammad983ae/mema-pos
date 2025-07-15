-- Create discount types enum
CREATE TYPE public.discount_type AS ENUM ('percentage', 'fixed_amount');

-- Create discount status enum  
CREATE TYPE public.discount_status AS ENUM ('active', 'inactive', 'expired');

-- Create discounts table
CREATE TABLE public.discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  minimum_purchase_amount NUMERIC DEFAULT 0,
  maximum_discount_amount NUMERIC,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  requires_manager_override BOOLEAN DEFAULT false,
  is_stackable BOOLEAN DEFAULT false,
  status discount_status DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon codes table
CREATE TABLE public.coupon_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  discount_id UUID NOT NULL,
  code TEXT NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_single_use BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty discounts table
CREATE TABLE public.loyalty_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  points_required INTEGER NOT NULL,
  discount_id UUID NOT NULL,
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_date TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discount applications table (track which discounts were applied to which orders)
CREATE TABLE public.discount_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  discount_id UUID,
  coupon_code_id UUID,
  discount_amount NUMERIC NOT NULL,
  applied_by UUID NOT NULL,
  manager_override BOOLEAN DEFAULT false,
  manager_override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discounts
CREATE POLICY "Business members can view discounts"
ON public.discounts
FOR SELECT
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Managers can manage discounts"
ON public.discounts
FOR ALL
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

-- Create RLS policies for coupon codes
CREATE POLICY "Business members can view coupon codes"
ON public.coupon_codes
FOR SELECT
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Managers can manage coupon codes"
ON public.coupon_codes
FOR ALL
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

-- Create RLS policies for loyalty discounts
CREATE POLICY "Business members can view loyalty discounts"
ON public.loyalty_discounts
FOR SELECT
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Business members can use loyalty discounts"
ON public.loyalty_discounts
FOR UPDATE
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Create RLS policies for discount applications
CREATE POLICY "Business members can view discount applications"
ON public.discount_applications
FOR SELECT
USING (
  order_id IN (
    SELECT o.id 
    FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE s.business_id IN (
      SELECT business_id 
      FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

CREATE POLICY "Business members can create discount applications"
ON public.discount_applications
FOR INSERT
WITH CHECK (
  applied_by = auth.uid()
);

-- Add foreign key constraints
ALTER TABLE public.discounts
ADD CONSTRAINT fk_discounts_business
FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.coupon_codes
ADD CONSTRAINT fk_coupon_codes_business
FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.coupon_codes
ADD CONSTRAINT fk_coupon_codes_discount
FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_discounts
ADD CONSTRAINT fk_loyalty_discounts_business
FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_discounts
ADD CONSTRAINT fk_loyalty_discounts_customer
FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_discounts
ADD CONSTRAINT fk_loyalty_discounts_discount
FOREIGN KEY (discount_id) REFERENCES public.discounts(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_discounts_business_id ON public.discounts(business_id);
CREATE INDEX idx_discounts_status ON public.discounts(status);
CREATE INDEX idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX idx_coupon_codes_business_id ON public.coupon_codes(business_id);
CREATE INDEX idx_loyalty_discounts_customer_id ON public.loyalty_discounts(customer_id);
CREATE INDEX idx_discount_applications_order_id ON public.discount_applications(order_id);

-- Add unique constraint for coupon codes
ALTER TABLE public.coupon_codes
ADD CONSTRAINT unique_coupon_code_per_business UNIQUE (business_id, code);

-- Create triggers for updated_at columns
CREATE TRIGGER update_discounts_updated_at
BEFORE UPDATE ON public.discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupon_codes_updated_at
BEFORE UPDATE ON public.coupon_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();