-- Create sample data for Mikes Business only
DO $$
DECLARE
  mike_business_id UUID;
  store_ids UUID[];
  employee_user_ids UUID[];
  product_ids UUID[];
BEGIN
  -- Get Mikes Business ID
  SELECT id INTO mike_business_id 
  FROM public.businesses 
  WHERE name = 'Mikes Business' 
  AND owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3';

  IF mike_business_id IS NULL THEN
    RAISE EXCEPTION 'Mikes Business not found';
  END IF;

  -- Create additional stores for Mikes Business
  INSERT INTO public.stores (business_id, name, address, phone, email)
  VALUES 
    (mike_business_id, 'Downtown Flagship', '123 Main St, Downtown, CA 90210', '(555) 123-4567', 'downtown@mikesbusiness.com'),
    (mike_business_id, 'Westside Branch', '456 West Ave, Westside, CA 90211', '(555) 987-6543', 'westside@mikesbusiness.com');

  -- Get all store IDs for this business
  SELECT ARRAY_AGG(id) INTO store_ids FROM public.stores WHERE business_id = mike_business_id;

  -- Create sample employee profiles (using only allowed position_type values)
  INSERT INTO public.profiles (user_id, username, full_name, pos_pin_hash, position_type, business_id)
  VALUES 
    (gen_random_uuid(), 'sarah_j', 'Sarah Johnson', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'opener', mike_business_id),
    (gen_random_uuid(), 'alex_c', 'Alex Chen', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'upseller', mike_business_id),
    (gen_random_uuid(), 'maria_g', 'Maria Garcia', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'opener', mike_business_id),
    (gen_random_uuid(), 'james_w', 'James Wilson', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'upseller', mike_business_id),
    (gen_random_uuid(), 'emma_d', 'Emma Davis', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'opener', mike_business_id),
    (gen_random_uuid(), 'ryan_m', 'Ryan Miller', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'upseller', mike_business_id),
    (gen_random_uuid(), 'lisa_a', 'Lisa Anderson', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'opener', mike_business_id),
    (gen_random_uuid(), 'david_b', 'David Brown', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'opener', mike_business_id),
    (gen_random_uuid(), 'nicole_t', 'Nicole Taylor', '$2b$10$rH8Qz9J4bQ2mF7vX1nK8Z.L3P4R6T8Y0mN2cV5bX9zA1qW3eR5tY7', 'upseller', mike_business_id);

  -- Get the created employee user IDs
  SELECT ARRAY_AGG(user_id) INTO employee_user_ids 
  FROM public.profiles 
  WHERE username IN ('sarah_j', 'alex_c', 'maria_g', 'james_w', 'emma_d', 'ryan_m', 'lisa_a', 'david_b', 'nicole_t');

  -- Create business memberships for employees
  INSERT INTO public.user_business_memberships (user_id, business_id, role, is_active)
  SELECT 
    user_id, 
    mike_business_id, 
    'employee'::user_role,
    true
  FROM public.profiles p
  WHERE p.user_id = ANY(employee_user_ids);

  -- Make Lisa a manager
  UPDATE public.user_business_memberships 
  SET role = 'manager'::user_role 
  WHERE user_id IN (
    SELECT user_id FROM public.profiles WHERE username = 'lisa_a'
  );

  -- Create sample products
  INSERT INTO public.products (business_id, name, description, price, category, track_inventory)
  VALUES 
    (mike_business_id, 'Facial Treatment', 'Rejuvenating facial treatment', 150.00, 'Services', false),
    (mike_business_id, 'Massage Therapy', 'Relaxing full body massage', 120.00, 'Services', false),
    (mike_business_id, 'Hair Styling', 'Professional hair cut and styling', 80.00, 'Services', false),
    (mike_business_id, 'Manicure', 'Professional nail care', 45.00, 'Services', false),
    (mike_business_id, 'Pedicure', 'Foot care and nail polish', 55.00, 'Services', false),
    (mike_business_id, 'Skincare Cream', 'Premium anti-aging cream', 85.00, 'Products', true),
    (mike_business_id, 'Hair Serum', 'Nourishing hair treatment', 35.00, 'Products', true),
    (mike_business_id, 'Nail Polish', 'Long-lasting color', 25.00, 'Products', true),
    (mike_business_id, 'Face Mask', 'Hydrating face treatment', 30.00, 'Products', true),
    (mike_business_id, 'Body Lotion', 'Moisturizing body care', 40.00, 'Products', true);

  -- Get product IDs
  SELECT ARRAY_AGG(id) INTO product_ids FROM public.products WHERE business_id = mike_business_id;

  -- Create inventory for all products across all stores
  INSERT INTO public.inventory (store_id, product_id, quantity_on_hand, low_stock_threshold)
  SELECT 
    s.id as store_id,
    p.id as product_id,
    CASE WHEN p.track_inventory THEN (random() * 50 + 10)::integer ELSE 0 END as quantity,
    CASE WHEN p.track_inventory THEN 5 ELSE 0 END as threshold
  FROM public.stores s
  CROSS JOIN public.products p
  WHERE s.business_id = mike_business_id AND p.business_id = mike_business_id
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Sample data created successfully for Mikes Business';
  RAISE NOTICE 'Created % stores, % employees, % products', array_length(store_ids, 1), array_length(employee_user_ids, 1), array_length(product_ids, 1);
END $$;