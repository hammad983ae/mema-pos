-- Update the POS PIN format constraint to accept 6-digit PINs instead of 4-digit
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS pos_pin_format;

ALTER TABLE public.profiles 
ADD CONSTRAINT pos_pin_format 
CHECK (pos_pin IS NULL OR pos_pin ~ '^[0-9]{6}$');