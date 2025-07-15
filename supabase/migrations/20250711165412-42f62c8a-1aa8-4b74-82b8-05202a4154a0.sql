-- Add missing pos_pin column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN pos_pin TEXT;

-- Add constraint to ensure pos_pin is properly formatted (4 digits)
ALTER TABLE public.profiles 
ADD CONSTRAINT pos_pin_format 
CHECK (pos_pin IS NULL OR (pos_pin ~ '^[0-9]{4}$'));

-- Create index on pos_pin for faster lookups
CREATE INDEX idx_profiles_pos_pin ON public.profiles(pos_pin) WHERE pos_pin IS NOT NULL;