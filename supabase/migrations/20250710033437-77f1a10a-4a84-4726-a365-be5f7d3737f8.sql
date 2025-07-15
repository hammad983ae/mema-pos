-- Add more customization fields to announcement_settings
ALTER TABLE public.announcement_settings 
ADD COLUMN title TEXT,
ADD COLUMN custom_message TEXT,
ADD COLUMN supports_gif BOOLEAN DEFAULT false,
ADD COLUMN gif_url TEXT;

-- Update existing announcement settings with titles and custom messages
UPDATE public.announcement_settings 
SET 
  title = 'Great Sale',
  custom_message = 'Great job guys keep going!'
WHERE min_amount = 1500.00;

UPDATE public.announcement_settings 
SET 
  title = 'BOOM',
  custom_message = 'Amazing work team! Keep crushing it!'
WHERE min_amount = 4000.00;

-- Create a higher tier announcement setting
INSERT INTO public.announcement_settings (business_id, min_amount, max_amount, announcement_text, emoji, title, custom_message)
SELECT 
  b.id,
  10000.00,
  NULL,
  'LEGENDARY SALE! {names} just made history with a ${amount} sale! 🔥',
  '🔥',
  'LEGENDARY',
  'This is absolutely incredible! You guys are legends!'
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcement_settings 
  WHERE business_id = b.id AND min_amount = 10000.00
);