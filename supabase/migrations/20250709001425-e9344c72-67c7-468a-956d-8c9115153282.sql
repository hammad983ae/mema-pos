-- Create tables for enhanced POS features

-- Split payments table
CREATE TABLE public.split_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Returns/refunds table
CREATE TABLE public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  refund_number TEXT UNIQUE NOT NULL DEFAULT ('REF-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM now()) * 1000)::TEXT, 6, '0')),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  refund_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'partial', 'exchange'
  reason TEXT,
  total_refunded NUMERIC NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL, -- How refund is processed
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'cancelled'
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Refund items table
CREATE TABLE public.refund_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id UUID NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_refunded INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_refund_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transaction history view for easier querying
CREATE VIEW public.transaction_history AS
SELECT 
  o.id,
  o.order_number as transaction_number,
  'sale' as transaction_type,
  o.store_id,
  o.customer_id,
  o.user_id,
  o.total as amount,
  o.payment_method,
  o.status,
  o.created_at,
  o.updated_at
FROM public.orders o
WHERE o.status = 'completed'

UNION ALL

SELECT 
  r.id,
  r.refund_number as transaction_number,
  'refund' as transaction_type,
  r.store_id,
  r.customer_id,
  r.user_id,
  -r.total_refunded as amount,
  r.payment_method,
  r.status,
  r.created_at,
  r.updated_at
FROM public.refunds r
WHERE r.status = 'processed';

-- Enable RLS
ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for split_payments
CREATE POLICY "Authenticated users can manage split payments" 
ON public.split_payments FOR ALL 
USING (true);

-- RLS Policies for refunds
CREATE POLICY "Authenticated users can manage refunds" 
ON public.refunds FOR ALL 
USING (true);

-- RLS Policies for refund_items
CREATE POLICY "Authenticated users can manage refund items" 
ON public.refund_items FOR ALL 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_split_payments_updated_at
BEFORE UPDATE ON public.split_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to restore inventory on refunds
CREATE OR REPLACE FUNCTION public.handle_refund_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore inventory when refund items are processed
  IF NEW.refund_id IN (
    SELECT id FROM public.refunds 
    WHERE status = 'processed' AND OLD.refund_id = NEW.refund_id
  ) THEN
    UPDATE public.inventory
    SET quantity_on_hand = quantity_on_hand + NEW.quantity_refunded
    WHERE store_id = (SELECT store_id FROM public.refunds WHERE id = NEW.refund_id)
      AND product_id = NEW.product_id
      AND EXISTS (
        SELECT 1 FROM public.products 
        WHERE id = NEW.product_id AND track_inventory = true
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_refund_inventory_trigger
AFTER INSERT OR UPDATE ON public.refund_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_refund_inventory();