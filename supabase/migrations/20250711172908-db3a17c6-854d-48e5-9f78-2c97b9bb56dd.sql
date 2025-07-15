-- Fix the channel creation trigger to handle existing channels gracefully
DROP TRIGGER IF EXISTS create_default_channels_for_business_trigger ON public.businesses;
DROP FUNCTION IF EXISTS public.create_default_channels_for_business_secure();

CREATE OR REPLACE FUNCTION public.create_default_channels_for_business_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create general company chat (only if it doesn't exist)
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
  )
  ON CONFLICT (business_id, name) DO NOTHING;

  -- Create announcements channel (only if it doesn't exist)
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
  )
  ON CONFLICT (business_id, name) DO NOTHING;

  -- Create sales team chat (only if it doesn't exist)
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
  )
  ON CONFLICT (business_id, name) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create new trigger with the fixed function
CREATE TRIGGER create_default_channels_for_business_trigger
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_channels_for_business_secure();