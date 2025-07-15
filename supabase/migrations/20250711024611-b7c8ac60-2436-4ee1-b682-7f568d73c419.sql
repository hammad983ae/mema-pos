-- Enable realtime functionality for existing tables only
-- Add tables to realtime publication and set replica identity

-- Enable replica identity for existing tables
ALTER TABLE public.businesses REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_business_memberships REPLICA IDENTITY FULL;
ALTER TABLE public.business_invitations REPLICA IDENTITY FULL;

-- Add existing tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_business_memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_invitations;

-- Create a notifications table for real-time app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID, -- NULL means notification is for all business members
  type TEXT NOT NULL, -- 'sale', 'goal_achieved', 'low_stock', 'schedule_change', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their business notifications" 
ON public.notifications FOR SELECT 
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND (user_id IS NULL OR user_id = auth.uid())
);

CREATE POLICY "Business members can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can update their notifications" 
ON public.notifications FOR UPDATE 
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Enable realtime on notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_business_user ON public.notifications(business_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(business_id, is_read, created_at DESC) WHERE is_read = false;

-- Create user presence table for real-time user status
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline', -- 'online', 'away', 'busy', 'offline'
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_page TEXT,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable RLS on user presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies for user presence
CREATE POLICY "Business members can view presence" 
ON public.user_presence FOR SELECT 
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can manage their presence" 
ON public.user_presence FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable realtime on user presence
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;