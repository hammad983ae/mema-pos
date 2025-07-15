-- Update shipping requests RLS policies to restrict employee access to their own requests

-- First, drop the existing broad SELECT policy
DROP POLICY IF EXISTS "Employees can view their own shipping requests" ON public.shipping_requests;
DROP POLICY IF EXISTS "Office staff can view all shipping requests" ON public.shipping_requests;

-- Create new policies that restrict employee access to their own requests
-- Employees can only view their own shipping requests
CREATE POLICY "Employees can view their own shipping requests"
ON public.shipping_requests
FOR SELECT
USING (
  employee_id = auth.uid() AND 
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Office staff can view all shipping requests in their business
CREATE POLICY "Office staff can view all shipping requests"
ON public.shipping_requests
FOR SELECT
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role = ANY(ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
      AND is_active = true
  )
);