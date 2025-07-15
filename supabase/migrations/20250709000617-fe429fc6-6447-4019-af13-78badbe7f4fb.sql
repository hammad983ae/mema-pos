-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price NUMERIC(10,2),
  color TEXT DEFAULT '#3B82F6', -- for calendar display
  is_active BOOLEAN DEFAULT true,
  category TEXT,
  requires_deposit BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service providers junction table
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business hours table
CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  break_start_time TIME,
  break_end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, day_of_week)
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL, -- references user via profiles
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'walk_in')),
  appointment_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (appointment_type IN ('scheduled', 'walk_in', 'emergency')),
  total_price NUMERIC(10,2),
  deposit_paid NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  cancellation_reason TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment reminders table
CREATE TABLE public.appointment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('sms', 'email', 'push')),
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create availability overrides table (for time off, special hours, etc.)
CREATE TABLE public.availability_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID, -- if NULL, affects all providers
  override_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT false, -- false = unavailable, true = special availability
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Business members can manage services" ON public.services
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Customers can view active services" ON public.services
  FOR SELECT USING (is_active = true);

-- RLS Policies for service_providers
CREATE POLICY "Business members can manage service providers" ON public.service_providers
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS Policies for business_hours
CREATE POLICY "Business members can manage business hours" ON public.business_hours
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Anyone can view business hours" ON public.business_hours
  FOR SELECT USING (true);

-- RLS Policies for appointments
CREATE POLICY "Business members can manage appointments" ON public.appointments
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Providers can view their appointments" ON public.appointments
  FOR SELECT USING (provider_id = auth.uid());

CREATE POLICY "Customers can view their appointments" ON public.appointments
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for appointment_reminders
CREATE POLICY "Business members can manage reminders" ON public.appointment_reminders
  FOR ALL USING (
    appointment_id IN (
      SELECT id FROM public.appointments WHERE business_id IN (
        SELECT business_id FROM public.user_business_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- RLS Policies for availability_overrides
CREATE POLICY "Business members can manage availability overrides" ON public.availability_overrides
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their own availability" ON public.availability_overrides
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_appointments_date_time ON public.appointments(appointment_date, start_time);
CREATE INDEX idx_appointments_provider ON public.appointments(provider_id);
CREATE INDEX idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX idx_appointments_business ON public.appointments(business_id);
CREATE INDEX idx_appointment_reminders_time ON public.appointment_reminders(reminder_time);
CREATE INDEX idx_service_providers_user ON public.service_providers(user_id);
CREATE INDEX idx_availability_overrides_date ON public.availability_overrides(override_date);

-- Create triggers for updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON public.business_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_overrides_updated_at BEFORE UPDATE ON public.availability_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();