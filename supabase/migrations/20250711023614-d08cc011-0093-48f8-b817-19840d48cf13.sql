-- Demo Data Seeding
-- This migration creates sample data for development and testing

-- Create demo businesses
INSERT INTO public.businesses (id, name, email, phone, address, owner_user_id, invitation_code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Coastal Auto Sales', 'admin@coastalauto.com', '(555) 123-4567', '123 Ocean Drive, Miami, FL 33101', '22222222-2222-2222-2222-222222222222', 'DEMO2024'),
  ('33333333-3333-3333-3333-333333333333', 'Mountain View Motors', 'owner@mvmotors.com', '(555) 987-6543', '456 Highland Ave, Denver, CO 80202', '44444444-4444-4444-4444-444444444444', 'MVMOTO24'),
  ('55555555-5555-5555-5555-555555555555', 'Tech Solutions Inc', 'contact@techsolutions.com', '(555) 555-1234', '789 Innovation Blvd, Austin, TX 78701', '66666666-6666-6666-6666-666666666666', 'TECH2024');

-- Create demo profiles (these would normally be created by the handle_new_user function)
INSERT INTO public.profiles (id, user_id, full_name, email, phone, position, position_type, username) VALUES
  ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah@coastalauto.com', '(555) 123-4567', 'Business Owner', 'opener', 'sarah_j'),
  ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Mike Rodriguez', 'mike@mvmotors.com', '(555) 987-6543', 'Business Owner', 'upseller', 'mike_r'),
  ('66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'Emily Chen', 'emily@techsolutions.com', '(555) 555-1234', 'Business Owner', 'opener', 'emily_c'),
  ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'Alex Thompson', 'alex@coastalauto.com', '(555) 123-4568', 'Sales Manager', 'upseller', 'alex_t'),
  ('88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'Lisa Martinez', 'lisa@coastalauto.com', '(555) 123-4569', 'Sales Associate', 'opener', 'lisa_m'),
  ('99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'David Wilson', 'david@mvmotors.com', '(555) 987-6544', 'Sales Associate', 'upseller', 'david_w');

-- Create user business memberships
INSERT INTO public.user_business_memberships (user_id, business_id, role, is_active) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'business_owner', true),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'business_owner', true),
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'business_owner', true),
  ('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'manager', true),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'employee', true),
  ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'employee', true);

-- Create demo stores
INSERT INTO public.stores (id, business_id, name, address, phone, is_active, pos_access_code) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Coastal Auto Sales - Main Location', '123 Ocean Drive, Miami, FL 33101', '(555) 123-4567', true, 'COAST1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Coastal Auto Sales - Downtown', '789 Downtown Blvd, Miami, FL 33102', '(555) 123-4570', true, 'COAST2'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Mountain View Motors - Showroom', '456 Highland Ave, Denver, CO 80202', '(555) 987-6543', true, 'MOUNT1'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 'Tech Solutions - Austin Office', '789 Innovation Blvd, Austin, TX 78701', '(555) 555-1234', true, 'TECH01');

-- Create demo product categories
INSERT INTO public.product_categories (id, business_id, name, description) VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Vehicles', 'Cars and trucks for sale'),
  ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Accessories', 'Car accessories and parts'),
  ('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Vehicles', 'Premium vehicles'),
  ('e4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Software', 'Technology solutions'),
  ('e5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Hardware', 'Computer hardware');

