
-- Create task templates table
CREATE TABLE public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'general', -- 'opening', 'closing', 'maintenance', 'general', 'daily', 'weekly'
  estimated_duration INTEGER, -- in minutes
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  instructions TEXT,
  required_roles TEXT[] DEFAULT ARRAY['employee'], -- roles that can be assigned this task
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task assignments table
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.task_templates(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL, -- user assigned to the task
  assigned_by UUID NOT NULL, -- user who assigned the task
  store_id UUID, -- specific store if applicable
  due_date DATE,
  due_time TIME,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  recurring_type TEXT, -- 'none', 'daily', 'weekly', 'monthly'
  recurring_days INTEGER[], -- days of week for weekly recurring (1=Monday, 7=Sunday)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklists table
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  checklist_type TEXT NOT NULL, -- 'opening', 'closing', 'maintenance', 'custom'
  store_id UUID, -- specific store or null for all stores
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist items table
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  requires_photo BOOLEAN DEFAULT false,
  requires_note BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task completions table
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.task_assignments(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL,
  business_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  photo_url TEXT,
  duration_minutes INTEGER, -- actual time taken
  quality_score INTEGER, -- 1-5 rating if applicable
  verified_by UUID, -- supervisor verification
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance schedules table
CREATE TABLE public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  store_id UUID,
  equipment_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL, -- 'preventive', 'corrective', 'inspection'
  description TEXT,
  frequency_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  frequency_interval INTEGER DEFAULT 1, -- every X intervals
  next_due_date DATE NOT NULL,
  assigned_to UUID,
  priority TEXT DEFAULT 'medium',
  estimated_duration INTEGER,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_task_assignments_assigned_to ON public.task_assignments(assigned_to);
CREATE INDEX idx_task_assignments_due_date ON public.task_assignments(due_date);
CREATE INDEX idx_task_assignments_status ON public.task_assignments(status);
CREATE INDEX idx_task_assignments_business ON public.task_assignments(business_id);
CREATE INDEX idx_task_completions_completed_by ON public.task_completions(completed_by);
CREATE INDEX idx_task_completions_completed_at ON public.task_completions(completed_at);
CREATE INDEX idx_maintenance_schedules_next_due ON public.maintenance_schedules(next_due_date);
CREATE INDEX idx_maintenance_schedules_assigned_to ON public.maintenance_schedules(assigned_to);

-- Enable RLS on all task tables
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_templates
CREATE POLICY "Managers can manage task templates" 
ON public.task_templates FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view task templates in their business" 
ON public.task_templates FOR SELECT 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.is_active = true
));

-- RLS Policies for task_assignments
CREATE POLICY "Managers can manage task assignments" 
ON public.task_assignments FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view their assigned tasks" 
ON public.task_assignments FOR SELECT 
USING (assigned_to = auth.uid());

CREATE POLICY "Users can update their assigned tasks" 
ON public.task_assignments FOR UPDATE 
USING (assigned_to = auth.uid());

-- RLS Policies for checklists
CREATE POLICY "Managers can manage checklists" 
ON public.checklists FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view checklists in their business" 
ON public.checklists FOR SELECT 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.is_active = true
));

-- RLS Policies for checklist_items
CREATE POLICY "Users can view checklist items for accessible checklists" 
ON public.checklist_items FOR SELECT 
USING (checklist_id IN (
  SELECT id FROM public.checklists
  WHERE business_id IN (
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.is_active = true
  )
));

CREATE POLICY "Managers can manage checklist items" 
ON public.checklist_items FOR ALL 
USING (checklist_id IN (
  SELECT id FROM public.checklists
  WHERE business_id IN (
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
      AND user_business_memberships.is_active = true
  )
));

-- RLS Policies for task_completions
CREATE POLICY "Users can manage their task completions" 
ON public.task_completions FOR ALL 
USING (completed_by = auth.uid());

CREATE POLICY "Managers can view team task completions" 
ON public.task_completions FOR SELECT 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

