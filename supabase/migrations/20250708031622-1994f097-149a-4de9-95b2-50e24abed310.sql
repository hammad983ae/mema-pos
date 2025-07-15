-- Phase 1: Core Database Schema for POS System

-- Create stores table for multi-location support
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_rate DECIMAL(5,4) DEFAULT 0.08875, -- Default NYC tax rate
  timezone TEXT DEFAULT 'America/New_York',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories(id),
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2), -- Cost for profit calculations
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  track_inventory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  skin_type TEXT, -- Specific to skincare business
  skin_concerns TEXT[], -- Array of concerns
  notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  visit_count INTEGER DEFAULT 0,
  last_visit_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for sales transactions
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  customer_id UUID REFERENCES public.customers(id),
  user_id UUID NOT NULL, -- Staff member who processed the sale
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tip_amount DECIMAL(10,2) DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'gift_card', 'store_credit')),
  payment_reference TEXT, -- Stripe payment intent ID or other reference
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table for line items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory table for store-specific stock levels
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  max_stock_level INTEGER,
  last_count_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing authenticated users to read/write for now)
-- In production, you'd want more restrictive policies based on user roles

-- Stores policies
CREATE POLICY "Authenticated users can view stores" ON public.stores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage stores" ON public.stores
  FOR ALL TO authenticated USING (true);

-- Product categories policies
CREATE POLICY "Anyone can view product categories" ON public.product_categories
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categories" ON public.product_categories
  FOR ALL TO authenticated USING (true);

-- Products policies
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true);

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true);

-- Orders policies
CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage orders" ON public.orders
  FOR ALL TO authenticated USING (true);

-- Order items policies
CREATE POLICY "Authenticated users can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage order items" ON public.order_items
  FOR ALL TO authenticated USING (true);

-- Inventory policies
CREATE POLICY "Authenticated users can view inventory" ON public.inventory
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage inventory" ON public.inventory
  FOR ALL TO authenticated USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
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

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default store
INSERT INTO public.stores (name, address, phone, email)
VALUES ('Downtown Flagship', '123 Beauty Street, New York, NY 10001', '(555) 123-4567', 'downtown@fielix.com');

-- Insert default product categories
INSERT INTO public.product_categories (name, description, display_order)
VALUES 
  ('Cleansers', 'Facial cleansers and cleansing products', 1),
  ('Serums', 'Treatment serums and concentrates', 2),
  ('Moisturizers', 'Daily and night moisturizers', 3),
  ('Sun Protection', 'Sunscreens and UV protection', 4),
  ('Tools & Devices', 'Beauty tools and skincare devices', 5),
  ('Treatment Packages', 'Bundled treatment packages', 6);

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD((
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)
    ), 0) + 1
    FROM public.orders 
    WHERE order_number LIKE 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-%'
  )::TEXT, 4, '0') INTO new_number;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer totals after order completion
CREATE OR REPLACE FUNCTION public.update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE public.customers 
    SET 
      total_spent = total_spent + NEW.total,
      visit_count = visit_count + 1,
      last_visit_date = NEW.created_at,
      loyalty_points = loyalty_points + FLOOR(NEW.total) -- 1 point per dollar spent
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer totals
CREATE TRIGGER update_customer_totals_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_customer_totals();

-- Function to update inventory after order completion
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease inventory when order items are added
  UPDATE public.inventory
  SET quantity_on_hand = quantity_on_hand - NEW.quantity
  WHERE store_id = (SELECT store_id FROM public.orders WHERE id = NEW.order_id)
    AND product_id = NEW.product_id
    AND EXISTS (
      SELECT 1 FROM public.products 
      WHERE id = NEW.product_id AND track_inventory = true
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory on sales
CREATE TRIGGER update_inventory_on_sale_trigger
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_sale();