-- Add shipping field to order_items table
ALTER TABLE public.order_items 
ADD COLUMN shipping_required BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.order_items.shipping_required IS 'Whether this item needs to be shipped to the customer';

-- Function to automatically create shipping requests for shipped items
CREATE OR REPLACE FUNCTION public.create_shipping_requests_for_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  business_id_val UUID;
  customer_record RECORD;
  shipped_items RECORD;
  shipping_request_id UUID;
  items_description TEXT;
  total_value NUMERIC;
BEGIN
  -- Only process completed orders
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get business_id from store
  SELECT s.business_id INTO business_id_val
  FROM public.stores s
  WHERE s.id = NEW.store_id;

  -- Check if there are any items that need shipping
  SELECT COUNT(*) > 0 INTO shipped_items
  FROM public.order_items oi
  WHERE oi.order_id = NEW.id AND oi.shipping_required = true;

  -- If no items need shipping, return
  IF NOT shipped_items THEN
    RETURN NEW;
  END IF;

  -- Get customer information
  SELECT * INTO customer_record
  FROM public.customers c
  WHERE c.id = NEW.customer_id;

  -- If no customer record, can't create shipping request
  IF customer_record.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate total value and create description of shipped items
  SELECT 
    SUM(oi.total_price),
    STRING_AGG(p.name || ' (Qty: ' || oi.quantity || ')', ', ')
  INTO total_value, items_description
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.id AND oi.shipping_required = true;

  -- Create shipping request
  INSERT INTO public.shipping_requests (
    business_id,
    employee_id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    city,
    state,
    zip_code,
    country,
    items_description,
    estimated_value,
    priority,
    shipping_method,
    notes,
    order_reference
  ) VALUES (
    business_id_val,
    NEW.user_id,
    customer_record.id,
    COALESCE(customer_record.first_name || ' ' || customer_record.last_name, 'Customer'),
    customer_record.email,
    customer_record.phone,
    customer_record.address_line_1,
    customer_record.city,
    customer_record.state_province,
    customer_record.postal_code,
    COALESCE(customer_record.country, 'United States'),
    items_description,
    total_value,
    'standard',
    'ground',
    'Auto-generated from order #' || NEW.order_number,
    NEW.order_number
  ) RETURNING id INTO shipping_request_id;

  -- Create individual shipping items
  INSERT INTO public.shipping_request_items (
    shipping_request_id,
    product_name,
    quantity,
    unit_price,
    total_price,
    description
  )
  SELECT 
    shipping_request_id,
    p.name,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    p.description
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.id AND oi.shipping_required = true;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic shipping request creation
DROP TRIGGER IF EXISTS create_shipping_requests_trigger ON public.orders;
CREATE TRIGGER create_shipping_requests_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_shipping_requests_for_order();

-- Add order_reference field to shipping_requests for tracking
ALTER TABLE public.shipping_requests 
ADD COLUMN IF NOT EXISTS order_reference TEXT;