-- Comprehensive Database Enhancement Migration
-- 1. Complete RLS Policies for remaining tables
-- 2. Additional database functions for common operations
-- 3. Triggers and constraints for data integrity  
-- 4. Performance optimizations with indexes

-- ============================================================================
-- 1. COMPLETE RLS POLICIES FOR REMAINING TABLES
-- ============================================================================

-- Enable RLS on tables that don't have it yet
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.till_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_business_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Documents
CREATE POLICY "Business members can manage documents" ON public.documents
FOR ALL USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- RLS Policies for Employee Schedules
CREATE POLICY "Managers can manage all schedules" ON public.employee_schedules
FOR ALL USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

CREATE POLICY "Employees can view their own schedules" ON public.employee_schedules
FOR SELECT USING (employee_id = auth.uid());

-- RLS Policies for Goals
CREATE POLICY "Users can manage their own goals" ON public.goals
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Managers can view team goals" ON public.goals
FOR SELECT USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- RLS Policies for Inventory
CREATE POLICY "Business members can manage inventory" ON public.inventory
FOR ALL USING (store_id IN (
  SELECT s.id FROM public.stores s
  JOIN public.user_business_memberships ubm ON s.business_id = ubm.business_id
  WHERE ubm.user_id = auth.uid() AND ubm.is_active = true
));

-- RLS Policies for Inventory Alerts
CREATE POLICY "Business members can view inventory alerts" ON public.inventory_alerts
FOR SELECT USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage inventory alerts" ON public.inventory_alerts
FOR ALL USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- RLS Policies for Inventory Movements
CREATE POLICY "Business members can view inventory movements" ON public.inventory_movements
FOR SELECT USING (store_id IN (
  SELECT s.id FROM public.stores s
  JOIN public.user_business_memberships ubm ON s.business_id = ubm.business_id
  WHERE ubm.user_id = auth.uid() AND ubm.is_active = true
));

-- RLS Policies for Orders
CREATE POLICY "Business members can manage orders" ON public.orders
FOR ALL USING (store_id IN (
  SELECT s.id FROM public.stores s
  JOIN public.user_business_memberships ubm ON s.business_id = ubm.business_id
  WHERE ubm.user_id = auth.uid() AND ubm.is_active = true
));

-- RLS Policies for Order Items
CREATE POLICY "Business members can manage order items" ON public.order_items
FOR ALL USING (order_id IN (
  SELECT o.id FROM public.orders o
  JOIN public.stores s ON o.store_id = s.id
  JOIN public.user_business_memberships ubm ON s.business_id = ubm.business_id
  WHERE ubm.user_id = auth.uid() AND ubm.is_active = true
));

-- RLS Policies for Products
CREATE POLICY "Business members can manage products" ON public.products
FOR ALL USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- RLS Policies for Profiles
CREATE POLICY "Users can view all profiles in their business" ON public.profiles
FOR SELECT USING (user_id IN (
  SELECT ubm.user_id FROM public.user_business_memberships ubm
  WHERE ubm.business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  ) AND ubm.is_active = true
));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for Stores
CREATE POLICY "Business members can manage stores" ON public.stores
FOR ALL USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- RLS Policies for Timesheets
CREATE POLICY "Users can manage their own timesheets" ON public.timesheets
FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Managers can view team timesheets" ON public.timesheets
FOR SELECT USING (store_id IN (
  SELECT s.id FROM public.stores s
  JOIN public.user_business_memberships ubm ON s.business_id = ubm.business_id
  WHERE ubm.user_id = auth.uid() AND ubm.role IN ('business_owner', 'manager') AND ubm.is_active = true
));

-- RLS Policies for User Business Memberships
CREATE POLICY "Users can view their own memberships" ON public.user_business_memberships
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage memberships" ON public.user_business_memberships
FOR ALL USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role = 'business_owner' AND is_active = true
));

