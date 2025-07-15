-- Add username field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Add constraint to ensure username is properly formatted (3-20 characters, alphanumeric + underscore)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format 
CHECK (username IS NULL OR (username ~ '^[a-zA-Z0-9_]{3,20}$'));

-- Create index on username for faster lookups
CREATE INDEX idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Function to check if username is available
CREATE OR REPLACE FUNCTION public.check_username_availability(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if username exists
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(check_username)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;