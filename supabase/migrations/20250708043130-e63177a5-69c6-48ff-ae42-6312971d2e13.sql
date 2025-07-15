-- Add commission-related columns to user_business_memberships
ALTER TABLE public.user_business_memberships 
ADD COLUMN commission_type TEXT DEFAULT 'hourly' CHECK (commission_type IN ('hourly', 'commission', 'hybrid')),
ADD COLUMN base_commission_rate NUMERIC(5,4) DEFAULT 0.00,
ADD COLUMN current_commission_tier INTEGER DEFAULT 1;

-- Create commission tiers table for goal-based escalation
CREATE TABLE public.commission_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('opener', 'upseller', 'general')),
  tier_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(12,2) NOT NULL,
  target_period TEXT DEFAULT 'monthly' CHECK (target_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  commission_rate NUMERIC(5,4) NOT NULL,
  bonus_amount NUMERIC(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, role_type, tier_number)
);

-- Create employee goals table to track individual targets
CREATE TABLE public.employee_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  commission_tier_id UUID NOT NULL REFERENCES public.commission_tiers(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('sales_amount', 'device_sales', 'cream_sales', 'client_count')),
  target_value NUMERIC(12,2) NOT NULL,
  current_value NUMERIC(12,2) DEFAULT 0.00,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create commission payments table to track earnings
CREATE TABLE public.commission_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('base_commission', 'tier_bonus', 'goal_bonus', 'override')),
  sale_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  tier_name TEXT,
  payment_period TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product commission rates table for different product types
CREATE TABLE public.product_commission_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  product_category TEXT CHECK (product_category IN ('cream', 'device', 'service', 'accessory')),
  role_type TEXT NOT NULL CHECK (role_type IN ('opener', 'upseller', 'general')),
  commission_rate NUMERIC(5,4) NOT NULL,
  min_price_range NUMERIC(12,2),
  max_price_range NUMERIC(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Either product_id or product_category must be specified, not both
  CHECK ((product_id IS NOT NULL AND product_category IS NULL) OR (product_id IS NULL AND product_category IS NOT NULL))
);

-- Enable Row Level Security
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_commission_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_tiers
CREATE POLICY "Users can view commission tiers in their business"
ON public.commission_tiers FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Managers can manage commission tiers"
ON public.commission_tiers FOR ALL
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

-- RLS Policies for employee_goals
CREATE POLICY "Users can view their own goals"
ON public.employee_goals FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team goals"
ON public.employee_goals FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

CREATE POLICY "Managers can manage employee goals"
ON public.employee_goals FOR ALL
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

-- RLS Policies for commission_payments
CREATE POLICY "Users can view their own commission payments"
ON public.commission_payments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team commission payments"
ON public.commission_payments FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

CREATE POLICY "Managers can manage commission payments"
ON public.commission_payments FOR ALL
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

-- RLS Policies for product_commission_rates
CREATE POLICY "Users can view commission rates in their business"
ON public.product_commission_rates FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Managers can manage commission rates"
ON public.product_commission_rates FOR ALL
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

-- Create indexes for performance
CREATE INDEX idx_commission_tiers_business_role ON public.commission_tiers(business_id, role_type);
CREATE INDEX idx_employee_goals_user_id ON public.employee_goals(user_id);
CREATE INDEX idx_employee_goals_business_id ON public.employee_goals(business_id);
CREATE INDEX idx_commission_payments_user_id ON public.commission_payments(user_id);
CREATE INDEX idx_commission_payments_period ON public.commission_payments(payment_period);
CREATE INDEX idx_product_commission_rates_business_role ON public.product_commission_rates(business_id, role_type);

-- Create triggers for updated_at
CREATE TRIGGER update_commission_tiers_updated_at
BEFORE UPDATE ON public.commission_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_goals_updated_at
BEFORE UPDATE ON public.employee_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_commission_rates_updated_at
BEFORE UPDATE ON public.product_commission_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default commission tiers for different roles
INSERT INTO public.commission_tiers (business_id, role_type, tier_number, name, description, target_amount, commission_rate, bonus_amount)
SELECT 
  b.id,
  'opener',
  1,
  'Starter Opener',
  'Base commission for cream sales up to $5,000/month',
  5000.00,
  0.15,
  0.00
FROM public.businesses b;

INSERT INTO public.commission_tiers (business_id, role_type, tier_number, name, description, target_amount, commission_rate, bonus_amount)
SELECT 
  b.id,
  'opener',
  2,
  'Advanced Opener',
  'Higher commission for cream sales $5,000-$15,000/month',
  15000.00,
  0.20,
  500.00
FROM public.businesses b;

INSERT INTO public.commission_tiers (business_id, role_type, tier_number, name, description, target_amount, commission_rate, bonus_amount)
SELECT 
  b.id,
  'opener',
  3,
  'Elite Opener',
  'Premium commission for cream sales over $15,000/month',
  50000.00,
  0.25,
  2000.00
FROM public.businesses b;

INSERT INTO public.commission_tiers (business_id, role_type, tier_number, name, description, target_amount, commission_rate, bonus_amount)
SELECT 
  b.id,
  'upseller',
  1,
  'Starter Upseller',
  'Base commission for device sales up to $25,000/month',
  25000.00,
  0.10,
  0.00
FROM public.businesses b;

INSERT INTO public.commission_tiers (business_id, role_type, tier_number, name, description, target_amount, commission_rate, bonus_amount)
SELECT 
  b.id,
  'upseller',
  2,
  'Advanced Upseller',
  'Higher commission for device sales $25,000-$75,000/month',
  75000.00,
  0.15,
  1000.00
FROM public.businesses b;

INSERT INTO public.commission_tiers (business_id, role_type, tier_number, name, description, target_amount, commission_rate, bonus_amount)
SELECT 
  b.id,
  'upseller',
  3,
  'Elite Upseller',
  'Premium commission for device sales over $75,000/month',
  200000.00,
  0.20,
  5000.00
FROM public.businesses b;

-- Insert default product commission rates
INSERT INTO public.product_commission_rates (business_id, product_category, role_type, commission_rate, min_price_range, max_price_range)
SELECT 
  b.id,
  'cream',
  'opener',
  0.15,
  100.00,
  500.00
FROM public.businesses b;

INSERT INTO public.product_commission_rates (business_id, product_category, role_type, commission_rate, min_price_range, max_price_range)
SELECT 
  b.id,
  'device',
  'upseller',
  0.12,
  1500.00,
  150000.00
FROM public.businesses b;

-- Enable realtime for commission tables
ALTER TABLE public.commission_tiers REPLICA IDENTITY FULL;
ALTER TABLE public.employee_goals REPLICA IDENTITY FULL;
ALTER TABLE public.commission_payments REPLICA IDENTITY FULL;
ALTER TABLE public.product_commission_rates REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_tiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_commission_rates;