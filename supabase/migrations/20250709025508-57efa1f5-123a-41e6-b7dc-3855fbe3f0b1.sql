-- Create function to auto-create default channels for a business
CREATE OR REPLACE FUNCTION public.create_default_channels_for_business()
RETURNS TRIGGER AS $$
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

  -- Create opener-specific chat
  INSERT INTO public.channels (
    business_id,
    name,
    type,
    category,
    description,
    created_by
  ) VALUES (
    NEW.id,
    'Openers Team',
    'public',
    'team',
    'Chat channel for openers to collaborate and share tips',
    NEW.owner_user_id
  );

  -- Create upseller-specific chat
  INSERT INTO public.channels (
    business_id,
    name,
    type,
    category,
    description,
    created_by
  ) VALUES (
    NEW.id,
    'Upsellers Team',
    'public',
    'team',
    'Chat channel for upsellers to collaborate and share strategies',
    NEW.owner_user_id
  );

  -- Create managers/leadership chat
  INSERT INTO public.channels (
    business_id,
    name,
    type,
    category,
    description,
    created_by
  ) VALUES (
    NEW.id,
    'Leadership Team',
    'private',
    'management',
    'Private chat for managers and business owners',
    NEW.owner_user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create channels when business is created
DROP TRIGGER IF EXISTS create_default_channels_trigger ON public.businesses;
CREATE TRIGGER create_default_channels_trigger
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_channels_for_business();

-- Create function to auto-add users to appropriate channels based on their role
CREATE OR REPLACE FUNCTION public.auto_add_user_to_channels()
RETURNS TRIGGER AS $$
DECLARE
  user_position TEXT;
  general_channel_id UUID;
  role_channel_id UUID;
  leadership_channel_id UUID;
BEGIN
  -- Get user's position type
  SELECT position_type INTO user_position
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- Add to general company chat (everyone gets added)
  SELECT id INTO general_channel_id
  FROM public.channels
  WHERE business_id = NEW.business_id
    AND category = 'general'
    AND type = 'public'
  LIMIT 1;

  IF general_channel_id IS NOT NULL THEN
    INSERT INTO public.channel_members (channel_id, user_id, role)
    VALUES (general_channel_id, NEW.user_id, 'member')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
  END IF;

  -- Add to role-specific channel based on position
  IF user_position = 'opener' THEN
    SELECT id INTO role_channel_id
    FROM public.channels
    WHERE business_id = NEW.business_id
      AND name = 'Openers Team'
      AND type = 'public'
    LIMIT 1;
  ELSIF user_position = 'upseller' THEN
    SELECT id INTO role_channel_id
    FROM public.channels
    WHERE business_id = NEW.business_id
      AND name = 'Upsellers Team'
      AND type = 'public'
    LIMIT 1;
  END IF;

  IF role_channel_id IS NOT NULL THEN
    INSERT INTO public.channel_members (channel_id, user_id, role)
    VALUES (role_channel_id, NEW.user_id, 'member')
    ON CONFLICT (channel_id, user_id) DO NOTHING;
  END IF;

  -- Add managers and business owners to leadership chat
  IF NEW.role IN ('business_owner', 'manager') THEN
    SELECT id INTO leadership_channel_id
    FROM public.channels
    WHERE business_id = NEW.business_id
      AND name = 'Leadership Team'
      AND type = 'private'
    LIMIT 1;

    IF leadership_channel_id IS NOT NULL THEN
      INSERT INTO public.channel_members (channel_id, user_id, role)
      VALUES (leadership_channel_id, NEW.user_id, 
        CASE WHEN NEW.role = 'business_owner' THEN 'admin' ELSE 'member' END)
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-add users to channels when they join a business
DROP TRIGGER IF EXISTS auto_add_user_to_channels_trigger ON public.user_business_memberships;
CREATE TRIGGER auto_add_user_to_channels_trigger
  AFTER INSERT ON public.user_business_memberships
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.auto_add_user_to_channels();

-- Create function to handle position type updates and channel membership
CREATE OR REPLACE FUNCTION public.handle_position_type_change()
RETURNS TRIGGER AS $$
DECLARE
  business_id_val UUID;
  old_channel_id UUID;
  new_channel_id UUID;
BEGIN
  -- Get user's business ID
  SELECT business_id INTO business_id_val
  FROM public.user_business_memberships
  WHERE user_id = NEW.user_id AND is_active = true
  LIMIT 1;

  IF business_id_val IS NULL THEN
    RETURN NEW;
  END IF;

  -- Remove from old position-specific channel if position changed
  IF OLD.position_type IS DISTINCT FROM NEW.position_type THEN
    -- Remove from old channel
    IF OLD.position_type = 'opener' THEN
      SELECT id INTO old_channel_id
      FROM public.channels
      WHERE business_id = business_id_val AND name = 'Openers Team';
    ELSIF OLD.position_type = 'upseller' THEN
      SELECT id INTO old_channel_id
      FROM public.channels
      WHERE business_id = business_id_val AND name = 'Upsellers Team';
    END IF;

    IF old_channel_id IS NOT NULL THEN
      DELETE FROM public.channel_members
      WHERE channel_id = old_channel_id AND user_id = NEW.user_id;
    END IF;

    -- Add to new channel
    IF NEW.position_type = 'opener' THEN
      SELECT id INTO new_channel_id
      FROM public.channels
      WHERE business_id = business_id_val AND name = 'Openers Team';
    ELSIF NEW.position_type = 'upseller' THEN
      SELECT id INTO new_channel_id
      FROM public.channels
      WHERE business_id = business_id_val AND name = 'Upsellers Team';
    END IF;

    IF new_channel_id IS NOT NULL THEN
      INSERT INTO public.channel_members (channel_id, user_id, role)
      VALUES (new_channel_id, NEW.user_id, 'member')
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position type changes
DROP TRIGGER IF EXISTS handle_position_type_change_trigger ON public.profiles;
CREATE TRIGGER handle_position_type_change_trigger
  AFTER UPDATE OF position_type ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_position_type_change();

-- Add business owner to their own company channels when creating the business
INSERT INTO public.channel_members (channel_id, user_id, role)
SELECT c.id, b.owner_user_id, 'admin'
FROM public.channels c
JOIN public.businesses b ON b.id = c.business_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.channel_members cm 
  WHERE cm.channel_id = c.id AND cm.user_id = b.owner_user_id
);

