-- Add minimum_price column to products table for margin tracking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS minimum_price NUMERIC(10,2) DEFAULT 0.00;

-- Add some sample skincare products with realistic pricing
INSERT INTO public.products (name, price, minimum_price, description, sku, is_active, track_inventory, category_id) VALUES 
('Hydrating Vitamin C Serum', 89.99, 35.00, 'Advanced brightening serum with 20% Vitamin C for radiant skin', 'VC-SER-001', true, true, (SELECT id FROM public.product_categories WHERE name = 'Serums' LIMIT 1)),
('Anti-Aging Retinol Cream', 124.99, 45.00, 'Powerful night cream with retinol for fine lines and wrinkles', 'RET-CRM-002', true, true, (SELECT id FROM public.product_categories WHERE name = 'Moisturizers' LIMIT 1)),
('Gentle Hydrating Cleanser', 34.99, 15.00, 'Sulfate-free cleanser perfect for sensitive and dry skin', 'CLN-GEN-003', true, true, (SELECT id FROM public.product_categories WHERE name = 'Cleansers' LIMIT 1)),
('Luxury Gold Face Mask', 189.99, 85.00, 'Premium 24k gold infused anti-aging treatment mask', 'MSK-GLD-004', true, true, (SELECT id FROM public.product_categories WHERE name = 'Masks' LIMIT 1)),
('Daily SPF 50 Sunscreen', 28.99, 12.00, 'Broad spectrum protection with zinc oxide and titanium dioxide', 'SUN-DAY-005', true, true, (SELECT id FROM public.product_categories WHERE name = 'Sunscreen' LIMIT 1));

-- Insert default categories if they don't exist
INSERT INTO public.product_categories (name, business_id, created_by) 
SELECT name, (SELECT id FROM public.businesses LIMIT 1), (SELECT owner_user_id FROM public.businesses LIMIT 1)
FROM (VALUES 
  ('Serums'),
  ('Moisturizers'), 
  ('Cleansers'),
  ('Masks'),
  ('Sunscreen')
) AS categories(name)
WHERE NOT EXISTS (SELECT 1 FROM public.product_categories WHERE product_categories.name = categories.name);

-- Update existing sample products with minimum prices if they exist
UPDATE public.products 
SET minimum_price = CASE 
  WHEN name LIKE '%Cleanser%' THEN price * 0.4
  WHEN name LIKE '%Serum%' THEN price * 0.35  
  WHEN name LIKE '%Moisturizer%' THEN price * 0.45
  WHEN name LIKE '%Sunscreen%' THEN price * 0.42
  ELSE price * 0.4
END
WHERE minimum_price = 0.00 OR minimum_price IS NULL;