-- RLS Policies for maintenance_schedules
CREATE POLICY "Managers can manage maintenance schedules" 
ON public.maintenance_schedules FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view maintenance schedules in their business" 
ON public.maintenance_schedules FOR SELECT 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Assigned users can update maintenance schedules" 
ON public.maintenance_schedules FOR UPDATE 
USING (assigned_to = auth.uid());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_task_templates_updated_at
BEFORE UPDATE ON public.task_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_assignments_updated_at
BEFORE UPDATE ON public.task_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
BEFORE UPDATE ON public.checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
BEFORE UPDATE ON public.maintenance_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default task templates
INSERT INTO public.task_templates (business_id, name, description, task_type, estimated_duration, priority, instructions, created_by)
SELECT 
  b.id,
  unnest(ARRAY[
    'Store Opening Checklist',
    'Store Closing Checklist',
    'Weekly Inventory Count',
    'Daily Sales Report',
    'Customer Area Cleaning',
    'Equipment Maintenance Check'
  ]),
  unnest(ARRAY[
    'Complete all opening procedures to prepare store for customers',
    'Complete all closing procedures to secure store for the night',
    'Perform weekly inventory count for assigned sections',
    'Generate and submit daily sales performance report',
    'Clean and organize customer areas including fitting rooms',
    'Perform routine maintenance checks on store equipment'
  ]),
  unnest(ARRAY['opening', 'closing', 'weekly', 'daily', 'daily', 'maintenance']),
  unnest(ARRAY[30, 45, 120, 15, 60, 90]),
  unnest(ARRAY['high', 'high', 'medium', 'medium', 'medium', 'medium']),
  unnest(ARRAY[
    'Follow store opening checklist completely. Ensure all systems are operational.',
    'Follow store closing checklist completely. Ensure all areas are secured.',
    'Count inventory systematically. Report any discrepancies immediately.',
    'Generate sales report from POS system. Submit to manager by end of shift.',
    'Clean all customer areas thoroughly. Restock supplies as needed.',
    'Check all equipment per maintenance schedule. Report any issues immediately.'
  ]),
  b.owner_user_id
FROM public.businesses b;

-- Insert default checklists
INSERT INTO public.checklists (business_id, name, checklist_type, created_by)
SELECT 
  b.id,
  unnest(ARRAY[
    'Daily Opening Procedures',
    'Daily Closing Procedures',
    'Equipment Maintenance',
    'Safety Inspection'
  ]),
  unnest(ARRAY['opening', 'closing', 'maintenance', 'maintenance']),
  b.owner_user_id
FROM public.businesses b;

-- Insert default checklist items for opening procedures
INSERT INTO public.checklist_items (checklist_id, item_text, description, display_order, is_required)
SELECT 
  c.id,
  unnest(ARRAY[
    'Unlock store entrance',
    'Turn on all lights',
    'Check security system',
    'Start POS system',
    'Count opening cash drawer',
    'Check store temperature',
    'Unlock fitting rooms',
    'Check restroom supplies'
  ]),
  unnest(ARRAY[
    'Unlock main entrance and check for any overnight issues',
    'Turn on all interior and exterior lighting',
    'Disable security system and check for any alerts',
    'Boot up POS system and verify connectivity',
    'Count cash drawer and verify opening amount',
    'Adjust temperature to comfortable level',
    'Unlock and check fitting room areas',
    'Ensure restrooms are stocked and clean'
  ]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8]),
  true
FROM public.checklists c
WHERE c.name = 'Daily Opening Procedures';

-- Insert default checklist items for closing procedures
INSERT INTO public.checklist_items (checklist_id, item_text, description, display_order, is_required)
SELECT 
  c.id,
  unnest(ARRAY[
    'Complete final sales count',
    'Clean all surfaces',
    'Empty trash bins',
    'Check fitting rooms',
    'Turn off equipment',
    'Count closing cash drawer',
    'Set security system',
    'Lock all entrances'
  ]),
  unnest(ARRAY[
    'Process all final sales and close registers',
    'Clean all customer areas and employee spaces',
    'Empty all trash bins and replace liners',
    'Check fitting rooms for left items and clean',
    'Turn off all non-essential equipment',
    'Count cash drawer and prepare deposit',
    'Arm security system before leaving',
    'Lock all doors and verify security'
  ]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 8]),
  true
FROM public.checklists c
WHERE c.name = 'Daily Closing Procedures';
