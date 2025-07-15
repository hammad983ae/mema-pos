-- Fix username uniqueness to be per-business instead of platform-wide

-- First, drop the existing global unique constraint on username
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Add a composite unique constraint for username within each business
-- But first we need to add business_id to profiles if it doesn't exist
DO $$ 
BEGIN
    -- Check if business_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'business_id') THEN
        ALTER TABLE public.profiles ADD COLUMN business_id UUID REFERENCES public.businesses(id);
    END IF;
END $$;

-- Now create the composite unique constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_business_unique 
UNIQUE (username, business_id);

-- Update existing profiles to have business_id from their user_business_memberships
UPDATE public.profiles 
SET business_id = (
    SELECT ubm.business_id 
    FROM public.user_business_memberships ubm 
    WHERE ubm.user_id = profiles.user_id 
    AND ubm.is_active = true 
    LIMIT 1
)
WHERE business_id IS NULL;

-- Add index for better performance on username lookups within business
CREATE INDEX IF NOT EXISTS idx_profiles_business_username 
ON public.profiles (business_id, username) 
WHERE username IS NOT NULL;