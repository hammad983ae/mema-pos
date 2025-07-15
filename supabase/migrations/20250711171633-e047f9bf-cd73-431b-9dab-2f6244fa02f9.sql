-- Final table: schedule recommendations
ALTER TABLE public.schedule_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage schedule recommendations" ON public.schedule_recommendations;
DROP POLICY IF EXISTS "Managers can manage schedule recommendations" ON public.schedule_recommendations;

CREATE POLICY "Business owners can manage schedule recommendations" 
ON public.schedule_recommendations 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);

-- Now let's also properly handle the user_business_memberships table
ALTER TABLE public.user_business_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage their own memberships" 
ON public.user_business_memberships 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage all memberships in their business" 
ON public.user_business_memberships 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);