-- ============================================================================
-- 2. ADDITIONAL DATABASE FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function to get business analytics
CREATE OR REPLACE FUNCTION public.get_business_analytics(p_business_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE(
  total_sales NUMERIC,
  total_orders INTEGER,
  average_order_value NUMERIC,
  top_selling_products JSONB,
  sales_by_employee JSONB,
  daily_sales JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH sales_data AS (
    SELECT 
      COALESCE(SUM(o.total), 0) as total_sales_val,
      COUNT(o.id) as total_orders_val,
      CASE WHEN COUNT(o.id) > 0 THEN COALESCE(SUM(o.total), 0) / COUNT(o.id) ELSE 0 END as avg_order_val
    FROM public.orders o
    JOIN public.stores s ON o.store_id = s.id
    WHERE s.business_id = p_business_id
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
      AND o.status = 'completed'
  ),
  top_products AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'product_name', p.name,
        'quantity_sold', SUM(oi.quantity),
        'total_revenue', SUM(oi.total_price)
      ) ORDER BY SUM(oi.quantity) DESC
    ) as products
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    JOIN public.stores s ON o.store_id = s.id
    JOIN public.products p ON oi.product_id = p.id
    WHERE s.business_id = p_business_id
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
      AND o.status = 'completed'
    LIMIT 10
  ),
  employee_sales AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'employee_name', COALESCE(pr.full_name, 'Unknown'),
        'total_sales', COALESCE(SUM(o.total), 0),
        'order_count', COUNT(o.id)
      ) ORDER BY SUM(o.total) DESC
    ) as employees
    FROM public.orders o
    JOIN public.stores s ON o.store_id = s.id
    LEFT JOIN public.profiles pr ON o.user_id = pr.user_id
    WHERE s.business_id = p_business_id
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
      AND o.status = 'completed'
    GROUP BY o.user_id, pr.full_name
  ),
  daily_sales_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', DATE(o.created_at),
        'sales', COALESCE(SUM(o.total), 0),
        'orders', COUNT(o.id)
      ) ORDER BY DATE(o.created_at)
    ) as daily_data
    FROM public.orders o
    JOIN public.stores s ON o.store_id = s.id
    WHERE s.business_id = p_business_id
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
      AND o.status = 'completed'
    GROUP BY DATE(o.created_at)
  )
  SELECT 
    sd.total_sales_val,
    sd.total_orders_val::INTEGER,
    sd.avg_order_val,
    COALESCE(tp.products, '[]'::jsonb),
    COALESCE(es.employees, '[]'::jsonb),
    COALESCE(dsd.daily_data, '[]'::jsonb)
  FROM sales_data sd
  CROSS JOIN top_products tp
  CROSS JOIN employee_sales es
  CROSS JOIN daily_sales_data dsd;
END;
$$;

