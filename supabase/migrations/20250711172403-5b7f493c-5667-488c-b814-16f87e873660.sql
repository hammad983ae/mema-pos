-- Fix the channels table policies to avoid circular dependency issues
DROP POLICY IF EXISTS "Managers can manage channels" ON public.channels;
DROP POLICY IF EXISTS "Users can view channels in their business" ON public.channels;

-- Create new policies that reference businesses table directly
CREATE POLICY "Business owners can manage channels" 
ON public.channels 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Business members can view channels" 
ON public.channels 
FOR SELECT 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
  OR 
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);