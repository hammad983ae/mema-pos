-- Create time punches table for clock in/out records
CREATE TABLE public.time_punches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  punch_type TEXT NOT NULL CHECK (punch_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
  punch_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  ip_address TEXT,
  notes TEXT,
  is_manual BOOLEAN DEFAULT false,
  manual_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timesheets table for weekly/period summaries
CREATE TABLE public.timesheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours DECIMAL(5, 2) DEFAULT 0,
  regular_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  break_hours DECIMAL(5, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  pay_rate DECIMAL(8, 2),
  total_pay DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

-- Create break records table for detailed break tracking
CREATE TABLE public.break_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  timesheet_id UUID REFERENCES public.timesheets(id) ON DELETE CASCADE,
  break_start TIMESTAMP WITH TIME ZONE NOT NULL,
  break_end TIMESTAMP WITH TIME ZONE,
  break_duration INTEGER, -- in minutes
  break_type TEXT DEFAULT 'lunch' CHECK (break_type IN ('lunch', 'break', 'other')),
  is_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work shifts table for scheduled vs actual tracking
CREATE TABLE public.work_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  late_minutes INTEGER DEFAULT 0,
  early_departure_minutes INTEGER DEFAULT 0,
  total_hours_worked DECIMAL(5, 2),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_time_punches_user_id ON public.time_punches(user_id);
CREATE INDEX idx_time_punches_business_id ON public.time_punches(business_id);
CREATE INDEX idx_time_punches_punch_time ON public.time_punches(punch_time);
CREATE INDEX idx_time_punches_punch_type ON public.time_punches(punch_type);
CREATE INDEX idx_timesheets_user_id ON public.timesheets(user_id);
CREATE INDEX idx_timesheets_business_id ON public.timesheets(business_id);
CREATE INDEX idx_timesheets_period ON public.timesheets(period_start, period_end);
CREATE INDEX idx_break_records_user_id ON public.break_records(user_id);
CREATE INDEX idx_work_shifts_user_id ON public.work_shifts(user_id);
CREATE INDEX idx_work_shifts_scheduled_start ON public.work_shifts(scheduled_start);

-- Add triggers for updated_at
CREATE TRIGGER update_time_punches_updated_at
  BEFORE UPDATE ON public.time_punches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timesheets_updated_at
  BEFORE UPDATE ON public.timesheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_break_records_updated_at
  BEFORE UPDATE ON public.break_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_shifts_updated_at
  BEFORE UPDATE ON public.work_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.time_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_punches
CREATE POLICY "Users can view their own time punches"
  ON public.time_punches FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own time punches"
  ON public.time_punches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can view team time punches"
  ON public.time_punches FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  );

CREATE POLICY "Managers can manage team time punches"
  ON public.time_punches FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  );

-- Create RLS policies for timesheets
CREATE POLICY "Users can view their own timesheets"
  ON public.timesheets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own timesheets"
  ON public.timesheets FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can view team timesheets"
  ON public.timesheets FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  );

CREATE POLICY "Managers can manage team timesheets"
  ON public.timesheets FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  );

-- Create RLS policies for break_records
CREATE POLICY "Users can manage their own break records"
  ON public.break_records FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can manage team break records"
  ON public.break_records FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  );

-- Create RLS policies for work_shifts
CREATE POLICY "Users can view their own work shifts"
  ON public.work_shifts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can manage team work shifts"
  ON public.work_shifts FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM user_business_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
    )
  );