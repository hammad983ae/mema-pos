-- Enable realtime functionality for key tables
-- Add tables to realtime publication and set replica identity

-- Enable replica identity for tables to capture complete row data
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.inventory REPLICA IDENTITY FULL;
ALTER TABLE public.user_business_memberships REPLICA IDENTITY FULL;
ALTER TABLE public.timesheets REPLICA IDENTITY FULL;
ALTER TABLE public.sales_goals REPLICA IDENTITY FULL;
ALTER TABLE public.commission_payments REPLICA IDENTITY FULL;
ALTER TABLE public.team_messages REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.pending_announcements REPLICA IDENTITY FULL;
ALTER TABLE public.low_stock_alerts REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_business_memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.timesheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commission_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.low_stock_alerts;

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

-- Create a function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;

-- Create user presence table for real-time user status
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID NOT NULL UNIQUE,
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

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();