-- Create inventory_reorder_rules table
CREATE TABLE public.inventory_reorder_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  store_id UUID NOT NULL,
  product_id UUID NOT NULL,
  reorder_point INTEGER NOT NULL DEFAULT 10,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  preferred_supplier_id UUID NOT NULL,
  auto_generate_po BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory_reorder_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_reorder_rules
CREATE POLICY "Users can view reorder rules for their business" 
ON public.inventory_reorder_rules 
FOR SELECT 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Managers can insert reorder rules" 
ON public.inventory_reorder_rules 
FOR INSERT 
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

CREATE POLICY "Managers can update reorder rules" 
ON public.inventory_reorder_rules 
FOR UPDATE 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

CREATE POLICY "Managers can delete reorder rules" 
ON public.inventory_reorder_rules 
FOR DELETE 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

-- Add foreign key constraints
ALTER TABLE public.inventory_reorder_rules
ADD CONSTRAINT fk_inventory_reorder_rules_business 
FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_reorder_rules
ADD CONSTRAINT fk_inventory_reorder_rules_store 
FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_reorder_rules
ADD CONSTRAINT fk_inventory_reorder_rules_product 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_reorder_rules
ADD CONSTRAINT fk_inventory_reorder_rules_supplier 
FOREIGN KEY (preferred_supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;

-- Add indexes for better performance
CREATE INDEX idx_inventory_reorder_rules_business_id ON public.inventory_reorder_rules(business_id);
CREATE INDEX idx_inventory_reorder_rules_store_product ON public.inventory_reorder_rules(store_id, product_id);
CREATE INDEX idx_inventory_reorder_rules_active ON public.inventory_reorder_rules(is_active) WHERE is_active = true;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inventory_reorder_rules_updated_at
BEFORE UPDATE ON public.inventory_reorder_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update inventory_alerts table to ensure it has the business_id column (if not already present)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'inventory_alerts' 
    AND column_name = 'business_id'
  ) THEN
    ALTER TABLE public.inventory_alerts ADD COLUMN business_id UUID;
    
    -- Add foreign key constraint
    ALTER TABLE public.inventory_alerts
    ADD CONSTRAINT fk_inventory_alerts_business 
    FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    
    -- Update existing records with business_id from store
    UPDATE public.inventory_alerts 
    SET business_id = s.business_id 
    FROM public.stores s 
    WHERE public.inventory_alerts.store_id = s.id
    AND public.inventory_alerts.business_id IS NULL;
    
    -- Make business_id not null after updating existing records
    ALTER TABLE public.inventory_alerts ALTER COLUMN business_id SET NOT NULL;
  END IF;
END $$;