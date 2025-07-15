-- Temporarily disable RLS on the most critical tables during business creation
-- We'll re-enable with safe policies after

-- Instead of dropping all policies, let's just temporarily allow broader access
-- for business creation to work, then we can fine-tune later

-- Drop the most problematic policies that are accessed during business setup
DROP POLICY IF EXISTS "Business members can manage business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Business members can manage appointments" ON public.appointments;
DROP POLICY IF EXISTS "Business members can manage availability overrides" ON public.availability_overrides;
DROP POLICY IF EXISTS "Business members can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Business members can manage services" ON public.services;

-- Create temporary broader policies for business creation
CREATE POLICY "Business owners can manage business hours" 
ON public.business_hours 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can manage appointments" 
ON public.appointments 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can manage availability" 
ON public.availability_overrides 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can manage service providers" 
ON public.service_providers 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Business owners can manage services" 
ON public.services 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);