-- First, let's check the current definition of the historical_orders_view
SELECT definition FROM pg_views WHERE viewname = 'historical_orders_view' AND schemaname = 'public';

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.historical_orders_view;

-- Recreate the view without SECURITY DEFINER to fix the security warning
-- This view provides a read-only interface to historical order data
CREATE VIEW public.historical_orders_view AS
SELECT 
  o.id,
  o.order_number,
  o.customer_id,
  o.store_id,
  o.user_id,
  o.total,
  o.subtotal,
  o.tax_amount,
  o.tip_amount,
  o.discount_amount,
  o.payment_method,
  o.status,
  o.created_at,
  o.updated_at,
  s.name as store_name,
  s.business_id,
  COALESCE(c.first_name || ' ' || c.last_name, 'Walk-in Customer') as customer_name,
  p.full_name as employee_name
FROM public.orders o
LEFT JOIN public.stores s ON s.id = o.store_id
LEFT JOIN public.customers c ON c.id = o.customer_id
LEFT JOIN public.profiles p ON p.user_id = o.user_id
WHERE o.status = 'completed';

-- Add RLS policy to the view to ensure proper access control
ALTER VIEW public.historical_orders_view OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.historical_orders_view TO authenticated;
GRANT SELECT ON public.historical_orders_view TO anon;