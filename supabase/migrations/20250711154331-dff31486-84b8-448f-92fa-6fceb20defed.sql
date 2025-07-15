-- Fix the channel creation trigger to bypass RLS during business setup
-- Create a security definer function to create default channels

CREATE OR REPLACE FUNCTION public.create_default_channels_for_business_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create general company chat
  INSERT INTO public.channels (
    business_id,
    name,
    type,
    category,
    description,
    created_by
  ) VALUES (
    NEW.id,
    NEW.name || ' - Team Chat',
    'public',
    'general',
    'General company chat for all team members',
    NEW.owner_user_id
  );

  -- Create announcements channel
  INSERT INTO public.channels (
    business_id,
    name,
    type,
    category,
    description,
    created_by
  ) VALUES (
    NEW.id,
    'Announcements',
    'public',
    'general',
    'Company announcements and updates',
    NEW.owner_user_id
  );

  -- Create sales team chat
  INSERT INTO public.channels (
    business_id,
    name,
    type,
    category,
    description,
    created_by
  ) VALUES (
    NEW.id,
    'Sales Team',
    'public',
    'general',
    'Chat channel for sales team collaboration',
    NEW.owner_user_id
  );

  RETURN NEW;
END;
$$;

-- Drop the old trigger
DROP TRIGGER IF EXISTS create_default_channels_for_business_trigger ON public.businesses;

-- Create new trigger with the security definer function
CREATE TRIGGER create_default_channels_for_business_trigger
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_channels_for_business_secure();