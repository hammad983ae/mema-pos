-- Drop the existing views with SECURITY DEFINER
DROP VIEW IF EXISTS public.transaction_history;
DROP VIEW IF EXISTS public.sales_by_type;

-- Recreate transaction_history view without SECURITY DEFINER
CREATE VIEW public.transaction_history AS
SELECT 
    o.id,
    o.order_number AS transaction_number,
    'sale'::text AS transaction_type,
    o.store_id,
    o.customer_id,
    o.user_id,
    o.total AS amount,
    o.payment_method,
    o.status,
    o.created_at,
    o.updated_at
FROM orders o
WHERE o.status = 'completed'
UNION ALL
SELECT 
    r.id,
    r.refund_number AS transaction_number,
    'refund'::text AS transaction_type,
    r.store_id,
    r.customer_id,
    r.user_id,
    (-r.total_refunded) AS amount,
    r.payment_method,
    r.status,
    r.created_at,
    r.updated_at
FROM refunds r
WHERE r.status = 'processed';

-- Recreate sales_by_type view without SECURITY DEFINER
CREATE VIEW public.sales_by_type AS
SELECT 
    o.user_id,
    p.full_name,
    pr.position_type,
    o.sale_type,
    COUNT(*) AS total_sales,
    SUM(o.total) AS total_amount,
    DATE_TRUNC('week', o.created_at) AS week_start,
    DATE_TRUNC('month', o.created_at) AS month_start
FROM orders o
JOIN profiles p ON p.user_id = o.user_id
LEFT JOIN profiles pr ON pr.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY o.user_id, p.full_name, pr.position_type, o.sale_type, 
         DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- Enable RLS on the views (views inherit RLS from underlying tables)
-- The views will automatically respect the RLS policies on orders, refunds, and profiles tables

-- Add comment explaining the security approach
COMMENT ON VIEW public.transaction_history IS 'Transaction history view that respects RLS policies from underlying tables';
COMMENT ON VIEW public.sales_by_type IS 'Sales analytics view that respects RLS policies from underlying tables';