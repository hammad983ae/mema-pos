-- Create channels table for team communication
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'direct')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'departments', 'projects', 'alerts', 'social')),
  created_by UUID NOT NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, name)
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to UUID REFERENCES public.messages(id),
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel members table for private channels and permissions
CREATE TABLE public.channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(channel_id, user_id)
);

-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(message_id, user_id, emoji)
);

-- Enable Row Level Security
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
CREATE POLICY "Users can view channels in their business"
ON public.channels FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Managers can manage channels"
ON public.channels FOR ALL
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in accessible channels"
ON public.messages FOR SELECT
USING (
  channel_id IN (
    SELECT c.id FROM public.channels c
    LEFT JOIN public.channel_members cm ON c.id = cm.channel_id
    WHERE (
      -- Public channels in user's business
      (c.type = 'public' AND c.business_id IN (
        SELECT business_id FROM public.user_business_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      ))
      OR
      -- Private channels where user is a member
      (c.type = 'private' AND cm.user_id = auth.uid())
      OR
      -- Direct messages where user is involved
      (c.type = 'direct' AND cm.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can send messages to accessible channels"
ON public.messages FOR INSERT
WITH CHECK (
  channel_id IN (
    SELECT c.id FROM public.channels c
    LEFT JOIN public.channel_members cm ON c.id = cm.channel_id
    WHERE (
      -- Public channels in user's business
      (c.type = 'public' AND c.business_id IN (
        SELECT business_id FROM public.user_business_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      ))
      OR
      -- Private channels where user is a member
      (c.type = 'private' AND cm.user_id = auth.uid())
      OR
      -- Direct messages where user is involved
      (c.type = 'direct' AND cm.user_id = auth.uid())
    )
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Users can edit their own messages"
ON public.messages FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for channel members
CREATE POLICY "Users can view channel members for accessible channels"
ON public.channel_members FOR SELECT
USING (
  channel_id IN (
    SELECT c.id FROM public.channels c
    LEFT JOIN public.channel_members cm ON c.id = cm.channel_id
    WHERE (
      (c.type = 'public' AND c.business_id IN (
        SELECT business_id FROM public.user_business_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      ))
      OR
      (c.type IN ('private', 'direct') AND cm.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Channel admins can manage members"
ON public.channel_members FOR ALL
USING (
  channel_id IN (
    SELECT channel_id FROM public.channel_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for message reactions
CREATE POLICY "Users can manage reactions on accessible messages"
ON public.message_reactions FOR ALL
USING (
  message_id IN (
    SELECT m.id FROM public.messages m
    JOIN public.channels c ON m.channel_id = c.id
    LEFT JOIN public.channel_members cm ON c.id = cm.channel_id
    WHERE (
      (c.type = 'public' AND c.business_id IN (
        SELECT business_id FROM public.user_business_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      ))
      OR
      (c.type IN ('private', 'direct') AND cm.user_id = auth.uid())
    )
  )
);

-- Create indexes for performance
CREATE INDEX idx_channels_business_id ON public.channels(business_id);
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_channel_members_channel_id ON public.channel_members(channel_id);
CREATE INDEX idx_channel_members_user_id ON public.channel_members(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_channels_updated_at
BEFORE UPDATE ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default channels for existing businesses
INSERT INTO public.channels (business_id, name, description, type, category, created_by)
SELECT 
  b.id,
  'general',
  'General team discussions and announcements',
  'public',
  'general',
  b.owner_user_id
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels c 
  WHERE c.business_id = b.id AND c.name = 'general'
);

INSERT INTO public.channels (business_id, name, description, type, category, created_by)
SELECT 
  b.id,
  'random',
  'Casual conversations and team bonding',
  'public',
  'social',
  b.owner_user_id
FROM public.businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels c 
  WHERE c.business_id = b.id AND c.name = 'random'
);

-- Enable realtime for all chat tables
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;