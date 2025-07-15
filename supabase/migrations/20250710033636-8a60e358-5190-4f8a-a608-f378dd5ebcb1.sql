-- Update the sales announcement trigger to include title and custom_message
CREATE OR REPLACE FUNCTION public.check_sales_announcements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  business_id_val UUID;
  announcement_setting RECORD;
  salesperson_names TEXT[];
  announcement_text_final TEXT;
BEGIN
  -- Only process completed orders
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get business_id from store
  SELECT s.business_id INTO business_id_val
  FROM public.stores s
  WHERE s.id = NEW.store_id;

  -- Find matching announcement setting
  SELECT * INTO announcement_setting
  FROM public.announcement_settings
  WHERE business_id = business_id_val
    AND is_active = true
    AND NEW.total >= min_amount
    AND (max_amount IS NULL OR NEW.total <= max_amount)
  ORDER BY min_amount DESC
  LIMIT 1;

  -- If we found a matching setting, create pending announcement
  IF announcement_setting.id IS NOT NULL THEN
    -- Get salesperson names
    SELECT ARRAY_AGG(COALESCE(p.full_name, 'Unknown')) INTO salesperson_names
    FROM public.profiles p
    WHERE p.user_id = ANY(ARRAY[NEW.user_id]);

    -- Replace placeholders in announcement text
    announcement_text_final := announcement_setting.announcement_text;
    announcement_text_final := REPLACE(announcement_text_final, '{names}', array_to_string(salesperson_names, ' & '));
    announcement_text_final := REPLACE(announcement_text_final, '{amount}', NEW.total::TEXT);

    -- Insert pending announcement with new fields
    INSERT INTO public.pending_announcements (
      business_id,
      order_id,
      sale_amount,
      salesperson_ids,
      announcement_text,
      emoji,
      title,
      custom_message
    ) VALUES (
      business_id_val,
      NEW.id,
      NEW.total,
      ARRAY[NEW.user_id],
      announcement_text_final,
      announcement_setting.emoji,
      announcement_setting.title,
      announcement_setting.custom_message
    );
  END IF;

  RETURN NEW;
END;
$$;