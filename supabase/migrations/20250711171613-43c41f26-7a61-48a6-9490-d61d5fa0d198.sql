-- Continue with the remaining tables

-- Employee schedules
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Business owners can manage employee schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Managers can manage team schedules safely" ON public.employee_schedules;

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

-- Team compatibility
ALTER TABLE public.team_compatibility ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage team compatibility" ON public.team_compatibility;
DROP POLICY IF EXISTS "Managers can manage team compatibility" ON public.team_compatibility;
DROP POLICY IF EXISTS "Users can view team compatibility in their business" ON public.team_compatibility;

CREATE POLICY "Business owners can manage team compatibility" 
ON public.team_compatibility 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

-- Shift templates
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage shift templates" ON public.shift_templates;
DROP POLICY IF EXISTS "Managers can manage shift templates" ON public.shift_templates;
DROP POLICY IF EXISTS "Users can view shift templates in their business" ON public.shift_templates;

CREATE POLICY "Business owners can manage shift templates" 
ON public.shift_templates 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);