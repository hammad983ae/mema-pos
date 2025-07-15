-- Add POS PIN to profiles table for terminal access
ALTER TABLE public.profiles 
ADD COLUMN pos_pin TEXT;

-- Add constraint to ensure PIN is exactly 4 digits if provided
ALTER TABLE public.profiles 
ADD CONSTRAINT pos_pin_format 
CHECK (pos_pin IS NULL OR (pos_pin ~ '^[0-9]{4}$'));

-- Create index on pos_pin for faster lookups (but not unique since it can be NULL)
CREATE INDEX idx_profiles_pos_pin ON public.profiles(pos_pin) WHERE pos_pin IS NOT NULL;