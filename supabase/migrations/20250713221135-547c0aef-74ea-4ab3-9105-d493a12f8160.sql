-- Get the current business ID for Mike's Business
DO $$ 
DECLARE
    mikes_business_id UUID;
    downtown_store_id UUID;
    westside_store_id UUID;
    employee_ids UUID[];
    product_ids UUID[];
    current_user_id UUID := (SELECT auth.uid());
BEGIN
    -- Get Mike's business ID
    SELECT id INTO mikes_business_id 
    FROM public.businesses 
    WHERE name = 'Mikes Business' AND owner_user_id = current_user_id;
    
    IF mikes_business_id IS NULL THEN
        RAISE EXCEPTION 'Could not find Mikes Business for current user';
    END IF;
    
    -- Create additional stores for Mike's business
    INSERT INTO public.stores (name, business_id, address, city, state, zip_code, phone, status, pos_access_code)
    VALUES 
        ('Downtown Flagship', mikes_business_id, '123 Main St', 'Downtown', 'CA', '90210', '(555) 123-4567', 'active', generate_store_access_code()),
        ('Westside Branch', mikes_business_id, '456 Oak Ave', 'Westside', 'CA', '90211', '(555) 987-6543', 'active', generate_store_access_code())
    RETURNING id INTO downtown_store_id, westside_store_id;
    
    -- Create sample employees for Mike's business
    INSERT INTO public.profiles (user_id, full_name, username, position_type, pin_hash, phone, emergency_contact, emergency_phone)
    VALUES
        (gen_random_uuid(), 'Sarah Johnson', 'sarah_j', 'opener', '$2b$10$example_hash_1', '(555) 111-2222', 'Mike Johnson', '(555) 111-3333'),
        (gen_random_uuid(), 'Alex Chen', 'alex_c', 'upseller', '$2b$10$example_hash_2', '(555) 222-3333', 'Lisa Chen', '(555) 222-4444'),
        (gen_random_uuid(), 'Maria Garcia', 'maria_g', 'opener', '$2b$10$example_hash_3', '(555) 333-4444', 'Carlos Garcia', '(555) 333-5555'),
        (gen_random_uuid(), 'James Wilson', 'james_w', 'upseller', '$2b$10$example_hash_4', '(555) 444-5555', 'Emma Wilson', '(555) 444-6666'),
        (gen_random_uuid(), 'Emma Davis', 'emma_d', 'opener', '$2b$10$example_hash_5', '(555) 555-6666', 'John Davis', '(555) 555-7777'),
        (gen_random_uuid(), 'Ryan Martinez', 'ryan_m', 'upseller', '$2b$10$example_hash_6', '(555) 666-7777', 'Anna Martinez', '(555) 666-8888'),
        (gen_random_uuid(), 'Lisa Anderson', 'lisa_a', 'opener', '$2b$10$example_hash_7', '(555) 777-8888', 'Tom Anderson', '(555) 777-9999'),
        (gen_random_uuid(), 'David Brown', 'david_b', 'upseller', '$2b$10$example_hash_8', '(555) 888-9999', 'Kate Brown', '(555) 888-0000'),
        (gen_random_uuid(), 'Nicole Taylor', 'nicole_t', 'opener', '$2b$10$example_hash_9', '(555) 999-0000', 'Steve Taylor', '(555) 999-1111')
    ON CONFLICT (username) DO NOTHING;
    
    -- Get the employee user IDs
    SELECT ARRAY_AGG(user_id) INTO employee_ids
    FROM public.profiles 
    WHERE username IN ('sarah_j', 'alex_c', 'maria_g', 'james_w', 'emma_d', 'ryan_m', 'lisa_a', 'david_b', 'nicole_t');
    
    -- Create business memberships for all employees
    INSERT INTO public.user_business_memberships (user_id, business_id, role, is_active)
    SELECT 
        unnest(employee_ids),
        mikes_business_id,
        'employee'::user_role,
        true
    ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Get existing product IDs or create them if they don't exist
    SELECT ARRAY_AGG(id) INTO product_ids FROM public.products WHERE business_id = mikes_business_id;
    
    IF array_length(product_ids, 1) IS NULL OR array_length(product_ids, 1) = 0 THEN
        -- Insert sample products for Mike's business
        INSERT INTO public.products (business_id, name, description, price, category_id, sku, track_inventory, is_active)
        SELECT 
            mikes_business_id,
            name,
            description,
            price,
            (SELECT id FROM public.product_categories WHERE name = 'Services' AND business_id = mikes_business_id LIMIT 1),
            sku,
            track_inventory,
            is_active
        FROM (VALUES
            ('Basic Facial', 'Cleansing and moisturizing facial treatment', 89.99, 'BASIC_FACIAL', true, true),
            ('Deep Pore Cleansing', 'Advanced facial with extraction', 129.99, 'DEEP_PORE', true, true),
            ('Anti-Aging Treatment', 'Premium anti-aging facial with serums', 199.99, 'ANTI_AGING', true, true),
            ('Hydrating Mask', 'Intensive hydration treatment', 79.99, 'HYDRATING', true, true),
            ('Acne Treatment', 'Specialized acne clearing facial', 109.99, 'ACNE_TREAT', true, true),
            ('Brightening Facial', 'Vitamin C brightening treatment', 149.99, 'BRIGHTENING', true, true),
            ('Sensitive Skin Care', 'Gentle treatment for sensitive skin', 99.99, 'SENSITIVE', true, true),
            ('Exfoliating Treatment', 'Deep exfoliation and renewal', 119.99, 'EXFOLIATE', true, true),
            ('Collagen Boost', 'Collagen stimulating facial', 179.99, 'COLLAGEN', true, true),
            ('Relaxation Package', 'Full relaxation and skincare combo', 249.99, 'RELAX_PKG', true, true)
        ) AS products(name, description, price, sku, track_inventory, is_active)
        ON CONFLICT (business_id, sku) DO NOTHING
        RETURNING id;
        
        -- Get the newly created product IDs
        SELECT ARRAY_AGG(id) INTO product_ids FROM public.products WHERE business_id = mikes_business_id;
    END IF;
    
    -- Create inventory for all stores and all products
    INSERT INTO public.inventory (store_id, product_id, quantity_on_hand, low_stock_threshold)
    SELECT 
        s.id,
        p.id,
        (RANDOM() * 50 + 10)::INTEGER, -- Random quantity between 10-60
        5 -- Low stock threshold
    FROM public.stores s
    CROSS JOIN public.products p
    WHERE s.business_id = mikes_business_id 
      AND p.business_id = mikes_business_id
    ON CONFLICT (store_id, product_id) DO NOTHING;
    
    RAISE NOTICE 'Successfully created sample data for Mikes Business (%):', mikes_business_id;
    RAISE NOTICE '- 2 additional stores (now 3 total)';
    RAISE NOTICE '- 9 employees (now 10 total including owner)';
    RAISE NOTICE '- % products with inventory', array_length(product_ids, 1);
END $$;