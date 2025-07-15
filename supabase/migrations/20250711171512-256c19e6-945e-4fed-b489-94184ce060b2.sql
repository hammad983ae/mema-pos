-- Clean up existing policies and re-enable RLS for all remaining tables

-- Commission payments
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own commission payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Business owners can manage commission payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Managers can manage commission payments safely" ON public.commission_payments;

CREATE POLICY "Users can view their own commission payments" 
ON public.commission_payments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage commission payments" 
ON public.commission_payments 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

-- Employee goals  
ALTER TABLE public.employee_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.employee_goals;
DROP POLICY IF EXISTS "Business owners can manage employee goals" ON public.employee_goals;
DROP POLICY IF EXISTS "Managers can manage employee goals safely" ON public.employee_goals;

CREATE POLICY "Users can view their own goals" 
ON public.employee_goals 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage employee goals" 
ON public.employee_goals 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);