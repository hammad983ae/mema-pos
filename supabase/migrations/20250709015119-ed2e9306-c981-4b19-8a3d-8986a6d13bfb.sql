-- Create table for announcement settings
CREATE TABLE public.announcement_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC,
  announcement_text TEXT NOT NULL,
  emoji TEXT DEFAULT '🎉',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pending sales announcements
CREATE TABLE public.pending_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sale_amount NUMERIC NOT NULL,
  salesperson_ids UUID[] NOT NULL,
  announcement_text TEXT NOT NULL,
  emoji TEXT DEFAULT '🎉',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies for announcement_settings
CREATE POLICY "Business members can view announcement settings"
ON public.announcement_settings FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage announcement settings"
ON public.announcement_settings FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager') 
  AND is_active = true
));

-- RLS policies for pending_announcements
CREATE POLICY "Business members can view pending announcements"
ON public.pending_announcements FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "System can create pending announcements"
ON public.pending_announcements FOR INSERT
WITH CHECK (true);

CREATE POLICY "Managers can approve/reject announcements"
ON public.pending_announcements FOR UPDATE
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
  AND role IN ('business_owner', 'manager') 
  AND is_active = true
));

-- Create indexes
CREATE INDEX idx_announcement_settings_business_id ON public.announcement_settings(business_id);
CREATE INDEX idx_pending_announcements_business_id ON public.pending_announcements(business_id);
CREATE INDEX idx_pending_announcements_status ON public.pending_announcements(status);

-- Create triggers for updated_at
CREATE TRIGGER update_announcement_settings_updated_at
BEFORE UPDATE ON public.announcement_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default announcement settings
INSERT INTO public.announcement_settings (business_id, min_amount, max_amount, announcement_text, emoji)
SELECT 
  b.id,
  1500.00,
  3999.99,
  'Great job {names}! Amazing sale of ${amount}! 💪',
  '🎉'
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcement_settings 
  WHERE business_id = b.id AND min_amount = 1500.00
);

INSERT INTO public.announcement_settings (business_id, min_amount, max_amount, announcement_text, emoji)
SELECT 
  b.id,
  4000.00,
  6000.00,
  'BOOM! {names} just crushed it with a ${amount} sale! 💥',
  '💥'
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcement_settings 
  WHERE business_id = b.id AND min_amount = 4000.00
);

-- Function to create pending announcement when order is completed
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

    -- Insert pending announcement
    INSERT INTO public.pending_announcements (
      business_id,
      order_id,
      sale_amount,
      salesperson_ids,
      announcement_text,
      emoji
    ) VALUES (
      business_id_val,
      NEW.id,
      NEW.total,
      ARRAY[NEW.user_id],
      announcement_text_final,
      announcement_setting.emoji
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for sales announcements
CREATE TRIGGER check_sales_announcements_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_sales_announcements();

-- Update channel_members RLS to allow managers to manage members
DROP POLICY IF EXISTS "Channel admins can manage members" ON public.channel_members;

CREATE POLICY "Channel admins and managers can manage members"
ON public.channel_members FOR ALL
USING (
  channel_id IN (
    SELECT channel_id FROM public.channel_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  channel_id IN (
    SELECT c.id FROM public.channels c
    WHERE c.business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  )
);

-- Make chat more accessible - allow all business members to join public channels
CREATE POLICY "Business members can join public channels"
ON public.channel_members FOR INSERT
WITH CHECK (
  channel_id IN (
    SELECT c.id FROM public.channels c
    WHERE c.type = 'public' 
    AND c.business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  AND user_id = auth.uid()
);