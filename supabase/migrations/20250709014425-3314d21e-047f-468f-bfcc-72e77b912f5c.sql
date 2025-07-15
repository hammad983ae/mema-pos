-- Add all active business members to public channels automatically
CREATE OR REPLACE FUNCTION public.add_business_members_to_public_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only add members to public channels
  IF NEW.type = 'public' THEN
    -- Add all active business members to the new channel
    INSERT INTO public.channel_members (channel_id, user_id, role)
    SELECT NEW.id, user_id, 'member'
    FROM public.user_business_memberships
    WHERE business_id = NEW.business_id
      AND is_active = true
      AND user_id != NEW.created_by; -- Don't add creator again (they're already admin)
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add business members to public channels
CREATE TRIGGER add_members_to_public_channel
  AFTER INSERT ON public.channels
  FOR EACH ROW
  EXECUTE FUNCTION public.add_business_members_to_public_channel();