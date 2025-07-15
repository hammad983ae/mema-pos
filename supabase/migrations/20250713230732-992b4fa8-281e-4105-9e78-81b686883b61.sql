-- Add position_type column to business_invitations table for storing employee position types

-- Add position_type column to business_invitations table
ALTER TABLE public.business_invitations 
ADD COLUMN position_type TEXT CHECK (position_type IN ('opener', 'upseller') OR position_type IS NULL);

-- Add comment to explain the field
COMMENT ON COLUMN public.business_invitations.position_type IS 'Position type for employees (opener/upseller). Only applicable when role is employee.';