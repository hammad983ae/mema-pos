-- Create support requests table for tracking Fielix internal issues
CREATE TABLE public.support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_data JSONB NOT NULL,
  user_message TEXT,
  ai_diagnosis JSONB,
  status TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support chat messages for ongoing conversations
CREATE TABLE public.support_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'user', 'ai', 'agent'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system health logs
CREATE TABLE public.system_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component TEXT NOT NULL,
  health_score INTEGER NOT NULL, -- 0-100
  metrics JSONB NOT NULL,
  issues JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only authenticated users can access (internal use)
CREATE POLICY "Authenticated users can manage support requests"
ON public.support_requests FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage support chat"
ON public.support_chat_messages FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view system health"
ON public.system_health_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert health logs"
ON public.system_health_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_support_requests_status ON public.support_requests(status);
CREATE INDEX idx_support_requests_severity ON public.support_requests(severity);
CREATE INDEX idx_support_requests_category ON public.support_requests(category);
CREATE INDEX idx_support_chat_conversation ON public.support_chat_messages(conversation_id);
CREATE INDEX idx_system_health_component ON public.system_health_logs(component);
CREATE INDEX idx_system_health_created_at ON public.system_health_logs(created_at DESC);

-- Create trigger for updating timestamps
CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();