-- Add position_type to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS position_type TEXT CHECK (position_type IN ('opener', 'upseller'));

-- Add sales classification to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sale_type TEXT CHECK (sale_type IN ('open', 'upsell'));

-- Update sales_goals table to support role-specific goals
ALTER TABLE public.sales_goals 
ADD COLUMN IF NOT EXISTS position_type TEXT CHECK (position_type IN ('opener', 'upseller')),
ADD COLUMN IF NOT EXISTS target_count INTEGER, -- for counting opens/upsells instead of just amount
ADD COLUMN IF NOT EXISTS current_count INTEGER DEFAULT 0;

-- Create function to automatically classify sales
CREATE OR REPLACE FUNCTION public.classify_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Classify based on total amount
  IF NEW.total < 1000 THEN
    NEW.sale_type := 'open';
  ELSE
    NEW.sale_type := 'upsell';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically classify sales
DROP TRIGGER IF EXISTS classify_sale_trigger ON public.orders;
CREATE TRIGGER classify_sale_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.classify_sale();

-- Create function to update goal progress for opens/upsells
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  goal_record RECORD;
BEGIN
  -- Only process completed orders
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Find active goals for this user and sale type
    FOR goal_record IN 
      SELECT id, target_count, current_count
      FROM public.sales_goals 
      WHERE user_id = NEW.user_id 
        AND is_active = true
        AND position_type = (
          CASE 
            WHEN NEW.sale_type = 'open' THEN 'opener'
            WHEN NEW.sale_type = 'upsell' THEN 'upseller'
          END
        )
        AND start_date <= CURRENT_DATE 
        AND end_date >= CURRENT_DATE
    LOOP
      -- Update the count
      UPDATE public.sales_goals 
      SET current_count = current_count + 1
      WHERE id = goal_record.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update goal progress
DROP TRIGGER IF EXISTS update_goal_progress_trigger ON public.orders;
CREATE TRIGGER update_goal_progress_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_progress();

-- Create view for sales analytics by type
CREATE OR REPLACE VIEW public.sales_by_type AS
SELECT 
  o.user_id,
  p.full_name,
  pr.position_type,
  o.sale_type,
  COUNT(*) as total_sales,
  SUM(o.total) as total_amount,
  DATE_TRUNC('week', o.created_at) as week_start,
  DATE_TRUNC('month', o.created_at) as month_start
FROM public.orders o
JOIN public.profiles p ON p.user_id = o.user_id
LEFT JOIN public.profiles pr ON pr.user_id = o.user_id
WHERE o.status = 'completed'
GROUP BY o.user_id, p.full_name, pr.position_type, o.sale_type, 
         DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_sale_type ON public.orders(sale_type);
CREATE INDEX IF NOT EXISTS idx_orders_user_sale_type ON public.orders(user_id, sale_type);
CREATE INDEX IF NOT EXISTS idx_profiles_position_type ON public.profiles(position_type);
CREATE INDEX IF NOT EXISTS idx_sales_goals_position_type ON public.sales_goals(position_type);

-- Update existing orders to classify them
UPDATE public.orders 
SET sale_type = CASE 
  WHEN total < 1000 THEN 'open'
  ELSE 'upsell'
END 
WHERE sale_type IS NULL;