-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS create_default_channels_trigger ON public.businesses;

-- Drop and recreate the function with valid categories
DROP FUNCTION IF EXISTS public.create_default_channels_for_business() CASCADE;

CREATE OR REPLACE FUNCTION public.create_default_channels_for_business()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
$function$;

-- Recreate the trigger
CREATE TRIGGER create_default_channels_trigger
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_channels_for_business();