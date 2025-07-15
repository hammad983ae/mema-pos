-- Remove the old trigger and function that's causing duplicates
DROP TRIGGER IF EXISTS create_default_channels_trigger ON public.businesses;
DROP FUNCTION IF EXISTS public.create_default_channels_for_business();