-- Ensure office role exists in the user_role enum
DO $$ 
BEGIN
    -- Check if office role already exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'user_role' AND e.enumlabel = 'office'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'office';
    END IF;
END $$;

-- Update RLS policies to include office role where managers have access
-- Update business_pos_settings policy
DROP POLICY IF EXISTS "Managers can manage POS settings" ON business_pos_settings;
CREATE POLICY "Managers and office can manage POS settings" 
ON business_pos_settings 
FOR ALL 
USING (user_can_access_business(business_id, ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role]));

-- Update commission_tiers policy  
DROP POLICY IF EXISTS "Managers can manage commission tiers" ON commission_tiers;
CREATE POLICY "Managers and office can manage commission tiers" 
ON commission_tiers 
FOR ALL 
USING (business_id IN ( 
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role]) 
    AND user_business_memberships.is_active = true
));

-- Update announcement_settings policy
DROP POLICY IF EXISTS "Managers can manage announcement settings" ON announcement_settings;
CREATE POLICY "Managers and office can manage announcement settings" 
ON announcement_settings 
FOR ALL 
USING (user_can_access_business(business_id, ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role]));

-- Ensure office role has access to chargeback disputes (exclusive to office, not managers)
CREATE POLICY "Office can manage chargeback disputes" 
ON chargeback_disputes 
FOR ALL 
USING (business_id IN ( 
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'office'::user_role]) 
    AND user_business_memberships.is_active = true
));

-- Office access to chargeback evidence
CREATE POLICY "Office can manage chargeback evidence" 
ON chargeback_evidence 
FOR ALL 
USING (dispute_id IN ( 
  SELECT chargeback_disputes.id
  FROM chargeback_disputes
  WHERE chargeback_disputes.business_id IN ( 
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'office'::user_role]) 
      AND user_business_memberships.is_active = true
  )
));

-- Office access to chargeback templates
CREATE POLICY "Office can manage chargeback templates" 
ON chargeback_response_templates 
FOR ALL 
USING (business_id IN ( 
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'office'::user_role]) 
    AND user_business_memberships.is_active = true
));

-- Office access to shipping (same as managers)
CREATE POLICY "Office can manage shipping" 
ON shipping_requests 
FOR ALL 
USING (business_id IN ( 
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role]) 
    AND user_business_memberships.is_active = true
));