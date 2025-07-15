-- PERMANENT FIX: Replace temporary policies with proper permanent ones
-- This ensures business creation works smoothly with secure, long-term policies

-- Drop the temporary policies
DROP POLICY IF EXISTS "Business owners can manage business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Business owners can manage appointments" ON public.appointments; 
DROP POLICY IF EXISTS "Business owners can manage availability" ON public.availability_overrides;
DROP POLICY IF EXISTS "Business owners can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Business owners can manage services" ON public.services;

-- Create permanent, secure policies that work for business creation and ongoing operations

-- Business Hours - permanent policy
CREATE POLICY "Business access for business hours" 
ON public.business_hours 
FOR ALL 
USING (
  -- Business owner can always access
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
  OR
  -- Active business members can access
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Appointments - permanent policy  
CREATE POLICY "Business access for appointments"
ON public.appointments
FOR ALL
USING (
  -- Business owner can always access
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
  OR
  -- Active business members can access
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  -- Service providers can access their own appointments
  provider_id = auth.uid()
);

-- Availability Overrides - permanent policy
CREATE POLICY "Business access for availability overrides"
ON public.availability_overrides
FOR ALL
USING (
  -- Business owner can always access
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
  OR
  -- Active business members can access
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  -- Users can manage their own availability
  user_id = auth.uid()
);

-- Service Providers - permanent policy
CREATE POLICY "Business access for service providers"
ON public.service_providers
FOR ALL
USING (
  -- Business owner can always access
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
  OR
  -- Active business members can access
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Services - permanent policy
CREATE POLICY "Business access for services"
ON public.services
FOR ALL
USING (
  -- Business owner can always access  
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
  OR
  -- Active business members can access
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);