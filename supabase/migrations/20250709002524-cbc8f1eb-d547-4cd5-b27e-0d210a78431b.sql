-- Create activity logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  entity_type TEXT NOT NULL, -- 'order', 'refund', 'customer', etc.
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  ip_address INET,
  user_agent TEXT,
  business_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for activity logs
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type_id ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_business_id ON public.activity_logs(business_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable RLS for activity logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity logs
CREATE POLICY "Managers and office can view activity logs" 
ON public.activity_logs FOR SELECT 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs FOR INSERT 
WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_changes_summary TEXT DEFAULT NULL,
  p_business_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  current_business_id UUID;
BEGIN
  -- Get business_id if not provided
  IF p_business_id IS NULL THEN
    SELECT ubm.business_id INTO current_business_id
    FROM public.user_business_memberships ubm
    WHERE ubm.user_id = auth.uid() AND ubm.is_active = true
    LIMIT 1;
  ELSE
    current_business_id := p_business_id;
  END IF;

  INSERT INTO public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    changes_summary,
    business_id
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_changes_summary,
    current_business_id
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Trigger function for automatic order logging
CREATE OR REPLACE FUNCTION public.log_order_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes_text TEXT := '';
  business_id_val UUID;
BEGIN
  -- Get business_id from store
  SELECT s.business_id INTO business_id_val
  FROM public.stores s
  WHERE s.id = COALESCE(NEW.store_id, OLD.store_id);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity(
      'create',
      'order',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      'Order created: ' || NEW.order_number,
      business_id_val
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Build changes summary
    IF OLD.user_id != NEW.user_id THEN
      changes_text := changes_text || 'Salesperson changed; ';
    END IF;
    IF OLD.customer_id != NEW.customer_id THEN
      changes_text := changes_text || 'Customer changed; ';
    END IF;
    IF OLD.total != NEW.total THEN
      changes_text := changes_text || 'Total amount changed; ';
    END IF;
    IF OLD.status != NEW.status THEN
      changes_text := changes_text || 'Status changed; ';
    END IF;
    
    PERFORM public.log_activity(
      'update',
      'order',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Order updated: ' || NEW.order_number || '. ' || changes_text,
      business_id_val
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity(
      'delete',
      'order',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      'Order deleted: ' || OLD.order_number,
      business_id_val
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for order logging
CREATE TRIGGER log_order_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_changes();

-- Trigger function for refund logging
CREATE OR REPLACE FUNCTION public.log_refund_changes()
RETURNS TRIGGER AS $$
DECLARE
  business_id_val UUID;
BEGIN
  business_id_val := COALESCE(NEW.store_id, OLD.store_id);
  
  -- Get business_id from store
  SELECT s.business_id INTO business_id_val
  FROM public.stores s
  WHERE s.id = business_id_val;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity(
      'create',
      'refund',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      'Refund created: ' || NEW.refund_number,
      business_id_val
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_activity(
      'update',
      'refund',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Refund updated: ' || NEW.refund_number,
      business_id_val
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity(
      'delete',
      'refund',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      'Refund deleted: ' || OLD.refund_number,
      business_id_val
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for refund logging
CREATE TRIGGER log_refund_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.refunds
FOR EACH ROW EXECUTE FUNCTION public.log_refund_changes();