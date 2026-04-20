-- Seed Example Users: Admin and Customer
-- This script creates example users for testing/development
-- 
-- IMPORTANT: This requires service role access to insert into auth.users
-- Run this in Supabase SQL Editor with service role privileges
--
-- Users created:
-- - Admin: admin@example.com / admin123
-- - Customer: customer@example.com / customer123

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ADMIN USER CREATION
-- ============================================

DO $$
DECLARE
    admin_user_id UUID;
    admin_profile_id UUID;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com';
    
    IF admin_user_id IS NULL THEN
        -- Step 1: Create auth user for admin
        -- Note: Supabase uses bcrypt for password hashing
        INSERT INTO auth.users (
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),                      -- id
            'authenticated',                        -- aud
            'authenticated',                        -- role
            'admin@example.com',                   -- email
            crypt('admin123', gen_salt('bf', 10)),  -- encrypted_password (bcrypt, cost 10)
            NOW(),                                  -- email_confirmed_at
            '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
            '{}',                                   -- raw_user_meta_data
            NOW(),                                  -- created_at
            NOW()                                   -- updated_at
        ) RETURNING id INTO admin_user_id;

        RAISE NOTICE 'Admin auth user created: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists: %', admin_user_id;
    END IF;

    -- Step 2: Create profile for admin (if it doesn't exist)
    SELECT id INTO admin_profile_id FROM profiles WHERE user_id = admin_user_id;
    
    IF admin_profile_id IS NULL THEN
        INSERT INTO profiles (
            user_id,
            email,
            first_name,
            last_name,
            role,
            is_active
        ) VALUES (
            admin_user_id,
            'admin@example.com',
            'Admin',
            'User',
            'admin',
            true
        ) RETURNING id INTO admin_profile_id;

        RAISE NOTICE 'Admin profile created: %', admin_profile_id;
    ELSE
        -- Update role to admin if it's not already
        UPDATE profiles SET role = 'admin' WHERE id = admin_profile_id;
        RAISE NOTICE 'Admin profile already exists: %', admin_profile_id;
    END IF;

    -- Step 3: Create staff record for admin (if it doesn't exist)
    IF NOT EXISTS (SELECT 1 FROM staff WHERE profile_id = admin_profile_id) THEN
        INSERT INTO staff (
            profile_id,
            position,
            hire_date,
            is_active
        ) VALUES (
            admin_profile_id,
            'Administrator',
            CURRENT_DATE,
            true
        );
        RAISE NOTICE 'Admin staff record created';
    END IF;

    RAISE NOTICE '=== Admin User Setup Complete ===';
    RAISE NOTICE 'Email: admin@example.com';
    RAISE NOTICE 'Password: admin123';
END $$;

-- ============================================
-- CUSTOMER USER CREATION
-- ============================================

DO $$
DECLARE
    customer_user_id UUID;
    customer_profile_id UUID;
    customer_record_id UUID;
BEGIN
    -- Check if customer user already exists
    SELECT id INTO customer_user_id FROM auth.users WHERE email = 'customer@example.com';
    
    IF customer_user_id IS NULL THEN
        -- Step 1: Create auth user for customer
        INSERT INTO auth.users (
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),                      -- id
            'authenticated',                        -- aud
            'authenticated',                        -- role
            'customer@example.com',                -- email
            crypt('customer123', gen_salt('bf', 10)),  -- encrypted_password (bcrypt, cost 10)
            NOW(),                                  -- email_confirmed_at
            '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
            '{}',                                   -- raw_user_meta_data
            NOW(),                                  -- created_at
            NOW()                                   -- updated_at
        ) RETURNING id INTO customer_user_id;

        RAISE NOTICE 'Customer auth user created: %', customer_user_id;
    ELSE
        RAISE NOTICE 'Customer user already exists: %', customer_user_id;
    END IF;

    -- Step 2: Create profile for customer (if it doesn't exist)
    SELECT id INTO customer_profile_id FROM profiles WHERE user_id = customer_user_id;
    
    IF customer_profile_id IS NULL THEN
        INSERT INTO profiles (
            user_id,
            email,
            first_name,
            last_name,
            role,
            is_active
        ) VALUES (
            customer_user_id,
            'customer@example.com',
            'Customer',
            'User',
            'customer',
            true
        ) RETURNING id INTO customer_profile_id;

        RAISE NOTICE 'Customer profile created: %', customer_profile_id;
    ELSE
        -- Update role to customer if it's not already
        UPDATE profiles SET role = 'customer' WHERE id = customer_profile_id;
        RAISE NOTICE 'Customer profile already exists: %', customer_profile_id;
    END IF;

    -- Step 3: Create customer record (if it doesn't exist)
    SELECT id INTO customer_record_id FROM customers WHERE profile_id = customer_profile_id;
    
    IF customer_record_id IS NULL THEN
        INSERT INTO customers (
            profile_id,
            name,
            email,
            loyalty_points,
            total_visits
        ) VALUES (
            customer_profile_id,
            'Customer User',
            'customer@example.com',
            0,
            0
        ) RETURNING id INTO customer_record_id;

        RAISE NOTICE 'Customer record created: %', customer_record_id;
    ELSE
        RAISE NOTICE 'Customer record already exists: %', customer_record_id;
    END IF;

    RAISE NOTICE '=== Customer User Setup Complete ===';
    RAISE NOTICE 'Email: customer@example.com';
    RAISE NOTICE 'Password: customer123';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify admin user
SELECT 
    u.id as user_id,
    u.email,
    p.id as profile_id,
    p.role,
    p.first_name,
    p.last_name,
    s.position,
    s.is_active as staff_active
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
LEFT JOIN staff s ON s.profile_id = p.id
WHERE u.email = 'admin@example.com';

-- Verify customer user
SELECT 
    u.id as user_id,
    u.email,
    p.id as profile_id,
    p.role,
    p.first_name,
    p.last_name,
    c.id as customer_id,
    c.name as customer_name,
    c.loyalty_points
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
LEFT JOIN customers c ON c.profile_id = p.id
WHERE u.email = 'customer@example.com';
