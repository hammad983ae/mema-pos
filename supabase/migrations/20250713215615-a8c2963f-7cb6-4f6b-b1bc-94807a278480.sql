-- First, add some product categories
INSERT INTO public.product_categories (name, description, is_active)
VALUES 
  ('Electronics', 'Electronic devices and gadgets', true),
  ('Accessories', 'Phone and computer accessories', true),
  ('Appliances', 'Home and kitchen appliances', true)
ON CONFLICT (name) DO NOTHING;

-- Add sample products for testing (without business_id since it doesn't exist in the schema)
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

-- Create 10 sample employee profiles (these will be test accounts)
INSERT INTO public.profiles (id, username, full_name, email, position_type, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone, pin_hash)
SELECT 
  gen_random_uuid() as id,
  username, full_name, email, position_type, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone,
  crypt('1234', gen_salt('bf')) as pin_hash
FROM (VALUES
  ('john.manager', 'John Smith', 'john.manager@company.com', 'manager', '(555) 111-1111', '123 Manager St', 'New York', 'NY', '10001', 'Jane Smith', '(555) 111-1112'),
  ('sarah.cashier', 'Sarah Johnson', 'sarah.cashier@company.com', 'cashier', '(555) 222-2222', '456 Cashier Ave', 'New York', 'NY', '10002', 'Mike Johnson', '(555) 222-2223'),
  ('mike.opener', 'Mike Wilson', 'mike.opener@company.com', 'opener', '(555) 333-3333', '789 Opener Blvd', 'New York', 'NY', '10003', 'Lisa Wilson', '(555) 333-3334'),
  ('lisa.upseller', 'Lisa Brown', 'lisa.upseller@company.com', 'upseller', '(555) 444-4444', '321 Upseller Dr', 'New York', 'NY', '10004', 'Tom Brown', '(555) 444-4445'),
  ('tom.cashier', 'Tom Davis', 'tom.cashier@company.com', 'cashier', '(555) 555-5555', '654 Cashier Ln', 'New York', 'NY', '10005', 'Amy Davis', '(555) 555-5556'),
  ('amy.opener', 'Amy Garcia', 'amy.opener@company.com', 'opener', '(555) 666-6666', '987 Opener Way', 'New York', 'NY', '10006', 'Carlos Garcia', '(555) 666-6667'),
  ('carlos.upseller', 'Carlos Martinez', 'carlos.upseller@company.com', 'upseller', '(555) 777-7777', '147 Upseller St', 'New York', 'NY', '10007', 'Maria Martinez', '(555) 777-7778'),
  ('maria.cashier', 'Maria Rodriguez', 'maria.cashier@company.com', 'cashier', '(555) 888-8888', '258 Cashier Rd', 'New York', 'NY', '10008', 'Jose Rodriguez', '(555) 888-8889'),
  ('david.manager', 'David Lee', 'david.manager@company.com', 'manager', '(555) 999-9999', '369 Manager Ct', 'New York', 'NY', '10009', 'Susan Lee', '(555) 999-9990'),
  ('susan.cashier', 'Susan Taylor', 'susan.cashier@company.com', 'cashier', '(555) 000-0000', '741 Cashier Cir', 'New York', 'NY', '10010', 'David Taylor', '(555) 000-0001')
) as v(username, full_name, email, position_type, phone, address, city, state, zip_code, emergency_contact_name, emergency_contact_phone);

-- Create business memberships for the sample employees
INSERT INTO public.user_business_memberships (user_id, business_id, role, is_active)
SELECT 
  p.id as user_id,
  (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid() LIMIT 1) as business_id,
  CASE 
    WHEN p.position_type = 'manager' THEN 'manager'::user_role
    ELSE 'employee'::user_role
  END as role,
  true as is_active
FROM public.profiles p
WHERE p.email LIKE '%@company.com';

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