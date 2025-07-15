-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  voice_duration INTEGER,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '[]'::JSONB,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their channels" 
ON public.messages 
FOR SELECT 
USING (
  channel_id IN (
    SELECT cm.channel_id 
    FROM public.channel_members cm 
    WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their channels" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  channel_id IN (
    SELECT cm.channel_id 
    FROM public.channel_members cm 
    WHERE cm.user_id = auth.uid()
  ) AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add replica identity for realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;