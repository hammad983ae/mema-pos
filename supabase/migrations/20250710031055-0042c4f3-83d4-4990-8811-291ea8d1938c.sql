-- Create chargeback dispute management system
CREATE TABLE public.chargeback_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  case_number TEXT NOT NULL,
  transaction_id TEXT,
  transaction_date DATE NOT NULL,
  dispute_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  chargeback_reason TEXT NOT NULL,
  chargeback_date DATE NOT NULL,
  response_deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'submitted', 'won', 'lost', 'expired')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  bank_name TEXT,
  bank_contact_info TEXT,
  merchant_category_code TEXT,
  acquiring_bank TEXT,
  dispute_description TEXT,
  created_by UUID NOT NULL,
  assigned_to UUID,
  notes TEXT,
  ai_generated_response TEXT,
  final_response_sent TEXT,
  response_sent_date TIMESTAMP WITH TIME ZONE,
  outcome_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chargeback evidence/documents table
CREATE TABLE public.chargeback_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.chargeback_disputes(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'receipt', 'signature', 'authorization', 'delivery_proof', 
    'customer_communication', 'refund_policy', 'terms_conditions',
    'product_description', 'shipping_info', 'customer_id_verification',
    'previous_transactions', 'fraud_protection', 'other'
  )),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chargeback response templates table
CREATE TABLE public.chargeback_response_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  dispute_reason TEXT NOT NULL,
  template_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chargeback activity log table
CREATE TABLE public.chargeback_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.chargeback_disputes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'created', 'status_changed', 'assigned', 'evidence_added', 
    'response_generated', 'response_sent', 'notes_added', 'outcome_recorded'
  )),
  action_description TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chargeback_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargeback_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargeback_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chargeback_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chargeback disputes
CREATE POLICY "Business members can manage their disputes" 
ON public.chargeback_disputes 
FOR ALL 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create RLS policies for chargeback evidence
CREATE POLICY "Business members can manage evidence for their disputes" 
ON public.chargeback_evidence 
FOR ALL 
USING (dispute_id IN (
  SELECT id FROM public.chargeback_disputes 
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

-- Create RLS policies for templates
CREATE POLICY "Business members can manage their templates" 
ON public.chargeback_response_templates 
FOR ALL 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

-- Create RLS policies for activity log
CREATE POLICY "Business members can view activity for their disputes" 
ON public.chargeback_activity_log 
FOR SELECT 
USING (dispute_id IN (
  SELECT id FROM public.chargeback_disputes 
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

CREATE POLICY "Business members can add activity for their disputes" 
ON public.chargeback_activity_log 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  dispute_id IN (
    SELECT id FROM public.chargeback_disputes 
    WHERE business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Create storage bucket for chargeback evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chargeback-evidence', 'chargeback-evidence', false);

-- Create storage policies for chargeback evidence
CREATE POLICY "Business members can upload evidence" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chargeback-evidence' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business members can view their evidence" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chargeback-evidence' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business members can update their evidence" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chargeback-evidence' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business members can delete their evidence" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chargeback-evidence' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update updated_at timestamps
CREATE TRIGGER update_chargeback_disputes_updated_at
  BEFORE UPDATE ON public.chargeback_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chargeback_templates_updated_at
  BEFORE UPDATE ON public.chargeback_response_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log dispute activities
CREATE OR REPLACE FUNCTION public.log_chargeback_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.chargeback_activity_log (
      dispute_id, user_id, action_type, action_description, previous_value, new_value
    ) VALUES (
      NEW.id, auth.uid(), 'status_changed', 
      'Dispute status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status, NEW.status
    );
  END IF;
  
  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO public.chargeback_activity_log (
      dispute_id, user_id, action_type, action_description, previous_value, new_value
    ) VALUES (
      NEW.id, auth.uid(), 'assigned', 
      'Dispute assignment changed',
      COALESCE(OLD.assigned_to::text, 'unassigned'), 
      COALESCE(NEW.assigned_to::text, 'unassigned')
    );
  END IF;
  
  -- Log creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.chargeback_activity_log (
      dispute_id, user_id, action_type, action_description
    ) VALUES (
      NEW.id, auth.uid(), 'created', 'Chargeback dispute case created'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for activity logging
CREATE TRIGGER log_chargeback_dispute_activity
  AFTER INSERT OR UPDATE ON public.chargeback_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_chargeback_activity();