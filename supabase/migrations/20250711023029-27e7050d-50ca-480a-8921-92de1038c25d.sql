-- Create business invitations table
CREATE TABLE IF NOT EXISTS public.business_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, email)
);

-- Enable RLS on invitations
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Business members can view invitations" ON public.business_invitations;
CREATE POLICY "Business members can view invitations" 
ON public.business_invitations FOR SELECT 
USING (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "Managers can create invitations" ON public.business_invitations;
CREATE POLICY "Managers can create invitations" 
ON public.business_invitations FOR INSERT 
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
  )
);