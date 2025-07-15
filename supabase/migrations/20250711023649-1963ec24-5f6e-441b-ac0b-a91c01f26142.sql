-- Demo Data Seeding (Without Auth Dependencies)
-- This migration creates sample data that doesn't require existing auth users

-- Create demo product categories (these don't require auth)
INSERT INTO public.product_categories (id, business_id, name, description) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Vehicles', 'Cars and trucks for sale'),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Accessories', 'Car accessories and parts'),
  ('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Vehicles', 'Premium vehicles'),
  ('e4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Software', 'Technology solutions'),
  ('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Hardware', 'Computer hardware')
ON CONFLICT (id) DO NOTHING;

-- Note: To complete the demo data seeding with businesses, users, and orders:
-- 1. Create a real user account through the auth system
-- 2. Use that user ID to create businesses and other related data
-- 3. The handle_new_user function will automatically create the profile

-- Create some sample business invitation codes for testing
INSERT INTO public.businesses (id, name, email, phone, address, owner_user_id, invitation_code) 
SELECT 
  '11111111-1111-1111-1111-111111111111', 
  'Demo Business (Placeholder)', 
  'demo@example.com', 
  '(555) 123-4567', 
  '123 Demo Street, Demo City', 
  '00000000-0000-0000-0000-000000000000', -- Placeholder UUID
  'DEMO2024'
WHERE NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = '11111111-1111-1111-1111-111111111111');

-- Add comment explaining the demo setup process
COMMENT ON TABLE public.businesses IS 'Demo data: Create a user account first, then update the owner_user_id to complete the demo setup';