-- Remove all channel_members policies to prevent any recursion
DROP POLICY IF EXISTS "Users can join public channels in their business" ON public.channel_members;
DROP POLICY IF EXISTS "Business owners and channel admins can manage members" ON public.channel_members;
DROP POLICY IF EXISTS "Users can view members of accessible channels" ON public.channel_members;

-- Create simple, safe policies for channel_members with NO self-references
CREATE POLICY "Business owners can manage all channel members" 
ON public.channel_members 
FOR ALL 
USING (
  channel_id IN (
    SELECT c.id 
    FROM public.channels c 
    WHERE public.user_can_access_business(c.business_id, ARRAY['business_owner'::user_role, 'manager'::user_role])
  )
);

CREATE POLICY "Users can view public channel members" 
ON public.channel_members 
FOR SELECT 
USING (
  channel_id IN (
    SELECT c.id 
    FROM public.channels c 
    WHERE c.type = 'public' 
      AND public.user_can_access_business(c.business_id)
  )
);

CREATE POLICY "Users can join public channels" 
ON public.channel_members 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND channel_id IN (
    SELECT c.id 
    FROM public.channels c 
    WHERE c.type = 'public' 
      AND public.user_can_access_business(c.business_id)
  )
);