-- Add missing fields to profiles table and create business membership for new users
-- First, let's add the missing fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS pos_pin TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS position_type TEXT DEFAULT 'employee';

-- Create user_business_memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_business_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS on user_business_memberships
ALTER TABLE public.user_business_memberships ENABLE ROW LEVEL SECURITY;

-- Create policies for user_business_memberships
CREATE POLICY "Users can view their own memberships" 
ON public.user_business_memberships FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Business owners can manage memberships" 
ON public.user_business_memberships FOR ALL
USING (
  business_id IN (
    SELECT id FROM public.businesses 
    WHERE owner_user_id = auth.uid()
  )
);

-- Create function to automatically create business membership for business owners
CREATE OR REPLACE FUNCTION public.create_business_owner_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Create membership for the business owner
  INSERT INTO public.user_business_memberships (
    user_id,
    business_id,
    role,
    is_active
  ) VALUES (
    NEW.owner_user_id,
    NEW.id,
    'business_owner',
    true
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create membership when business is created
DROP TRIGGER IF EXISTS create_owner_membership_trigger ON public.businesses;
CREATE TRIGGER create_owner_membership_trigger
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_business_owner_membership();