-- Fix security definer issue by explicitly setting security_invoker = on
ALTER VIEW public.transaction_history
SET (security_invoker = on);

ALTER VIEW public.sales_by_type  
SET (security_invoker = on);

-- Add comments to document the security approach
COMMENT ON VIEW public.transaction_history IS 'Transaction history view with SECURITY INVOKER - respects RLS policies from underlying tables';
COMMENT ON VIEW public.sales_by_type IS 'Sales analytics view with SECURITY INVOKER - respects RLS policies from underlying tables';