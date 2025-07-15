-- Phase 3: Enhanced Inventory & Stock Management

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_date TIMESTAMP WITH TIME ZONE,
  received_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_ordered INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory movements table for tracking stock changes
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'transfer', 'return')),
  quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_id UUID, -- Could reference order_id, purchase_order_id, etc.
  reference_type TEXT, -- 'order', 'purchase_order', 'adjustment', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID -- User who made the change
);

-- Create low stock alerts table
CREATE TABLE public.low_stock_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  current_quantity INTEGER NOT NULL,
  threshold_quantity INTEGER NOT NULL,
  alert_level TEXT DEFAULT 'low' CHECK (alert_level IN ('low', 'critical', 'out_of_stock')),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, product_id, is_resolved) -- Ensure only one active alert per product per store
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view purchase orders" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage purchase orders" ON public.purchase_orders
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view purchase order items" ON public.purchase_order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage purchase order items" ON public.purchase_order_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view inventory movements" ON public.inventory_movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage inventory movements" ON public.inventory_movements
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view low stock alerts" ON public.low_stock_alerts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage low stock alerts" ON public.low_stock_alerts
  FOR ALL TO authenticated USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate purchase order numbers
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'PO-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD((
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(po_number, '-', 3) AS INTEGER)
    ), 0) + 1
    FROM public.purchase_orders 
    WHERE po_number LIKE 'PO-' || TO_CHAR(now(), 'YYYYMMDD') || '-%'
  )::TEXT, 4, '0') INTO new_number;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check and create low stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove resolved alert if stock is back above threshold
  IF NEW.quantity_on_hand > NEW.low_stock_threshold THEN
    UPDATE public.low_stock_alerts 
    SET is_resolved = true, resolved_at = now()
    WHERE store_id = NEW.store_id 
      AND product_id = NEW.product_id 
      AND is_resolved = false;
  ELSE
    -- Create or update low stock alert
    INSERT INTO public.low_stock_alerts (
      store_id, 
      product_id, 
      current_quantity, 
      threshold_quantity,
      alert_level
    ) VALUES (
      NEW.store_id,
      NEW.product_id,
      NEW.quantity_on_hand,
      NEW.low_stock_threshold,
      CASE 
        WHEN NEW.quantity_on_hand = 0 THEN 'out_of_stock'
        WHEN NEW.quantity_on_hand <= (NEW.low_stock_threshold * 0.5) THEN 'critical'
        ELSE 'low'
      END
    )
    ON CONFLICT (store_id, product_id, is_resolved) 
    WHERE is_resolved = false
    DO UPDATE SET
      current_quantity = NEW.quantity_on_hand,
      threshold_quantity = NEW.low_stock_threshold,
      alert_level = CASE 
        WHEN NEW.quantity_on_hand = 0 THEN 'out_of_stock'
        WHEN NEW.quantity_on_hand <= (NEW.low_stock_threshold * 0.5) THEN 'critical'
        ELSE 'low'
      END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check low stock alerts when inventory changes
CREATE TRIGGER check_low_stock_alerts_trigger
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock_alerts();

-- Enhanced function to record inventory movements
CREATE OR REPLACE FUNCTION public.record_inventory_movement()
RETURNS TRIGGER AS $$
DECLARE
  movement_type_val TEXT;
  quantity_change_val INTEGER;
  reference_id_val UUID;
  reference_type_val TEXT;
BEGIN
  -- Determine movement type and reference based on the trigger source
  IF TG_TABLE_NAME = 'order_items' THEN
    movement_type_val := 'sale';
    quantity_change_val := -NEW.quantity;
    reference_id_val := NEW.order_id;
    reference_type_val := 'order';
  ELSIF TG_TABLE_NAME = 'purchase_order_items' THEN
    movement_type_val := 'purchase';
    quantity_change_val := NEW.quantity_received;
    reference_id_val := NEW.purchase_order_id;
    reference_type_val := 'purchase_order';
  ELSE
    -- For direct inventory updates (adjustments)
    movement_type_val := 'adjustment';
    quantity_change_val := NEW.quantity_on_hand - OLD.quantity_on_hand;
    reference_id_val := NULL;
    reference_type_val := 'adjustment';
  END IF;

  -- Insert inventory movement record
  INSERT INTO public.inventory_movements (
    store_id,
    product_id,
    movement_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reference_id,
    reference_type,
    created_by
  ) VALUES (
    COALESCE(NEW.store_id, (SELECT store_id FROM public.orders WHERE id = NEW.order_id)),
    NEW.product_id,
    movement_type_val,
    quantity_change_val,
    COALESCE(OLD.quantity_on_hand, 0),
    NEW.quantity_on_hand,
    reference_id_val,
    reference_type_val,
    auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add movement tracking triggers
CREATE TRIGGER record_inventory_movement_trigger
  AFTER UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.record_inventory_movement();

-- Enable realtime for inventory tables
ALTER TABLE public.inventory REPLICA IDENTITY FULL;
ALTER TABLE public.low_stock_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_movements REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.low_stock_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_movements;

-- Insert sample suppliers
INSERT INTO public.suppliers (name, contact_person, email, phone, address)
VALUES 
  ('GlowTech Labs', 'Sarah Johnson', 'sarah@glowtech.com', '(555) 123-4567', '123 Beauty Ave, Los Angeles, CA'),
  ('AquaDerm Solutions', 'Mike Chen', 'mike@aquaderm.com', '(555) 234-5678', '456 Skincare St, New York, NY'),
  ('NightGlow Co.', 'Emma Rodriguez', 'emma@nightglow.com', '(555) 345-6789', '789 Wellness Blvd, Miami, FL'),
  ('PureSkin Inc.', 'David Wilson', 'david@pureskin.com', '(555) 456-7890', '321 Natural Way, Seattle, WA'),
  ('SunShield Corp', 'Lisa Thompson', 'lisa@sunshield.com', '(555) 567-8901', '654 Protection Dr, Austin, TX');