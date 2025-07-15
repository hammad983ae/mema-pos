-- Advanced Sales Analytics and Data Migration System

-- Create data migration tables for external POS systems
CREATE TABLE public.data_migration_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  source_system TEXT NOT NULL, -- 'masterpos', 'novapos', 'csv', etc.
  job_type TEXT NOT NULL, -- 'full_import', 'incremental', 'validation'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  file_path TEXT,
  mapping_config JSONB, -- Field mapping configuration
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  error_records INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL
);

-- Create table for external data staging
CREATE TABLE public.external_data_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_job_id UUID NOT NULL REFERENCES public.data_migration_jobs(id),
  source_system TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'order', 'customer', 'product', 'payment'
  source_id TEXT, -- Original ID from source system
  raw_data JSONB NOT NULL,
  mapped_data JSONB,
  validation_errors JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'mapped', 'validated', 'imported', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced sales analytics table for advanced tracking
CREATE TABLE public.sales_analytics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  store_id UUID,
  user_id UUID, -- Employee who made the sale
  date_key DATE NOT NULL, -- For date-based aggregations
  hour_key INTEGER, -- 0-23 for hourly analysis
  day_of_week INTEGER, -- 1-7 for day patterns
  week_of_year INTEGER,
  month_key INTEGER, -- 1-12
  quarter_key INTEGER, -- 1-4
  year_key INTEGER,
  
  -- Core metrics
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  average_order_value NUMERIC NOT NULL DEFAULT 0,
  
  -- Payment method breakdown
  cash_sales NUMERIC DEFAULT 0,
  card_sales NUMERIC DEFAULT 0,
  digital_wallet_sales NUMERIC DEFAULT 0,
  other_payment_sales NUMERIC DEFAULT 0,
  
  -- Customer metrics
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Product categories
  category_breakdown JSONB DEFAULT '{}',
  
  -- Advanced metrics
  cost_of_goods_sold NUMERIC DEFAULT 0,
  gross_profit NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, store_id, user_id, date_key, hour_key)
);

-- Create indexes for fast querying
CREATE INDEX idx_sales_analytics_business_date ON public.sales_analytics_cache (business_id, date_key);
CREATE INDEX idx_sales_analytics_store_date ON public.sales_analytics_cache (store_id, date_key);
CREATE INDEX idx_sales_analytics_user_date ON public.sales_analytics_cache (user_id, date_key);
CREATE INDEX idx_sales_analytics_date_range ON public.sales_analytics_cache (business_id, date_key, year_key, month_key);

-- Create historical orders view for backward compatibility
CREATE OR REPLACE VIEW public.historical_orders_view AS
SELECT 
  o.*,
  s.name as store_name,
  s.business_id,
  p.full_name as employee_name,
  c.first_name || ' ' || c.last_name as customer_name,
  EXTRACT(YEAR FROM o.created_at) as sale_year,
  EXTRACT(MONTH FROM o.created_at) as sale_month,
  EXTRACT(DAY FROM o.created_at) as sale_day,
  EXTRACT(HOUR FROM o.created_at) as sale_hour,
  EXTRACT(DOW FROM o.created_at) as day_of_week,
  DATE_TRUNC('week', o.created_at) as week_start,
  DATE_TRUNC('month', o.created_at) as month_start,
  DATE_TRUNC('quarter', o.created_at) as quarter_start
FROM orders o
LEFT JOIN stores s ON s.id = o.store_id
LEFT JOIN profiles p ON p.user_id = o.user_id
LEFT JOIN customers c ON c.id = o.customer_id;

-- Function to update analytics cache
CREATE OR REPLACE FUNCTION public.update_sales_analytics_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  cache_date DATE;
  cache_hour INTEGER;
  store_business_id UUID;
