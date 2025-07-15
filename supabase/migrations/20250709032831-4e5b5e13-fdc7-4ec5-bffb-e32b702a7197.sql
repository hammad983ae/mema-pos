-- Add minimum_price column to products table for margin tracking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS minimum_price NUMERIC(10,2) DEFAULT 0.00;

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