-- Create default channels for existing businesses that don't have them
DO $$
DECLARE
  business_record RECORD;
BEGIN
  FOR business_record IN 
    SELECT b.id, b.name, b.owner_user_id
    FROM public.businesses b
    WHERE NOT EXISTS (
      SELECT 1 FROM public.channels c 
      WHERE c.business_id = b.id AND c.category = 'general'
    )
  LOOP
    -- Create general company chat
    INSERT INTO public.channels (
      business_id, name, type, category, description, created_by
    ) VALUES (
      business_record.id,
      business_record.name || ' - Team Chat',
      'public', 'general',
      'General company chat for all team members',
      business_record.owner_user_id
    );

    -- Create opener-specific chat
    INSERT INTO public.channels (
      business_id, name, type, category, description, created_by
    ) VALUES (
      business_record.id, 'Openers Team', 'public', 'team',
      'Chat channel for openers to collaborate and share tips',
      business_record.owner_user_id
    );

    -- Create upseller-specific chat
    INSERT INTO public.channels (
      business_id, name, type, category, description, created_by
    ) VALUES (
      business_record.id, 'Upsellers Team', 'public', 'team',
      'Chat channel for upsellers to collaborate and share strategies',
      business_record.owner_user_id
    );

    -- Create leadership chat
    INSERT INTO public.channels (
      business_id, name, type, category, description, created_by
    ) VALUES (
      business_record.id, 'Leadership Team', 'private', 'management',
      'Private chat for managers and business owners',
      business_record.owner_user_id
    );
  END LOOP;
END $$;