-- Fix the create_default_channels_for_business function to use valid categories
DROP FUNCTION IF EXISTS public.create_default_channels_for_business();

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