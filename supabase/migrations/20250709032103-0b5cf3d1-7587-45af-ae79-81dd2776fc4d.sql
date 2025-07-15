-- Create employee invitations table for tracking invitation links
CREATE TABLE public.employee_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  invitation_token UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Managers can manage employee invitations"
ON public.employee_invitations
FOR ALL
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- Add first_login flag to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX idx_employee_invitations_token ON public.employee_invitations(invitation_token);
CREATE INDEX idx_employee_invitations_business ON public.employee_invitations(business_id);

-- Update trigger for timestamp
CREATE TRIGGER update_employee_invitations_updated_at
BEFORE UPDATE ON public.employee_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();