-- Create demo products
INSERT INTO public.products (id, business_id, name, description, price, category_id, sku, track_inventory, is_active) VALUES
  ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2023 Honda Civic', 'Reliable compact sedan with excellent fuel economy', 25999.00, 'e1111111-1111-1111-1111-111111111111', 'HON-CIV-23', false, true),
  ('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2024 Toyota Camry', 'Mid-size sedan with advanced safety features', 28999.00, 'e1111111-1111-1111-1111-111111111111', 'TOY-CAM-24', false, true),
  ('f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Premium Floor Mats', 'All-weather floor mats for most vehicle models', 89.99, 'e2222222-2222-2222-2222-222222222222', 'MAT-PREM-01', true, true),
  ('f4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Car Care Kit', 'Complete car washing and detailing kit', 149.99, 'e2222222-2222-2222-2222-222222222222', 'CARE-KIT-01', true, true),
  ('f5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '2024 BMW X5', 'Luxury SUV with premium features', 65999.00, 'e3333333-3333-3333-3333-333333333333', 'BMW-X5-24', false, true),
  ('f6666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'Website Development Package', 'Complete website development solution', 4999.00, 'e4444444-4444-4444-4444-444444444444', 'WEB-DEV-PKG', false, true),
  ('f7777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', 'Business Laptop', 'High-performance laptop for business use', 1299.99, 'e5555555-5555-5555-5555-555555555555', 'LAPTOP-BIZ', true, true);

-- Create demo inventory
INSERT INTO public.inventory (id, store_id, product_id, quantity_on_hand, low_stock_threshold, cost_per_unit) VALUES
  ('g1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f3333333-3333-3333-3333-333333333333', 25, 10, 45.00),
  ('g2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'f4444444-4444-4444-4444-444444444444', 15, 5, 75.00),
  ('g3333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f3333333-3333-3333-3333-333333333333', 30, 10, 45.00),
  ('g4444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'f7777777-7777-7777-7777-777777777777', 12, 5, 899.99);

-- Create demo customers
INSERT INTO public.customers (id, business_id, first_name, last_name, email, phone, address_line_1, city, state_province, postal_code, country) VALUES
  ('h1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'John', 'Smith', 'john.smith@email.com', '(555) 111-2222', '123 Main St', 'Miami', 'FL', '33101', 'United States'),
  ('h2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Maria', 'Garcia', 'maria.garcia@email.com', '(555) 333-4444', '456 Oak Ave', 'Miami', 'FL', '33102', 'United States'),
  ('h3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Robert', 'Johnson', 'robert.johnson@email.com', '(555) 555-6666', '789 Pine St', 'Denver', 'CO', '80202', 'United States'),
  ('h4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Jennifer', 'Davis', 'jennifer.davis@email.com', '(555) 777-8888', '321 Elm Dr', 'Austin', 'TX', '78701', 'United States');

-- Create demo orders
INSERT INTO public.orders (id, store_id, user_id, customer_id, order_number, status, subtotal, tax, total, payment_method, sale_type) VALUES
  ('i1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', 'h1111111-1111-1111-1111-111111111111', 'ORD-20241201-0001', 'completed', 25999.00, 2079.92, 28078.92, 'credit_card', 'upsell'),
  ('i2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '77777777-7777-7777-7777-777777777777', 'h2222222-2222-2222-2222-222222222222', 'ORD-20241201-0002', 'completed', 89.99, 7.20, 97.19, 'cash', 'open'),
  ('i3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '99999999-9999-9999-9999-999999999999', 'h3333333-3333-3333-3333-333333333333', 'ORD-20241201-0003', 'completed', 65999.00, 5279.92, 71278.92, 'financing', 'upsell'),
  ('i4444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '66666666-6666-6666-6666-666666666666', 'h4444444-4444-4444-4444-444444444444', 'ORD-20241201-0004', 'pending', 4999.00, 399.92, 5398.92, 'check', 'upsell');

-- Create demo order items
INSERT INTO public.order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES
  ('j1111111-1111-1111-1111-111111111111', 'i1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 1, 25999.00, 25999.00),
  ('j2222222-2222-2222-2222-222222222222', 'i2222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333', 1, 89.99, 89.99),
  ('j3333333-3333-3333-3333-333333333333', 'i3333333-3333-3333-3333-333333333333', 'f5555555-5555-5555-5555-555555555555', 1, 65999.00, 65999.00),
  ('j4444444-4444-4444-4444-444444444444', 'i4444444-4444-4444-4444-444444444444', 'f6666666-6666-6666-6666-666666666666', 1, 4999.00, 4999.00);

-- Create demo commission tiers
INSERT INTO public.commission_tiers (id, business_id, name, role_type, tier_number, target_amount, commission_rate, target_period, is_active) VALUES
  ('k1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Opener Tier 1', 'opener', 1, 5000.00, 0.02, 'monthly', true),
  ('k2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Opener Tier 2', 'opener', 2, 10000.00, 0.03, 'monthly', true),
  ('k3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Upseller Tier 1', 'upseller', 1, 25000.00, 0.05, 'monthly', true),
  ('k4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Upseller Tier 2', 'upseller', 2, 50000.00, 0.07, 'monthly', true);

-- Create demo commission payments
INSERT INTO public.commission_payments (id, business_id, user_id, order_id, payment_period, payment_type, sale_amount, commission_rate, commission_amount, is_paid) VALUES
  ('l1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'i1111111-1111-1111-1111-111111111111', 'monthly', 'upsell', 25999.00, 0.05, 1299.95, true),
  ('l2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'i2222222-2222-2222-2222-222222222222', 'monthly', 'open', 89.99, 0.02, 1.80, true);

-- Create demo sales goals
INSERT INTO public.sales_goals (id, business_id, user_id, position_type, target_count, current_count, target_amount, current_amount, start_date, end_date, is_active) VALUES
  ('m1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'opener', 10, 2, 10000.00, 26088.99, '2024-12-01', '2024-12-31', true),
  ('m2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'upseller', 5, 1, 50000.00, 89.99, '2024-12-01', '2024-12-31', true);

-- Create demo business hours
INSERT INTO public.business_hours (business_id, day_of_week, start_time, end_time, is_closed) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, '09:00', '18:00', false), -- Monday
  ('11111111-1111-1111-1111-111111111111', 2, '09:00', '18:00', false), -- Tuesday
  ('11111111-1111-1111-1111-111111111111', 3, '09:00', '18:00', false), -- Wednesday
  ('11111111-1111-1111-1111-111111111111', 4, '09:00', '18:00', false), -- Thursday
  ('11111111-1111-1111-1111-111111111111', 5, '09:00', '18:00', false), -- Friday
  ('11111111-1111-1111-1111-111111111111', 6, '09:00', '17:00', false), -- Saturday
  ('11111111-1111-1111-1111-111111111111', 0, '12:00', '17:00', false); -- Sunday

-- Create demo team announcements settings
INSERT INTO public.announcement_settings (business_id, min_amount, max_amount, announcement_text, emoji, title, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 1000.00, 9999.99, '🎉 Great job {names}! You just made a ${amount} sale!', '🎉', 'Nice Sale!', true),
  ('11111111-1111-1111-1111-111111111111', 10000.00, 49999.99, '🚀 Outstanding work {names}! Massive ${amount} sale achieved!', '🚀', 'Big Sale Alert!', true),
  ('11111111-1111-1111-1111-111111111111', 50000.00, null, '💎 INCREDIBLE! {names} just closed a ${amount} MEGA DEAL!', '💎', 'MEGA SALE!', true);