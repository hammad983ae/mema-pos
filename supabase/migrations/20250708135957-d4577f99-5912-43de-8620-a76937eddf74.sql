-- Add bio field to profiles table for employee information
ALTER TABLE public.profiles 
ADD COLUMN bio text;

-- Add index for better performance on bio searches if needed
CREATE INDEX IF NOT EXISTS idx_profiles_bio ON public.profiles USING gin(to_tsvector('english', bio)) WHERE bio IS NOT NULL;