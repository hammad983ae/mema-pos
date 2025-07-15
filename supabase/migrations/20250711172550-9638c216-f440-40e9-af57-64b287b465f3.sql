-- Fix the most critical tables that are accessed during business creation

-- Update channels policies to be safe for business creation
DROP POLICY IF EXISTS "Business members can view channels" ON public.channels;
CREATE POLICY "Users can access channels in their business" 
ON public.channels 
FOR SELECT 
USING (public.user_can_access_business(business_id));

-- Update announcement_settings to be safe
DROP POLICY IF EXISTS "Business members can view announcement settings" ON public.announcement_settings;
DROP POLICY IF EXISTS "Managers can manage announcement settings" ON public.announcement_settings;

CREATE POLICY "Users can view announcement settings" 
ON public.announcement_settings 
FOR SELECT 
USING (public.user_can_access_business(business_id));

CREATE POLICY "Managers can manage announcement settings" 
ON public.announcement_settings 
FOR ALL 
USING (public.user_can_access_business(business_id, ARRAY['business_owner'::user_role, 'manager'::user_role]));

-- Update business_pos_settings to be safe
DROP POLICY IF EXISTS "Business members can view POS settings" ON public.business_pos_settings;
DROP POLICY IF EXISTS "Managers can manage POS settings" ON public.business_pos_settings;

CREATE POLICY "Users can view POS settings" 
ON public.business_pos_settings 
FOR SELECT 
USING (public.user_can_access_business(business_id));

CREATE POLICY "Managers can manage POS settings" 
ON public.business_pos_settings 
FOR ALL 
USING (public.user_can_access_business(business_id, ARRAY['business_owner'::user_role, 'manager'::user_role]));