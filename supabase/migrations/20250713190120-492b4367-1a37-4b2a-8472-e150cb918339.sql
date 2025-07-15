-- Fix role assignment and profile handling
-- Update the handle_new_user function to properly create profiles with names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, email)
  VALUES (
    NEW.id, 
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Business Owner'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create function to auto-assign business owner role when creating first business
CREATE OR REPLACE FUNCTION public.auto_assign_business_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create membership for the business owner with proper role
  INSERT INTO public.user_business_memberships (
    user_id,
    business_id,
    role,
    is_active
  ) VALUES (
    NEW.owner_user_id,
    NEW.id,
    'business_owner'::user_role,
    true
  )
  ON CONFLICT (user_id, business_id) 
  DO UPDATE SET 
    role = 'business_owner'::user_role,
    is_active = true;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger and recreate with proper name
DROP TRIGGER IF EXISTS on_business_created ON public.businesses;
CREATE TRIGGER on_business_created
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_business_owner();