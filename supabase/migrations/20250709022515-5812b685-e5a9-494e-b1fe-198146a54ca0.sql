-- Create customer service conversations table
CREATE TABLE public.customer_service_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolution_notes TEXT,
  satisfaction_rating INTEGER,
  ai_summary TEXT
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.customer_service_conversations(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'customer', 'agent', 'ai'
  sender_id UUID,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM now())::TEXT, 6, '0'),
  conversation_id UUID REFERENCES public.customer_service_conversations(id),
  customer_id UUID REFERENCES public.customers(id),
  business_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT,
  assigned_to UUID,
  created_by UUID,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  ai_category_suggestion TEXT,
  ai_priority_suggestion TEXT,
  ai_suggested_responses JSONB DEFAULT '[]'
);

-- Enable RLS on all tables
ALTER TABLE public.customer_service_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_service_conversations
CREATE POLICY "Business members can view conversations"
ON public.customer_service_conversations FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Business members can manage conversations"
ON public.customer_service_conversations FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- RLS Policies for chat_messages
CREATE POLICY "Business members can view messages"
ON public.chat_messages FOR SELECT
USING (conversation_id IN (
  SELECT id FROM public.customer_service_conversations
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

CREATE POLICY "Business members can create messages"
ON public.chat_messages FOR INSERT
WITH CHECK (conversation_id IN (
  SELECT id FROM public.customer_service_conversations
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

-- RLS Policies for support_tickets
CREATE POLICY "Business members can view tickets"
ON public.support_tickets FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Business members can manage tickets"
ON public.support_tickets FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create indexes for better performance
CREATE INDEX idx_conversations_business_id ON public.customer_service_conversations(business_id);
CREATE INDEX idx_conversations_customer_id ON public.customer_service_conversations(customer_id);
CREATE INDEX idx_conversations_status ON public.customer_service_conversations(status);
CREATE INDEX idx_conversations_last_message_at ON public.customer_service_conversations(last_message_at DESC);

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

CREATE INDEX idx_support_tickets_business_id ON public.support_tickets(business_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_customer_id ON public.support_tickets(customer_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.customer_service_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
BEGIN
  SELECT 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD((
    SELECT COALESCE(MAX(
      CAST(SPLIT_PART(ticket_number, '-', 3) AS INTEGER)
    ), 0) + 1
    FROM public.support_tickets 
    WHERE ticket_number LIKE 'TKT-' || TO_CHAR(now(), 'YYYYMMDD') || '-%'
  )::TEXT, 4, '0') INTO new_number;
  
  RETURN new_number;
END;
$$;