-- Function to search across multiple tables
CREATE OR REPLACE FUNCTION public.global_search(p_business_id UUID, p_query TEXT)
RETURNS TABLE(
  result_type TEXT,
  result_id UUID,
  title TEXT,
  description TEXT,
  relevance_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  -- Search customers
  SELECT 
    'customer'::TEXT,
    c.id,
    COALESCE(c.first_name || ' ' || c.last_name, c.email),
    COALESCE('Phone: ' || c.phone, 'Email: ' || c.email),
    CASE 
      WHEN c.first_name ILIKE '%' || p_query || '%' OR c.last_name ILIKE '%' || p_query || '%' THEN 3
      WHEN c.email ILIKE '%' || p_query || '%' THEN 2
      ELSE 1
    END
  FROM public.customers c
  WHERE c.business_id = p_business_id
    AND (
      c.first_name ILIKE '%' || p_query || '%'
      OR c.last_name ILIKE '%' || p_query || '%'
      OR c.email ILIKE '%' || p_query || '%'
      OR c.phone ILIKE '%' || p_query || '%'
    )
  
  UNION ALL
  
  -- Search products
  SELECT 
    'product'::TEXT,
    p.id,
    p.name,
    COALESCE(p.description, 'Product'),
    CASE 
      WHEN p.name ILIKE '%' || p_query || '%' THEN 3
      WHEN p.description ILIKE '%' || p_query || '%' THEN 2
      ELSE 1
    END
  FROM public.products p
  WHERE p.business_id = p_business_id
    AND (
      p.name ILIKE '%' || p_query || '%'
      OR p.description ILIKE '%' || p_query || '%'
      OR p.sku ILIKE '%' || p_query || '%'
    )
  
  UNION ALL
  
  -- Search orders
  SELECT 
    'order'::TEXT,
    o.id,
    'Order #' || o.order_number,
    'Total: $' || o.total::TEXT,
    CASE 
      WHEN o.order_number ILIKE '%' || p_query || '%' THEN 3
      ELSE 1
    END
  FROM public.orders o
  JOIN public.stores s ON o.store_id = s.id
  WHERE s.business_id = p_business_id
    AND o.order_number ILIKE '%' || p_query || '%'
  
  ORDER BY relevance_score DESC, title
  LIMIT 50;
END;
$$;

-- Function to calculate optimal staffing
CREATE OR REPLACE FUNCTION public.calculate_optimal_staffing(p_business_id UUID, p_store_id UUID, p_date DATE)
RETURNS TABLE(
  hour_of_day INTEGER,
  recommended_staff INTEGER,
  historical_sales NUMERIC,
  foot_traffic_estimate INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH hourly_data AS (
    SELECT 
      EXTRACT(HOUR FROM o.created_at) as hour_val,
      AVG(o.total) as avg_sales,
      COUNT(o.id) as order_count
    FROM public.orders o
    WHERE o.store_id = p_store_id
      AND DATE(o.created_at) = p_date - INTERVAL '1 week' * generate_series(1, 4)
      AND EXTRACT(DOW FROM o.created_at) = EXTRACT(DOW FROM p_date)
      AND o.status = 'completed'
    GROUP BY EXTRACT(HOUR FROM o.created_at)
  )
  SELECT 
    h.hour_val::INTEGER,
    GREATEST(1, CEIL(h.order_count::NUMERIC / 10))::INTEGER as recommended_staff,
    COALESCE(h.avg_sales, 0),
    GREATEST(h.order_count * 3, 1)::INTEGER as foot_traffic
  FROM hourly_data h
  ORDER BY h.hour_val;
END;
$$;

-- ============================================================================
-- 3. TRIGGERS AND CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Constraint to ensure positive prices
ALTER TABLE public.products 
ADD CONSTRAINT positive_price CHECK (price >= 0);

-- Constraint to ensure positive inventory
ALTER TABLE public.inventory 
ADD CONSTRAINT positive_inventory CHECK (quantity_on_hand >= 0);

-- Constraint to ensure valid order totals
ALTER TABLE public.orders 
ADD CONSTRAINT positive_total CHECK (total >= 0);

-- Constraint to ensure valid timesheet hours
ALTER TABLE public.timesheets 
ADD CONSTRAINT valid_timesheet_hours CHECK (
  (clock_out IS NULL) OR (clock_out > clock_in)
);

-- Trigger to auto-generate order numbers
CREATE TRIGGER assign_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- Trigger to update customer totals
CREATE TRIGGER update_customer_totals_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.update_customer_totals();

-- Trigger to update inventory on sales
CREATE TRIGGER update_inventory_on_sale_trigger
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_sale();

-- Trigger to create inventory alerts
CREATE TRIGGER create_inventory_alert_trigger
  AFTER UPDATE ON public.inventory
  FOR EACH ROW
  WHEN (NEW.quantity_on_hand != OLD.quantity_on_hand)
  EXECUTE FUNCTION public.create_inventory_alert();

-- Trigger to log chargeback activity
CREATE TRIGGER log_chargeback_activity_trigger
  AFTER INSERT OR UPDATE ON public.chargeback_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_chargeback_activity();

-- Trigger to update timestamps
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. PERFORMANCE OPTIMIZATIONS WITH INDEXES
-- ============================================================================

-- Indexes for orders (most queried table)
CREATE INDEX IF NOT EXISTS idx_orders_store_id_created_at ON public.orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Indexes for inventory operations
CREATE INDEX IF NOT EXISTS idx_inventory_store_product ON public.inventory(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON public.inventory(store_id, quantity_on_hand) WHERE quantity_on_hand <= low_stock_threshold;

-- Indexes for user business memberships (security critical)
CREATE INDEX IF NOT EXISTS idx_user_business_memberships_user_active ON public.user_business_memberships(user_id, is_active, business_id);
CREATE INDEX IF NOT EXISTS idx_user_business_memberships_business_active ON public.user_business_memberships(business_id, is_active, role);

-- Indexes for timesheets
CREATE INDEX IF NOT EXISTS idx_timesheets_user_date ON public.timesheets(user_id, clock_in::date);
CREATE INDEX IF NOT EXISTS idx_timesheets_store_date ON public.timesheets(store_id, clock_in::date);

-- Indexes for profiles (frequently joined)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_business_active ON public.products(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- Indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(first_name, last_name);

-- Indexes for order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Indexes for stores
CREATE INDEX IF NOT EXISTS idx_stores_business_id ON public.stores(business_id);
CREATE INDEX IF NOT EXISTS idx_stores_pos_access_code ON public.stores(pos_access_code) WHERE pos_access_code IS NOT NULL;

-- Indexes for team communications
CREATE INDEX IF NOT EXISTS idx_team_messages_channel_created ON public.team_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_channels_business_type ON public.channels(business_id, type, is_archived);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON public.appointments(business_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_date ON public.appointments(provider_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON public.appointments(customer_id);

-- Indexes for commission tracking
CREATE INDEX IF NOT EXISTS idx_commission_payments_user_period ON public.commission_payments(user_id, payment_period, is_paid);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_business_role ON public.commission_tiers(business_id, role_type, is_active);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_orders_business_date_status ON public.orders(store_id, created_at::date, status);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_store_product_date ON public.inventory_movements(store_id, product_id, created_at DESC);

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')));

-- Partial indexes for common filtered queries
CREATE INDEX IF NOT EXISTS idx_orders_completed ON public.orders(store_id, created_at DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_inventory_tracked ON public.inventory(store_id, product_id) WHERE quantity_on_hand > 0;
CREATE INDEX IF NOT EXISTS idx_timesheets_active ON public.timesheets(user_id, clock_in) WHERE clock_out IS NULL;

COMMENT ON FUNCTION public.get_business_analytics IS 'Returns comprehensive business analytics for a given date range';
COMMENT ON FUNCTION public.global_search IS 'Performs full-text search across customers, products, and orders';
COMMENT ON FUNCTION public.calculate_optimal_staffing IS 'Calculates recommended staffing levels based on historical data';