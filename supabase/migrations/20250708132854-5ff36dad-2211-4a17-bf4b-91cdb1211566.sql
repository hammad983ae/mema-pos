-- Add invitation code to businesses table
ALTER TABLE public.businesses 
ADD COLUMN invitation_code TEXT UNIQUE;

-- Generate unique invitation codes for existing businesses
UPDATE public.businesses 
SET invitation_code = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8))
WHERE invitation_code IS NULL;

-- Make invitation_code required for new businesses
ALTER TABLE public.businesses 
ALTER COLUMN invitation_code SET NOT NULL;

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.businesses 
    WHERE invitation_code = code;
    
    -- Exit loop if unique
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;