-- Functions and triggers generated from schema CSV

CREATE OR REPLACE FUNCTION public.check_visit_milestone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    visit_count INTEGER;
    new_milestone_type TEXT;
BEGIN
    -- Get current visit count
    SELECT total_visits INTO visit_count
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Check for milestones
    IF visit_count = 10 AND NOT EXISTS (SELECT 1 FROM visit_milestones vm WHERE vm.customer_id = NEW.customer_id AND vm.milestone_type = 'first_visit') THEN
        new_milestone_type := 'first_visit';
    ELSIF visit_count = 25 AND NOT EXISTS (SELECT 1 FROM visit_milestones vm WHERE vm.customer_id = NEW.customer_id AND vm.milestone_type = 'tenth_visit') THEN
        new_milestone_type := 'tenth_visit';
    ELSIF visit_count = 50 AND NOT EXISTS (SELECT 1 FROM visit_milestones vm WHERE vm.customer_id = NEW.customer_id AND vm.milestone_type = 'fiftieth_visit') THEN
        new_milestone_type := 'fiftieth_visit';
    ELSIF visit_count = 100 AND NOT EXISTS (SELECT 1 FROM visit_milestones vm WHERE vm.customer_id = NEW.customer_id AND vm.milestone_type = 'hundredth_visit') THEN
        new_milestone_type := 'hundredth_visit';
    END IF;
    
    -- Insert milestone if achieved
    IF new_milestone_type IS NOT NULL THEN
        INSERT INTO visit_milestones (customer_id, visit_count, milestone_type)
        VALUES (NEW.customer_id, visit_count, new_milestone_type);
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Delete audit logs older than 1 year
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_audit_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        record_id,
        action,
        table_name,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_loyalty_for_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.loyalty (user_id)
  VALUES (NEW.user_id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_file(bucket_name text, file_path text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    DELETE FROM storage.objects 
    WHERE bucket_id = bucket_name AND name = file_path;
    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Convert UUID to base36 and take first 8 characters
  RETURN upper(substring(encode(user_id::text::bytea, 'base36') from 1 for 8));
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_columns_info()
 RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text, column_default text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_name::TEXT,
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name NOT LIKE 'pg_%'
  ORDER BY c.table_name, c.ordinal_position;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_constraints()
 RETURNS TABLE(table_name text, constraint_name text, constraint_type text, column_name text, foreign_table_name text, foreign_column_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tc.table_name::TEXT,
    tc.constraint_name::TEXT,
    tc.constraint_type::TEXT,
    kcu.column_name::TEXT,
    ccu.table_name::TEXT as foreign_table_name,
    ccu.column_name::TEXT as foreign_column_name
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.table_name NOT LIKE 'pg_%'
  ORDER BY tc.table_name, tc.constraint_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_file_url(bucket_name text, file_path text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN storage.url(bucket_name, file_path);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_functions()
 RETURNS TABLE(function_name text, function_source text, return_type text, argument_types text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT as function_name,
    p.prosrc::TEXT as function_source,
    pg_get_function_result(p.oid)::TEXT as return_type,
    pg_get_function_arguments(p.oid)::TEXT as argument_types
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
  ORDER BY p.proname;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_indexes()
 RETURNS TABLE(schemaname text, tablename text, indexname text, indexdef text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.schemaname::TEXT,
    i.tablename::TEXT,
    i.indexname::TEXT,
    i.indexdef::TEXT
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND i.tablename NOT LIKE 'pg_%'
  ORDER BY i.tablename, i.indexname;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_policies()
 RETURNS TABLE(schemaname text, tablename text, policyname text, permissive text, roles text, cmd text, qual text, with_check text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname::TEXT,
    p.tablename::TEXT,
    p.policyname::TEXT,
    p.permissive::TEXT,
    p.roles::TEXT,
    p.cmd::TEXT,
    p.qual::TEXT,
    p.with_check::TEXT
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_schema_summary()
 RETURNS TABLE(component_type text, component_name text, details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'tables'::TEXT as component_type,
    t.table_name::TEXT as component_name,
    jsonb_build_object(
      'columns', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable,
            'default', c.column_default
          )
        )
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' 
          AND c.table_name = t.table_name
      ),
      'row_count', (
        SELECT COUNT(*)::TEXT
        FROM information_schema.tables
        WHERE table_schema = 'public' 
          AND table_name = t.table_name
      )
    ) as details
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
  
  UNION ALL
  
  SELECT 
    'views'::TEXT,
    v.table_name::TEXT,
    jsonb_build_object(
      'definition', v.view_definition,
      'updatable', v.is_updatable
    )
  FROM information_schema.views v
  WHERE v.table_schema = 'public'
    AND v.table_name NOT LIKE 'pg_%'
  
  UNION ALL
  
  SELECT 
    'functions'::TEXT,
    p.proname::TEXT,
    jsonb_build_object(
      'return_type', pg_get_function_result(p.oid),
      'arguments', pg_get_function_arguments(p.oid),
      'source', p.prosrc
    )
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
  
  UNION ALL
  
  SELECT 
    'policies'::TEXT,
    p.policyname::TEXT,
    jsonb_build_object(
      'table', p.tablename,
      'permissive', p.permissive,
      'roles', p.roles,
      'command', p.cmd,
      'using', p.qual,
      'with_check', p.with_check
    )
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  
  ORDER BY component_type, component_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_table_names()
 RETURNS TABLE(table_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
  ORDER BY t.table_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_triggers()
 RETURNS TABLE(trigger_name text, event_manipulation text, event_object_table text, action_statement text, action_timing text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.trigger_name::TEXT,
    t.event_manipulation::TEXT,
    t.event_object_table::TEXT,
    t.action_statement::TEXT,
    t.action_timing::TEXT
  FROM information_schema.triggers t
  WHERE t.trigger_schema = 'public'
    AND t.event_object_table NOT LIKE 'pg_%'
  ORDER BY t.event_object_table, t.trigger_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_customer_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    profile_uuid UUID;
BEGIN
    profile_uuid := get_user_profile_id();
    IF profile_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN (
        SELECT id 
        FROM customers 
        WHERE profile_id = profile_uuid
        LIMIT 1
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_from_referral_code(referral_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_id UUID;
BEGIN
  -- This is a simplified lookup - in production you might want a separate table
  -- or more sophisticated code generation
  SELECT id INTO user_id FROM auth.users 
  WHERE upper(substring(encode(id::text::bytea, 'base36') from 1 for 8)) = upper(referral_code)
  LIMIT 1;
  
  RETURN user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN (
        SELECT id 
        FROM profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN (
        SELECT role 
        FROM profiles 
        WHERE user_id = auth.uid()
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_views()
 RETURNS TABLE(view_name text, view_definition text, is_updatable text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    v.table_name::TEXT as view_name,
    v.view_definition::TEXT,
    v.is_updatable::TEXT
  FROM information_schema.views v
  WHERE v.table_schema = 'public'
    AND v.table_name NOT LIKE 'pg_%'
  ORDER BY v.table_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_staff_profile_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- If the new profile has staff or admin role, create a staff record
    IF NEW.role IN ('staff', 'admin') THEN
        INSERT INTO staff (profile_id, position, hire_date, is_active)
        VALUES (
            NEW.id,
            'Staff Member',  -- Default position
            CURRENT_DATE,    -- Use today as hire date
            true             -- Active by default
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_staff_role_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- If role changed to staff/admin and no staff record exists
    IF NEW.role IN ('staff', 'admin') AND OLD.role NOT IN ('staff', 'admin') THEN
        -- Check if staff record already exists
        IF NOT EXISTS (SELECT 1 FROM staff WHERE profile_id = NEW.id) THEN
            INSERT INTO staff (profile_id, position, hire_date, is_active)
            VALUES (
                NEW.id,
                'Staff Member',
                CURRENT_DATE,
                true
            );
        END IF;
    END IF;
    
    -- If role changed from staff/admin to customer, deactivate staff record
    IF OLD.role IN ('staff', 'admin') AND NEW.role = 'customer' THEN
        UPDATE staff 
        SET is_active = false 
        WHERE profile_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_customer()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN get_user_role() = 'customer';
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN get_user_role() IN ('staff', 'admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_event(p_action text, p_table_name text DEFAULT NULL::text, p_record_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_soft_deleted_records(table_name text, older_than_days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    sql_text TEXT;
    deleted_count INTEGER;
BEGIN
    sql_text := format(
        'DELETE FROM %I WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL ''%s days''',
        table_name,
        older_than_days
    );
    EXECUTE sql_text;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_record(table_name text, record_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    sql_text TEXT;
BEGIN
    sql_text := format('UPDATE %I SET deleted_at = NULL WHERE id = $1', table_name);
    EXECUTE sql_text USING record_id;
    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_record(table_name text, record_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    sql_text TEXT;
BEGIN
    sql_text := format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', table_name);
    EXECUTE sql_text USING record_id;
    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_customers_ensure_loyalty()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.loyalty (customer_id, coffee_goal, alcohol_goal)
  VALUES (NEW.id, 8, 10)
  ON CONFLICT (customer_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_customer_visit_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update customer visit statistics
    UPDATE customers 
    SET 
        total_visits = total_visits + 1,
        last_visit_date = NEW.visit_date,
        loyalty_points = loyalty_points + COALESCE(NEW.loyalty_points_earned, 0),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    
    -- Update first visit date if not set
    UPDATE customers 
    SET first_visit_date = NEW.visit_date
    WHERE id = NEW.customer_id AND first_visit_date IS NULL;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_event_rsvp_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update event RSVP count
    UPDATE events 
    SET 
        current_rsvps = (
            SELECT COUNT(*) 
            FROM rsvps 
            WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) 
            AND status = 'confirmed'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_inventory_quantity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.inventory 
  SET 
    quantity = quantity + NEW.change,
    last_updated = NOW()
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_inventory_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update inventory current_stock based on log entry
    UPDATE inventory 
    SET current_stock = NEW.new_quantity
    WHERE id = NEW.inventory_id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_inventory_stock_from_logs()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update inventory stock based on the log entry
    UPDATE inventory 
    SET 
        current_stock = NEW.new_quantity,
        updated_at = NOW()
    WHERE id = NEW.inventory_id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update loyalty points when customer visits
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'visits' THEN
        UPDATE loyalty 
        SET 
            total_points = total_points + COALESCE(NEW.loyalty_points_earned, 0),
            lifetime_visits = lifetime_visits + 1,
            last_visit = NEW.visit_date
        WHERE customer_id = NEW.customer_id;
        
        -- Update appropriate punch card based on visit type
        IF NEW.visit_type = 'alcoholic' THEN
            UPDATE loyalty 
            SET alcohol_punch_count = alcohol_punch_count + 1
            WHERE customer_id = NEW.customer_id;
        ELSIF NEW.visit_type = 'non_alcoholic' THEN
            UPDATE loyalty 
            SET coffee_punch_count = coffee_punch_count + 1
            WHERE customer_id = NEW.customer_id;
        ELSE
            -- For other visit types, update the general punch count
            UPDATE loyalty 
            SET punch_count = punch_count + 1
            WHERE customer_id = NEW.customer_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_referrals_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upload_file(bucket_name text, file_path text, file_data bytea)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    INSERT INTO storage.objects (bucket_id, name, data)
    VALUES (bucket_name, file_path, file_data);
    RETURN get_file_url(bucket_name, file_path);
END;
$function$;

CREATE OR REPLACE FUNCTION public.upload_file(bucket_name text, file_path text, file_data bytea, content_type text DEFAULT 'application/octet-stream'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    file_url TEXT;
BEGIN
    -- Insert file into storage
    INSERT INTO storage.objects (bucket_id, name, data, content_type)
    VALUES (bucket_name, file_path, file_data, content_type);
    
    -- Return file URL
    SELECT get_file_url(bucket_name, file_path) INTO file_url;
    RETURN file_url;
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_invitation_code(code_text text, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    code_record invitation_codes%ROWTYPE;
BEGIN
    -- Get the invitation code
    SELECT * INTO code_record
    FROM invitation_codes
    WHERE code = code_text;
    
    -- Check if code exists and is valid
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if code is active and not expired
    IF NOT code_record.is_active OR 
       (code_record.expires_at IS NOT NULL AND code_record.expires_at <= NOW()) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if code has uses remaining
    IF code_record.used_count >= code_record.max_uses THEN
        RETURN FALSE;
    END IF;
    
    -- Update the code usage
    UPDATE invitation_codes
    SET 
        used_count = used_count + 1,
        used_by = user_id,
        used_at = NOW()
    WHERE id = code_record.id;
    
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_invitation_code(code_text text)
 RETURNS TABLE(is_valid boolean, role text, max_uses integer, current_uses integer, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ic.is_active = true 
        AND (ic.expires_at IS NULL OR ic.expires_at > NOW())
        AND ic.used_count < ic.max_uses,
        ic.role,
        ic.max_uses,
        ic.used_count,
        ic.expires_at
    FROM invitation_codes ic
    WHERE ic.code = code_text;
END;
$function$;

DROP TRIGGER IF EXISTS update_automation_workflows_updated_at ON public.automation_workflows;
CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON public.automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaign_templates_updated_at ON public.campaign_templates;
CREATE TRIGGER update_campaign_templates_updated_at BEFORE UPDATE ON public.campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_segments_updated_at ON public.customer_segments;
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON public.customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_ensure_loyalty ON public.customers;
CREATE TRIGGER trg_customers_ensure_loyalty AFTER INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION trg_customers_ensure_loyalty();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enhanced_rewards_updated_at ON public.enhanced_rewards;
CREATE TRIGGER update_enhanced_rewards_updated_at BEFORE UPDATE ON public.enhanced_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_templates_updated_at ON public.event_templates;
CREATE TRIGGER update_event_templates_updated_at BEFORE UPDATE ON public.event_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON public.feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_google_review_settings_updated_at ON public.google_review_settings;
CREATE TRIGGER update_google_review_settings_updated_at BEFORE UPDATE ON public.google_review_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_google_reviews_updated_at ON public.google_reviews;
CREATE TRIGGER update_google_reviews_updated_at BEFORE UPDATE ON public.google_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invitation_codes_updated_at ON public.invitation_codes;
CREATE TRIGGER update_invitation_codes_updated_at BEFORE UPDATE ON public.invitation_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON public.logs_inventory;
CREATE TRIGGER trigger_update_inventory_stock AFTER INSERT ON public.logs_inventory FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();

DROP TRIGGER IF EXISTS trigger_update_inventory_stock_from_logs ON public.logs_inventory;
CREATE TRIGGER trigger_update_inventory_stock_from_logs AFTER INSERT ON public.logs_inventory FOR EACH ROW EXECUTE FUNCTION update_inventory_stock_from_logs();

DROP TRIGGER IF EXISTS update_loyalty_updated_at ON public.loyalty;
CREATE TRIGGER update_loyalty_updated_at BEFORE UPDATE ON public.loyalty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loyalty_rewards_updated_at ON public.loyalty_rewards;
CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON public.loyalty_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON public.marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_emails_updated_at ON public.marketing_emails;
CREATE TRIGGER update_marketing_emails_updated_at BEFORE UPDATE ON public.marketing_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketing_segments_updated_at ON public.marketing_segments;
CREATE TRIGGER update_marketing_segments_updated_at BEFORE UPDATE ON public.marketing_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER update_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_subcategories_updated_at ON public.menu_subcategories;
CREATE TRIGGER update_menu_subcategories_updated_at BEFORE UPDATE ON public.menu_subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletters_updated_at ON public.newsletters;
CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON public.newsletters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_create_staff_record ON public.profiles;
CREATE TRIGGER trigger_create_staff_record AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_staff_profile_creation();

DROP TRIGGER IF EXISTS trigger_update_staff_record ON public.profiles;
CREATE TRIGGER trigger_update_staff_record AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_staff_role_update();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotional_materials_updated_at ON public.promotional_materials;
CREATE TRIGGER update_promotional_materials_updated_at BEFORE UPDATE ON public.promotional_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rewards_updated_at ON public.rewards;
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_event_rsvp_count ON public.rsvps;
CREATE TRIGGER trigger_update_event_rsvp_count AFTER INSERT ON public.rsvps FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

DROP TRIGGER IF EXISTS trigger_update_event_rsvp_count ON public.rsvps;
CREATE TRIGGER trigger_update_event_rsvp_count AFTER DELETE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

DROP TRIGGER IF EXISTS update_rsvps_updated_at ON public.rsvps;
CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shifts_updated_at ON public.shifts;
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_updated_at ON public.staff;
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_performance_updated_at ON public.staff_performance;
CREATE TRIGGER update_staff_performance_updated_at BEFORE UPDATE ON public.staff_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_schedules_updated_at ON public.staff_schedules;
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON public.staff_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_categories_updated_at ON public.task_categories;
CREATE TRIGGER update_task_categories_updated_at BEFORE UPDATE ON public.task_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_check_visit_milestone ON public.visits;
CREATE TRIGGER trigger_check_visit_milestone AFTER INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION check_visit_milestone();

DROP TRIGGER IF EXISTS trigger_update_customer_visit_stats ON public.visits;
CREATE TRIGGER trigger_update_customer_visit_stats AFTER INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION update_customer_visit_stats();

DROP TRIGGER IF EXISTS trigger_update_loyalty_points ON public.visits;
CREATE TRIGGER trigger_update_loyalty_points AFTER INSERT ON public.visits FOR EACH ROW EXECUTE FUNCTION update_loyalty_points();

DROP TRIGGER IF EXISTS update_visits_updated_at ON public.visits;
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
