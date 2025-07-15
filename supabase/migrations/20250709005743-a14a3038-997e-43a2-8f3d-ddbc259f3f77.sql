-- Create cash drawer operations table
CREATE TABLE public.cash_drawer_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('open', 'close', 'cash_drop', 'till_count', 'no_sale')),
  amount NUMERIC(10,2) DEFAULT 0.00,
  expected_amount NUMERIC(10,2),
  variance NUMERIC(10,2),
  notes TEXT,
  till_session_id UUID,
  receipt_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create till sessions table
CREATE TABLE public.till_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  opening_cash NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  closing_cash NUMERIC(10,2),
  total_sales NUMERIC(10,2) DEFAULT 0.00,
  total_cash_sales NUMERIC(10,2) DEFAULT 0.00,
  total_card_sales NUMERIC(10,2) DEFAULT 0.00,
  total_cash_drops NUMERIC(10,2) DEFAULT 0.00,
  total_transactions INTEGER DEFAULT 0,
  expected_cash NUMERIC(10,2),
  cash_variance NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory alerts table for real-time notifications
CREATE TABLE public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder_point', 'overstocked')),
  current_quantity INTEGER NOT NULL,
  threshold_quantity INTEGER,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliation reports table
CREATE TABLE public.reconciliation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  till_session_id UUID REFERENCES public.till_sessions(id),
  created_by UUID NOT NULL,
  
  -- Sales totals
  total_sales NUMERIC(10,2) DEFAULT 0.00,
  cash_sales NUMERIC(10,2) DEFAULT 0.00,
  card_sales NUMERIC(10,2) DEFAULT 0.00,
  total_transactions INTEGER DEFAULT 0,
  
  -- Cash management
  opening_cash NUMERIC(10,2) DEFAULT 0.00,
  closing_cash NUMERIC(10,2) DEFAULT 0.00,
  cash_drops NUMERIC(10,2) DEFAULT 0.00,
  expected_cash NUMERIC(10,2) DEFAULT 0.00,
  cash_variance NUMERIC(10,2) DEFAULT 0.00,
  
  -- Inventory impact
  items_sold INTEGER DEFAULT 0,
  inventory_adjustments INTEGER DEFAULT 0,
  
  -- Discrepancies
  transaction_discrepancies JSONB DEFAULT '[]',
  inventory_discrepancies JSONB DEFAULT '[]',
  cash_discrepancies JSONB DEFAULT '[]',
  
  -- Status and notes
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'flagged')),
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_cash_drawer_operations_store_user ON public.cash_drawer_operations(store_id, user_id);
CREATE INDEX idx_cash_drawer_operations_session ON public.cash_drawer_operations(till_session_id);
CREATE INDEX idx_cash_drawer_operations_date ON public.cash_drawer_operations(created_at);

CREATE INDEX idx_till_sessions_store_user ON public.till_sessions(store_id, user_id);
CREATE INDEX idx_till_sessions_status ON public.till_sessions(status);
CREATE INDEX idx_till_sessions_date ON public.till_sessions(session_start);

CREATE INDEX idx_inventory_alerts_store_product ON public.inventory_alerts(store_id, product_id);
CREATE INDEX idx_inventory_alerts_type ON public.inventory_alerts(alert_type);
CREATE INDEX idx_inventory_alerts_resolved ON public.inventory_alerts(is_resolved);

CREATE INDEX idx_reconciliation_reports_store_date ON public.reconciliation_reports(store_id, report_date);
CREATE INDEX idx_reconciliation_reports_status ON public.reconciliation_reports(status);

-- Enable RLS on all tables
ALTER TABLE public.cash_drawer_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.till_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash drawer operations
CREATE POLICY "Users can view cash operations for their business"
ON public.cash_drawer_operations FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Users can create cash operations"
ON public.cash_drawer_operations FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Managers can manage all cash operations"
ON public.cash_drawer_operations FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager')
  AND is_active = true
));

-- RLS policies for till sessions
CREATE POLICY "Users can view till sessions for their business"
ON public.till_sessions FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Users can manage their own till sessions"
ON public.till_sessions FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Managers can manage all till sessions"
ON public.till_sessions FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager')
  AND is_active = true
));

-- RLS policies for inventory alerts
CREATE POLICY "Users can view inventory alerts for their business"
ON public.inventory_alerts FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "System can create inventory alerts"
ON public.inventory_alerts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Managers can manage inventory alerts"
ON public.inventory_alerts FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager', 'office')
  AND is_active = true
));

-- RLS policies for reconciliation reports
CREATE POLICY "Users can view reconciliation reports for their business"
ON public.reconciliation_reports FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Users can create reconciliation reports"
ON public.reconciliation_reports FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Managers can manage reconciliation reports"
ON public.reconciliation_reports FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager', 'office')
  AND is_active = true
));

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_till_sessions_updated_at
  BEFORE UPDATE ON public.till_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reconciliation_reports_updated_at
  BEFORE UPDATE ON public.reconciliation_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create inventory alerts
CREATE OR REPLACE FUNCTION public.create_inventory_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for low stock
  IF NEW.quantity_on_hand <= COALESCE(NEW.low_stock_threshold, 10) AND NEW.quantity_on_hand > 0 THEN
    INSERT INTO public.inventory_alerts (
      business_id, store_id, product_id, alert_type, 
      current_quantity, threshold_quantity, message
    )
    SELECT 
      s.business_id, NEW.store_id, NEW.product_id, 'low_stock',
      NEW.quantity_on_hand, NEW.low_stock_threshold,
      'Product ' || p.name || ' is running low in stock'
    FROM public.stores s
    JOIN public.products p ON p.id = NEW.product_id
    WHERE s.id = NEW.store_id
    ON CONFLICT (store_id, product_id, alert_type, is_resolved) 
    WHERE is_resolved = false
    DO UPDATE SET 
      current_quantity = NEW.quantity_on_hand,
      message = 'Product is running low in stock',
      created_at = now();
  END IF;
  
  -- Check for out of stock
  IF NEW.quantity_on_hand <= 0 THEN
    INSERT INTO public.inventory_alerts (
      business_id, store_id, product_id, alert_type, 
      current_quantity, threshold_quantity, message
    )
    SELECT 
      s.business_id, NEW.store_id, NEW.product_id, 'out_of_stock',
      NEW.quantity_on_hand, 0,
      'Product ' || p.name || ' is out of stock'
    FROM public.stores s
    JOIN public.products p ON p.id = NEW.product_id
    WHERE s.id = NEW.store_id
    ON CONFLICT (store_id, product_id, alert_type, is_resolved) 
    WHERE is_resolved = false
    DO UPDATE SET 
      current_quantity = NEW.quantity_on_hand,
      message = 'Product is out of stock',
      created_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory alerts
CREATE TRIGGER inventory_alert_trigger
  AFTER UPDATE OF quantity_on_hand ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.create_inventory_alert();

-- Add unique constraint for inventory alerts to prevent duplicates
ALTER TABLE public.inventory_alerts 
ADD CONSTRAINT inventory_alerts_unique_active 
UNIQUE (store_id, product_id, alert_type, is_resolved) 
DEFERRABLE INITIALLY DEFERRED;