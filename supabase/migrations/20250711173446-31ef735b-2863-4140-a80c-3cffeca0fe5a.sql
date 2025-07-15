-- Fix channel_members policies to prevent infinite recursion
DROP POLICY IF EXISTS "Business members can join public channels" ON public.channel_members;
DROP POLICY IF EXISTS "Channel admins and managers can manage members" ON public.channel_members;
DROP POLICY IF EXISTS "Users can view channel members for accessible channels" ON public.channel_members;

-- Create safe policies for channel_members that don't cause recursion
CREATE POLICY "Users can join public channels in their business" 
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

CREATE POLICY "Business owners and channel admins can manage members" 
ON public.channel_members 
FOR ALL 
USING (
  channel_id IN (
    SELECT c.id 
    FROM public.channels c 
    WHERE public.user_can_access_business(c.business_id, ARRAY['business_owner'::user_role, 'manager'::user_role])
  )
  OR 
  channel_id IN (
    SELECT cm.channel_id 
    FROM public.channel_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role = 'admin'
  )
);

CREATE POLICY "Users can view members of accessible channels" 
ON public.channel_members 
FOR SELECT 
USING (
  channel_id IN (
    SELECT c.id 
    FROM public.channels c 
    WHERE (
      (c.type = 'public' AND public.user_can_access_business(c.business_id))
      OR 
      (c.type IN ('private', 'direct') AND c.id IN (
        SELECT cm.channel_id 
        FROM public.channel_members cm 
        WHERE cm.user_id = auth.uid()
      ))
    )
  )
);