BEGIN
  -- Only process completed orders
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Get business_id from store
  SELECT business_id INTO store_business_id
  FROM public.stores
  WHERE id = NEW.store_id;
  
  cache_date := DATE(NEW.created_at);
  cache_hour := EXTRACT(HOUR FROM NEW.created_at);
  
  -- Update or insert analytics cache
  INSERT INTO public.sales_analytics_cache (
    business_id, store_id, user_id, date_key, hour_key,
    day_of_week, week_of_year, month_key, quarter_key, year_key,
    total_sales, total_transactions, average_order_value
  ) VALUES (
    store_business_id, NEW.store_id, NEW.user_id, cache_date, cache_hour,
    EXTRACT(DOW FROM NEW.created_at),
    EXTRACT(WEEK FROM NEW.created_at),
    EXTRACT(MONTH FROM NEW.created_at),
    EXTRACT(QUARTER FROM NEW.created_at),
    EXTRACT(YEAR FROM NEW.created_at),
    NEW.total, 1, NEW.total
  )
  ON CONFLICT (business_id, store_id, user_id, date_key, hour_key)
  DO UPDATE SET
    total_sales = sales_analytics_cache.total_sales + NEW.total,
    total_transactions = sales_analytics_cache.total_transactions + 1,
    average_order_value = (sales_analytics_cache.total_sales + NEW.total) / (sales_analytics_cache.total_transactions + 1),
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger for analytics cache
CREATE TRIGGER update_sales_analytics_cache_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_analytics_cache();

-- Function for data migration mapping
CREATE OR REPLACE FUNCTION public.map_external_data(
  p_raw_data JSONB,
  p_source_system TEXT,
  p_record_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  mapped_data JSONB := '{}';
BEGIN
  -- Map MasterPOS data
  IF p_source_system = 'masterpos' THEN
    IF p_record_type = 'order' THEN
      mapped_data := jsonb_build_object(
        'order_number', p_raw_data->>'TransactionID',
        'total', (p_raw_data->>'Total')::NUMERIC,
        'tax', (p_raw_data->>'Tax')::NUMERIC,
        'subtotal', (p_raw_data->>'Subtotal')::NUMERIC,
        'payment_method', p_raw_data->>'PaymentMethod',
        'created_at', (p_raw_data->>'DateTime')::TIMESTAMP,
        'customer_name', p_raw_data->>'CustomerName',
        'employee_name', p_raw_data->>'Employee'
      );
    END IF;
  END IF;
  
  -- Map NovaPOS data
  IF p_source_system = 'novapos' THEN
    IF p_record_type = 'order' THEN
      mapped_data := jsonb_build_object(
        'order_number', p_raw_data->>'receipt_number',
        'total', (p_raw_data->>'total_amount')::NUMERIC,
        'tax', (p_raw_data->>'tax_amount')::NUMERIC,
        'subtotal', (p_raw_data->>'sub_total')::NUMERIC,
        'payment_method', p_raw_data->>'payment_type',
        'created_at', (p_raw_data->>'sale_date')::TIMESTAMP,
        'customer_name', p_raw_data->>'customer',
        'employee_name', p_raw_data->>'cashier'
      );
    END IF;
  END IF;
  
  RETURN mapped_data;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.data_migration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data migration
CREATE POLICY "Business owners can manage migration jobs"
ON public.data_migration_jobs
FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships
  WHERE user_id = auth.uid() AND is_active = true
  AND role IN ('business_owner', 'manager')
));

CREATE POLICY "Business members can view migration staging"
ON public.external_data_staging
FOR SELECT
USING (migration_job_id IN (
  SELECT id FROM public.data_migration_jobs
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships
    WHERE user_id = auth.uid() AND is_active = true
  )
));

CREATE POLICY "Business members can view analytics cache"
ON public.sales_analytics_cache
FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships
  WHERE user_id = auth.uid() AND is_active = true
));

-- Add timestamps trigger
CREATE TRIGGER update_data_migration_jobs_updated_at
  BEFORE UPDATE ON public.data_migration_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_analytics_cache_updated_at
  BEFORE UPDATE ON public.sales_analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();