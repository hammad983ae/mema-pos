-- Create customer visits table for detailed visit tracking
CREATE TABLE public.customer_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visit_type TEXT NOT NULL DEFAULT 'service', -- service, consultation, purchase_only
  services_provided TEXT[],
  products_purchased UUID[], -- array of product IDs
  total_spent NUMERIC DEFAULT 0.00,
  visit_duration INTEGER, -- in minutes
  staff_member UUID, -- who served the customer
  notes TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer preferences table
CREATE TABLE public.customer_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  preference_category TEXT NOT NULL, -- product_type, service_type, appointment_time, communication
  preference_value TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, preference_category)
);

-- Create customer communications table for tracking interactions
CREATE TABLE public.customer_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL, -- email, sms, phone, in_person
  direction TEXT NOT NULL DEFAULT 'outbound', -- inbound, outbound
  subject TEXT,
  content TEXT,
  sent_by UUID, -- staff member who sent it
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_received BOOLEAN DEFAULT false,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_customer_visits_customer_id ON public.customer_visits(customer_id);
CREATE INDEX idx_customer_visits_business_id ON public.customer_visits(business_id);
CREATE INDEX idx_customer_visits_visit_date ON public.customer_visits(visit_date);
CREATE INDEX idx_customer_preferences_customer_id ON public.customer_preferences(customer_id);
CREATE INDEX idx_customer_communications_customer_id ON public.customer_communications(customer_id);

-- Add triggers for updated_at
CREATE TRIGGER update_customer_visits_updated_at
  BEFORE UPDATE ON public.customer_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_preferences_updated_at
  BEFORE UPDATE ON public.customer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customer_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can manage customer visits"
  ON public.customer_visits FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage customer preferences"
  ON public.customer_preferences FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage customer communications"
  ON public.customer_communications FOR ALL
  TO authenticated
  USING (true);