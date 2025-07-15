-- First, temporarily remove the constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS pos_pin_format;

-- Update existing 4-digit PINs to 6-digit PINs by padding with leading zeros
UPDATE public.profiles 
SET pos_pin = LPAD(pos_pin, 6, '0') 
WHERE pos_pin IS NOT NULL AND LENGTH(pos_pin) = 4;

-- Now add the new constraint for 6-digit PINs
ALTER TABLE public.profiles 
ADD CONSTRAINT pos_pin_format 
CHECK (pos_pin IS NULL OR pos_pin ~ '^[0-9]{6}$');