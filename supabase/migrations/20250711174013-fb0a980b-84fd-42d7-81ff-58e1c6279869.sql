-- Add missing is_active column to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;