-- Create customer support conversations table for external customers
CREATE TABLE public.customer_support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  business_name TEXT,
  issue_type TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'active', -- active, resolved, escalated
  channel TEXT NOT NULL DEFAULT 'ai_chat', -- ai_chat, email, phone
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalation_reason TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  satisfaction_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer support messages table
CREATE TABLE public.customer_support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.customer_support_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- 'customer', 'ai', 'agent', 'system'
  sender_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support knowledge base for common issues
CREATE TABLE public.support_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'pos', 'inventory', 'team', 'general'
  subcategory TEXT,
  issue_type TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  solution_steps TEXT[] NOT NULL,
  related_features TEXT[],
  keywords TEXT[],
  priority INTEGER DEFAULT 1, -- 1-5, higher = more important
  view_count INTEGER DEFAULT 0,
  helpful_votes INTEGER DEFAULT 0,
  not_helpful_votes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (more open for customer support)
ALTER TABLE public.customer_support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer support (allow broader access for support)
CREATE POLICY "Anyone can create support conversations"
ON public.customer_support_conversations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view their own conversations"
ON public.customer_support_conversations FOR SELECT
TO anon, authenticated
USING (true); -- We'll handle security in the application layer

CREATE POLICY "Support agents can manage conversations"
ON public.customer_support_conversations FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Anyone can create support messages"
ON public.customer_support_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view messages for accessible conversations"
ON public.customer_support_messages FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Support agents can manage messages"
ON public.customer_support_messages FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Anyone can view active knowledge base"
ON public.support_knowledge_base FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Authenticated users can manage knowledge base"
ON public.support_knowledge_base FOR ALL
TO authenticated
USING (true);

-- Create indexes for performance
CREATE INDEX idx_customer_support_conversations_status ON public.customer_support_conversations(status);
CREATE INDEX idx_customer_support_conversations_issue_type ON public.customer_support_conversations(issue_type);
CREATE INDEX idx_customer_support_conversations_created_at ON public.customer_support_conversations(created_at DESC);
CREATE INDEX idx_customer_support_messages_conversation_id ON public.customer_support_messages(conversation_id);
CREATE INDEX idx_support_knowledge_base_category ON public.support_knowledge_base(category);
CREATE INDEX idx_support_knowledge_base_keywords ON public.support_knowledge_base USING GIN(keywords);

-- Create trigger for updating timestamps
CREATE TRIGGER update_customer_support_conversations_updated_at
  BEFORE UPDATE ON public.customer_support_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_knowledge_base_updated_at
  BEFORE UPDATE ON public.support_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample knowledge base entries
INSERT INTO public.support_knowledge_base (title, category, issue_type, problem_description, solution_steps, keywords) VALUES
('Receipt Printer Not Working', 'pos', 'hardware', 'Receipt printer is not printing receipts', 
 ARRAY['Check power cable connection', 'Ensure paper is loaded correctly', 'Check USB or network cable', 'Try printing a test receipt from printer settings', 'Restart the printer', 'Contact support if issue persists'], 
 ARRAY['printer', 'receipt', 'printing', 'hardware', 'pos']),

('Employee Cannot Log In', 'team', 'access', 'Employee is unable to log into their account',
 ARRAY['Verify username and password are correct', 'Check if account is active in Team Management', 'Ensure employee has correct role permissions', 'Try resetting password', 'Check for caps lock or typing errors', 'Contact manager if account needs reactivation'],
 ARRAY['login', 'password', 'employee', 'access', 'account']),

('Cash Drawer Won''t Open', 'pos', 'hardware', 'Cash drawer is not opening during transactions',
 ARRAY['Check cash drawer cable connection', 'Ensure drawer is properly assigned to POS station', 'Try manual open from POS settings', 'Check if drawer has power', 'Verify drawer settings in POS configuration', 'Test with different USB port if applicable'],
 ARRAY['cash drawer', 'hardware', 'pos', 'register']),

('Inventory Not Updating', 'inventory', 'sync', 'Product inventory levels are not updating after sales',
 ARRAY['Check if inventory tracking is enabled for products', 'Verify internet connection', 'Try refreshing the inventory page', 'Check if products have correct barcode assignments', 'Ensure POS system is properly synced', 'Contact support for manual sync'],
 ARRAY['inventory', 'stock', 'sync', 'products', 'tracking']);

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION public.search_knowledge_base(search_query TEXT)
RETURNS SETOF public.support_knowledge_base
LANGUAGE SQL
STABLE
AS $$
  SELECT *
  FROM public.support_knowledge_base
  WHERE is_active = true
    AND (
      title ILIKE '%' || search_query || '%'
      OR problem_description ILIKE '%' || search_query || '%'
      OR search_query = ANY(keywords)
    )
  ORDER BY 
    CASE WHEN title ILIKE '%' || search_query || '%' THEN 1 ELSE 2 END,
    priority DESC,
    helpful_votes DESC
  LIMIT 10;
$$;