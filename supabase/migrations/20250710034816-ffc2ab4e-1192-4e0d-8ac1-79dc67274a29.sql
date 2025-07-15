
-- Update RLS policies for shipping_requests table
-- Drop existing policies if any
DROP POLICY IF EXISTS "Employees can view their own shipping requests" ON public.shipping_requests;
DROP POLICY IF EXISTS "Employees can update their own shipping requests" ON public.shipping_requests;
DROP POLICY IF EXISTS "Managers and office can view all shipping requests" ON public.shipping_requests;
DROP POLICY IF EXISTS "Managers and office can update all shipping requests" ON public.shipping_requests;
DROP POLICY IF EXISTS "Employees can create shipping requests" ON public.shipping_requests;

-- Enable RLS on shipping_requests if not already enabled
ALTER TABLE public.shipping_requests ENABLE ROW LEVEL SECURITY;

-- Policy for employees to view only their own shipping requests
CREATE POLICY "Employees can view their own shipping requests" 
ON public.shipping_requests 
FOR SELECT 
USING (employee_id = auth.uid());

-- Policy for employees to update only their own shipping requests
CREATE POLICY "Employees can update their own shipping requests" 
ON public.shipping_requests 
FOR UPDATE 
USING (employee_id = auth.uid());

-- Policy for employees to create shipping requests (they become the owner)
CREATE POLICY "Employees can create shipping requests" 
ON public.shipping_requests 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

-- Policy for managers and office staff to view all shipping requests
CREATE POLICY "Managers and office can view all shipping requests" 
ON public.shipping_requests 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager', 'office') 
    AND is_active = true
));

-- Policy for managers and office staff to update all shipping requests
CREATE POLICY "Managers and office can update all shipping requests" 
ON public.shipping_requests 
FOR UPDATE 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager', 'office') 
    AND is_active = true
));

-- Policy for managers and office staff to insert shipping requests on behalf of employees
CREATE POLICY "Managers and office can create shipping requests" 
ON public.shipping_requests 
FOR INSERT 
WITH CHECK (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager', 'office') 
    AND is_active = true
));

-- Similarly update RLS policies for shipping_request_items table
-- Enable RLS on shipping_request_items if not already enabled
ALTER TABLE public.shipping_request_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view shipping items for accessible requests" ON public.shipping_request_items;
DROP POLICY IF EXISTS "Users can manage shipping items for accessible requests" ON public.shipping_request_items;

-- Policy for users to view shipping items for requests they can access
CREATE POLICY "Users can view shipping items for accessible requests" 
ON public.shipping_request_items 
FOR SELECT 
USING (
  shipping_request_id IN (
    SELECT id FROM public.shipping_requests 
    WHERE employee_id = auth.uid()
  ) OR 
  shipping_request_id IN (
    SELECT sr.id FROM public.shipping_requests sr
    WHERE sr.business_id IN (
      SELECT business_id 
      FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager', 'office') 
        AND is_active = true
    )
  )
);

-- Policy for users to manage shipping items for requests they can access
CREATE POLICY "Users can manage shipping items for accessible requests" 
ON public.shipping_request_items 
FOR ALL 
USING (
  shipping_request_id IN (
    SELECT id FROM public.shipping_requests 
    WHERE employee_id = auth.uid()
  ) OR 
  shipping_request_id IN (
    SELECT sr.id FROM public.shipping_requests sr
    WHERE sr.business_id IN (
      SELECT business_id 
      FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager', 'office') 
        AND is_active = true
    )
  )
)
WITH CHECK (
  shipping_request_id IN (
    SELECT id FROM public.shipping_requests 
    WHERE employee_id = auth.uid()
  ) OR 
  shipping_request_id IN (
    SELECT sr.id FROM public.shipping_requests sr
    WHERE sr.business_id IN (
      SELECT business_id 
      FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager', 'office') 
        AND is_active = true
    )
  )
);
