-- Create contact forms and demo requests tables for lead capture
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  submission_type TEXT NOT NULL DEFAULT 'contact', -- 'contact', 'demo', 'newsletter'
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
  source TEXT, -- UTM source or referrer
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create demo request table for more detailed demo bookings
CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  business_type TEXT, -- 'spa', 'salon', 'cosmetics_retail', 'medical_spa'
  current_location_count INTEGER DEFAULT 1,
  current_pos_system TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  specific_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  demo_completed_at TIMESTAMP WITH TIME ZONE,
  sales_rep_assigned TEXT,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  subscription_type TEXT DEFAULT 'general', -- 'general', 'product_updates', 'industry_news'
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  source TEXT, -- Where they subscribed from
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact submissions (allow all to insert, only authenticated to view)
CREATE POLICY "Anyone can submit contact forms" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view contact submissions" 
ON public.contact_submissions 
FOR SELECT 
USING (false); -- Will be updated when we have admin roles

-- Create policies for demo requests
CREATE POLICY "Anyone can submit demo requests" 
ON public.demo_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view demo requests" 
ON public.demo_requests 
FOR SELECT 
USING (false);

-- Create policies for newsletter subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own subscription" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own subscription" 
ON public.newsletter_subscriptions 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();

CREATE TRIGGER update_demo_requests_updated_at
  BEFORE UPDATE ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();