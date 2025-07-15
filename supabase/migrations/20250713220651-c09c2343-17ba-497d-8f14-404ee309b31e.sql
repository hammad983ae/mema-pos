-- First, add some product categories
INSERT INTO public.product_categories (name, description)
VALUES 
  ('Electronics', 'Electronic devices and gadgets'),
  ('Accessories', 'Phone and computer accessories'),
  ('Appliances', 'Home and kitchen appliances')
ON CONFLICT (name) DO NOTHING;

-- Add sample products for testing
INSERT INTO public.products (name, description, price, cost, sku, barcode, category_id, track_inventory, is_active) 
SELECT 
  name, description, price, cost, sku, barcode, 
  (SELECT id FROM public.product_categories WHERE name = category LIMIT 1) as category_id,
  track_inventory, is_active
FROM (VALUES
  ('iPhone 15 Pro', 'Latest iPhone with Pro features', 999.99, 750.00, 'APPLE-IP15P', '123456789012', 'Electronics', true, true),
  ('Samsung Galaxy Buds', 'Wireless earbuds with noise cancellation', 149.99, 89.99, 'SAMSUNG-BUDS', '123456789013', 'Electronics', true, true),
  ('Coffee Maker', 'Programmable drip coffee maker', 79.99, 45.00, 'COFFEE-MAKER', '123456789014', 'Appliances', true, true),
  ('Bluetooth Speaker', 'Portable wireless speaker', 59.99, 35.00, 'BT-SPEAKER', '123456789015', 'Electronics', true, true),
  ('Wireless Charger', 'Fast wireless charging pad', 29.99, 18.00, 'WIRELESS-CHG', '123456789016', 'Electronics', true, true),
  ('Gaming Mouse', 'RGB gaming mouse with 7 buttons', 49.99, 28.00, 'GAMING-MOUSE', '123456789017', 'Electronics', true, true),
  ('USB-C Cable', '6ft braided USB-C charging cable', 19.99, 8.00, 'USBC-CABLE', '123456789018', 'Accessories', true, true),
  ('Phone Case', 'Clear protective phone case', 24.99, 12.00, 'PHONE-CASE', '123456789019', 'Accessories', true, true),
  ('Laptop Stand', 'Adjustable aluminum laptop stand', 39.99, 22.00, 'LAPTOP-STAND', '123456789020', 'Accessories', true, true),
  ('Power Bank', '10000mAh portable power bank', 34.99, 20.00, 'POWER-BANK', '123456789021', 'Electronics', true, true)
) as v(name, description, price, cost, sku, barcode, category, track_inventory, is_active);

-- Add 3 sample stores
INSERT INTO public.stores (name, email, phone, address, timezone, status, tax_rate, business_id)
SELECT 
  name, email, phone, address, timezone, status, tax_rate,
  (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid() LIMIT 1) as business_id
FROM (VALUES
  ('Downtown Store', 'downtown@company.com', '(555) 123-4567', '123 Main St, Downtown, NY 10001', 'America/New_York', 'active', 8.25),
  ('Mall Location', 'mall@company.com', '(555) 234-5678', '456 Shopping Center Blvd, Mall Plaza, NY 10002', 'America/New_York', 'active', 8.25),
  ('Airport Store', 'airport@company.com', '(555) 345-6789', '789 Airport Terminal Dr, Gate A12, NY 10003', 'America/New_York', 'active', 8.25)
) as v(name, email, phone, address, timezone, status, tax_rate);

-- Create basic employee profiles without position_type constraint issues
INSERT INTO public.profiles (user_id, username, full_name, email, phone, business_id)
SELECT 
  gen_random_uuid() as user_id,
  username, full_name, email, phone,
  (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid() LIMIT 1) as business_id
FROM (VALUES
  ('john.manager', 'John Smith', 'john.manager@company.com', '(555) 111-1111'),
  ('sarah.cashier', 'Sarah Johnson', 'sarah.cashier@company.com', '(555) 222-2222'),
  ('mike.opener', 'Mike Wilson', 'mike.opener@company.com', '(555) 333-3333'),
  ('lisa.upseller', 'Lisa Brown', 'lisa.upseller@company.com', '(555) 444-4444'),
  ('tom.cashier', 'Tom Davis', 'tom.cashier@company.com', '(555) 555-5555'),
  ('amy.opener', 'Amy Garcia', 'amy.opener@company.com', '(555) 666-6666'),
  ('carlos.upseller', 'Carlos Martinez', 'carlos.upseller@company.com', '(555) 777-7777'),
  ('maria.cashier', 'Maria Rodriguez', 'maria.cashier@company.com', '(555) 888-8888'),
  ('david.manager', 'David Lee', 'david.manager@company.com', '(555) 999-9999'),
  ('susan.cashier', 'Susan Taylor', 'susan.cashier@company.com', '(555) 000-0000')
) as v(username, full_name, email, phone);

-- Create business memberships for the sample employees
INSERT INTO public.user_business_memberships (user_id, business_id, role, is_active)
SELECT 
  p.user_id,
  (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid() LIMIT 1) as business_id,
  CASE 
    WHEN p.username LIKE '%.manager' THEN 'manager'::user_role
    ELSE 'employee'::user_role
  END as role,
  true as is_active
FROM public.profiles p
WHERE p.email LIKE '%@company.com'
  AND p.business_id = (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid() LIMIT 1);

-- Add inventory for products at all stores
INSERT INTO public.inventory (product_id, store_id, quantity_on_hand, low_stock_threshold, max_stock_level)
SELECT 
  p.id as product_id,
  s.id as store_id,
  CASE 
    WHEN pc.name = 'Electronics' THEN 25
    WHEN pc.name = 'Accessories' THEN 50
    ELSE 30
  END as quantity_on_hand,
  5 as low_stock_threshold,
  100 as max_stock_level
FROM public.products p
JOIN public.product_categories pc ON p.category_id = pc.id
CROSS JOIN public.stores s
WHERE s.business_id = (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid() LIMIT 1);