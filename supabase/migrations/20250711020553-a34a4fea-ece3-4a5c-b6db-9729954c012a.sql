-- Enhanced Security Tables for PCI DSS Compliance and Audit Trail

-- Create security_audit_logs table for enhanced audit trails
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- authentication, data_access, payment, system, admin
  severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
  ip_address INET,
  user_agent TEXT,
  resource_accessed TEXT,
  action_performed TEXT NOT NULL,
  outcome TEXT NOT NULL, -- success, failure, error
  error_details TEXT,
  metadata JSONB DEFAULT '{}',
  pci_relevant BOOLEAN DEFAULT false,
  risk_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_settings table for business security configurations
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL UNIQUE,
  
  -- PCI DSS Settings
  pci_compliance_enabled BOOLEAN DEFAULT true,
  encryption_at_rest BOOLEAN DEFAULT true,
  encryption_in_transit BOOLEAN DEFAULT true,
  card_data_retention_days INTEGER DEFAULT 0, -- 0 means no retention
  
  -- Access Control
  session_timeout_minutes INTEGER DEFAULT 480,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  password_min_length INTEGER DEFAULT 8,
  password_complexity_enabled BOOLEAN DEFAULT true,
  require_2fa BOOLEAN DEFAULT false,
  require_2fa_for_sensitive_ops BOOLEAN DEFAULT true,
  
  -- IP Restrictions
  ip_whitelist_enabled BOOLEAN DEFAULT false,
  allowed_ip_ranges TEXT[],
  geo_restrictions_enabled BOOLEAN DEFAULT false,
  allowed_countries TEXT[],
  
  -- Audit and Monitoring
  enhanced_audit_logging BOOLEAN DEFAULT true,
  real_time_monitoring BOOLEAN DEFAULT true,
  suspicious_activity_alerts BOOLEAN DEFAULT true,
  data_access_logging BOOLEAN DEFAULT true,
  
  -- Data Protection
  data_masking_enabled BOOLEAN DEFAULT true,
  automatic_data_purging BOOLEAN DEFAULT false,
  backup_encryption BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_security_profiles for individual user security settings
CREATE TABLE public.user_security_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_id UUID NOT NULL,
  
  -- Authentication
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  last_password_change TIMESTAMP WITH TIME ZONE,
  password_never_expires BOOLEAN DEFAULT false,
  
  -- Session Management
  concurrent_sessions_allowed INTEGER DEFAULT 3,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Risk Assessment
  risk_score INTEGER DEFAULT 0,
  security_clearance_level TEXT DEFAULT 'standard', -- standard, elevated, high
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_security_logs for PCI DSS compliance
CREATE TABLE public.payment_security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_id UUID,
  transaction_id UUID,
  
  -- Event Details
  event_type TEXT NOT NULL, -- card_entry, payment_process, refund, void
  card_type TEXT,
  masked_card_number TEXT, -- Only last 4 digits
  payment_method TEXT,
  amount DECIMAL(10,2),
  
  -- Security
  encryption_used BOOLEAN DEFAULT true,
  tokenization_used BOOLEAN DEFAULT true,
  compliance_flags TEXT[],
  
  -- Audit Trail
  processor_response_code TEXT,
  gateway_transaction_id TEXT,
  risk_assessment_score INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table for granular permission management
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  role_name TEXT NOT NULL,
  permission_category TEXT NOT NULL, -- pos, inventory, customers, reports, admin, security
  permission_name TEXT NOT NULL,
  access_level TEXT NOT NULL, -- none, read, write, admin
  conditions JSONB DEFAULT '{}', -- Additional conditions for the permission
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(business_id, role_name, permission_category, permission_name)
);

-- Create sensitive_data_access_logs for data access tracking
CREATE TABLE public.sensitive_data_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Data Access Details
  table_name TEXT NOT NULL,
  record_id UUID,
  fields_accessed TEXT[],
  access_type TEXT NOT NULL, -- select, insert, update, delete
  purpose TEXT, -- User-provided reason for access
  
  -- Context
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  api_endpoint TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitive_data_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_audit_logs
CREATE POLICY "Business members can view audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for security_settings
CREATE POLICY "Business members can view security settings" 
ON public.security_settings 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage security settings" 
ON public.security_settings 
FOR ALL 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for user_security_profiles
CREATE POLICY "Users can view their own security profile" 
ON public.user_security_profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team security profiles" 
ON public.user_security_profiles 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

CREATE POLICY "Users can update their own security profile" 
ON public.user_security_profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can manage security profiles" 
ON public.user_security_profiles 
FOR ALL 
USING (true);

-- RLS Policies for payment_security_logs
CREATE POLICY "Business members can view payment security logs" 
ON public.payment_security_logs 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "System can insert payment security logs" 
ON public.payment_security_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for role_permissions
CREATE POLICY "Business members can view role permissions" 
ON public.role_permissions 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for sensitive_data_access_logs
CREATE POLICY "Managers can view sensitive data access logs" 
ON public.sensitive_data_access_logs 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

CREATE POLICY "System can insert sensitive data access logs" 
ON public.sensitive_data_access_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_security_audit_logs_business_created ON public.security_audit_logs(business_id, created_at DESC);
CREATE INDEX idx_security_audit_logs_user_created ON public.security_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_pci_relevant ON public.security_audit_logs(pci_relevant) WHERE pci_relevant = true;

CREATE INDEX idx_payment_security_logs_business_created ON public.payment_security_logs(business_id, created_at DESC);
CREATE INDEX idx_payment_security_logs_transaction ON public.payment_security_logs(transaction_id);

CREATE INDEX idx_sensitive_data_access_business_created ON public.sensitive_data_access_logs(business_id, created_at DESC);
CREATE INDEX idx_sensitive_data_access_table_name ON public.sensitive_data_access_logs(table_name);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_business_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_event_type TEXT DEFAULT 'system',
  p_event_category TEXT DEFAULT 'system',
  p_action_performed TEXT DEFAULT '',
  p_outcome TEXT DEFAULT 'success',
  p_severity TEXT DEFAULT 'info',
  p_resource_accessed TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_pci_relevant BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  log_id UUID;
  client_ip INET;
  client_user_agent TEXT;
BEGIN
  -- Try to get client IP and user agent from current request context
  -- This would be set by the application when making the call
  client_ip := COALESCE((p_metadata->>'ip_address')::INET, NULL);
  client_user_agent := p_metadata->>'user_agent';

  INSERT INTO public.security_audit_logs (
    business_id,
    user_id,
    event_type,
    event_category,
    severity,
    ip_address,
    user_agent,
    resource_accessed,
    action_performed,
    outcome,
    metadata,
    pci_relevant
  ) VALUES (
    p_business_id,
    COALESCE(p_user_id, auth.uid()),
    p_event_type,
    p_event_category,
    p_severity,
    client_ip,
    client_user_agent,
    p_resource_accessed,
    p_action_performed,
    p_outcome,
    p_metadata,
    p_pci_relevant
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_security_profiles_updated_at
BEFORE UPDATE ON public.user_security_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();