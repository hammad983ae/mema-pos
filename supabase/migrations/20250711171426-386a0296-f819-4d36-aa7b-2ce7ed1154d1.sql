-- Re-enable RLS and create proper policies for commission_payments
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

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

-- Re-enable RLS and create proper policies for employee_goals
ALTER TABLE public.employee_goals ENABLE ROW LEVEL SECURITY;

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

-- Re-enable RLS and create proper policies for employee_schedules
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules" 
ON public.employee_schedules 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage employee schedules" 
ON public.employee_schedules 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

-- Re-enable RLS and create proper policies for team_compatibility
ALTER TABLE public.team_compatibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can manage team compatibility" 
ON public.team_compatibility 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);