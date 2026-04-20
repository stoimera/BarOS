-- Canonical table definitions generated from Supabase schema CSV
-- Source: Supabase Snippet Schema Documentation Generator (Public Schema).csv

CREATE TABLE IF NOT EXISTS public.age_verifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  verification_date date NOT NULL,
  verified_by uuid,
  verified_age int4,
  document_type text,
  is_verified bool DEFAULT false,
  notes text,
  verification_method text DEFAULT 'id_check'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_name text NOT NULL,
  event_data jsonb,
  user_id uuid,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  anomaly_flag bool DEFAULT false,
  anomaly_reason text
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  record_id uuid,
  action text NOT NULL,
  table_name text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  organization_id uuid,
  resource_type text,
  changes jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.automation_workflows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_conditions jsonb NOT NULL,
  actions jsonb NOT NULL,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  party_size int4 DEFAULT 1,
  status text DEFAULT 'confirmed'::text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  table_id uuid,
  walk_in bool NOT NULL DEFAULT false,
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.campaign_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  campaign_id uuid,
  metric_name text NOT NULL,
  metric_value numeric,
  metric_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  template_type text NOT NULL,
  content jsonb NOT NULL,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compliance_retention_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  scope_summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_profile_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_memberships (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  started_at timestamptz NOT NULL DEFAULT now(),
  renewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  address text,
  loyalty_points int4 DEFAULT 0,
  total_visits int4 DEFAULT 0,
  first_visit_date date,
  last_visit_date date,
  tags _text DEFAULT '{}'::text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  legal_hold bool NOT NULL DEFAULT false,
  legal_hold_reason text,
  legal_hold_set_at timestamptz,
  ccpa_do_not_sell_or_share bool NOT NULL DEFAULT false,
  ccpa_limit_sensitive_use bool NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  customer_id uuid,
  status text DEFAULT 'draft'::text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enhanced_rewards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  category text NOT NULL,
  description text NOT NULL,
  value numeric,
  status text DEFAULT 'active'::text,
  requires_age_verification bool DEFAULT false,
  min_age int4 DEFAULT 0,
  claimed_at timestamptz,
  claimed_by_staff_id uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  redemption_code text NOT NULL,
  claimed bool DEFAULT false,
  punch_kind text
);

CREATE TABLE IF NOT EXISTS public.event_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'general'::text,
  max_capacity int4,
  price numeric DEFAULT 0.00,
  duration_hours int4 DEFAULT 2,
  recurrence_pattern text,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_ticket_sales (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_tier_id uuid NOT NULL,
  customer_id uuid,
  promo_code_id uuid,
  quantity int4 NOT NULL,
  unit_price numeric NOT NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'reserved'::text,
  fraud_flag bool NOT NULL DEFAULT false,
  checkin_count int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  purchase_source text NOT NULL DEFAULT 'inventory'::text,
  checkin_token_hash text
);

CREATE TABLE IF NOT EXISTS public.event_ticket_tiers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid,
  tier_name text NOT NULL,
  inventory_count int4 NOT NULL,
  price numeric NOT NULL,
  reserved_count int4 NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  category text DEFAULT 'general'::text,
  max_capacity int4,
  current_rsvps int4 DEFAULT 0,
  price numeric DEFAULT 0.00,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  visit_id uuid,
  rating int4,
  comment text,
  feedback_type text DEFAULT 'general'::text,
  is_public bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  booking_id uuid,
  event_id uuid,
  google_review_prompted bool DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  payment_method text,
  reference text,
  transaction_date date NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source text,
  customer_id uuid,
  booking_id uuid,
  event_id uuid,
  supplier text,
  invoice_number text,
  tax_amount numeric
);

CREATE TABLE IF NOT EXISTS public.floor_sections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code_hash text NOT NULL,
  balance_cents int4 NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  status text NOT NULL DEFAULT 'active'::text,
  customer_id uuid,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_review_prompts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  visit_id uuid,
  prompt_text text NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_review_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  setting_key text NOT NULL,
  setting_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  visit_id uuid,
  review_id text,
  rating int4,
  review_text text,
  review_url text,
  status text DEFAULT 'pending'::text,
  prompt_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  response_status int4 NOT NULL,
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_plugin_settings (
  plugin_id text NOT NULL,
  enabled bool NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  integration_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active bool DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  current_stock int4 DEFAULT 0,
  min_stock_level int4 DEFAULT 0,
  unit_price numeric,
  cost numeric,
  supplier text,
  location text,
  expiry_date date,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.inventory_waste (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_id uuid,
  quantity int4 NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL,
  role text DEFAULT 'staff'::text,
  max_uses int4 DEFAULT 1,
  used_count int4 DEFAULT 0,
  expires_at timestamptz,
  is_active bool DEFAULT true,
  created_by uuid,
  used_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC'::text,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.logs_inventory (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_id uuid,
  action text NOT NULL,
  quantity_change int4 NOT NULL,
  previous_quantity int4,
  new_quantity int4,
  reason text,
  notes text,
  performed_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  punch_count int4 DEFAULT 0,
  goal int4 DEFAULT 10,
  rewarded bool DEFAULT false,
  tier text DEFAULT 'bronze'::text,
  total_points int4 DEFAULT 0,
  lifetime_visits int4 DEFAULT 0,
  last_visit date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  coffee_punch_count int4 DEFAULT 0,
  coffee_goal int4 DEFAULT 10,
  coffee_rewarded bool DEFAULT false,
  alcohol_punch_count int4 DEFAULT 0,
  alcohol_goal int4 DEFAULT 10,
  alcohol_rewarded bool DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  loyalty_id uuid,
  reward_type text NOT NULL,
  title text NOT NULL,
  description text,
  value numeric,
  points_required int4 DEFAULT 0,
  is_active bool DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL,
  status text DEFAULT 'draft'::text,
  start_date date,
  end_date date,
  budget numeric,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  sent_count int4 DEFAULT 0,
  opened_count int4 DEFAULT 0,
  clicked_count int4 DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.marketing_consent_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  channel text NOT NULL,
  consent_state bool NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_emails (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  campaign_id uuid,
  customer_id uuid,
  email_address text NOT NULL,
  status text DEFAULT 'pending'::text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_segments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  billing_interval text NOT NULL DEFAULT 'monthly'::text,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  sort_order int4 DEFAULT 0,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_item_modifiers (
  menu_item_id uuid NOT NULL,
  modifier_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.menu_item_tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  menu_item_id uuid,
  tag_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  subcategory text,
  price numeric NOT NULL,
  cost numeric DEFAULT 0.00,
  tags _text DEFAULT '{}'::text[],
  is_available bool DEFAULT true,
  is_featured bool DEFAULT false,
  requires_age_verification bool DEFAULT false,
  min_age int4 DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  allergens _text DEFAULT '{}'::text[],
  created_by uuid,
  deleted_at timestamptz,
  is_eighty_sixed bool NOT NULL DEFAULT false,
  eighty_sixed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.menu_modifiers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  price_delta numeric NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_subcategories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid,
  name text NOT NULL,
  description text,
  sort_order int4 DEFAULT 0,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menu_tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  color text DEFAULT '#3B82F6'::text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.newsletters (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'draft'::text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  email_notifications bool DEFAULT true,
  push_notifications bool DEFAULT true,
  sms_notifications bool DEFAULT false,
  booking_reminders bool DEFAULT true,
  event_updates bool DEFAULT true,
  loyalty_rewards bool DEFAULT true,
  system_updates bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  app_preferences jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  title_template text NOT NULL,
  message_template text NOT NULL,
  type text DEFAULT 'info'::text,
  category text DEFAULT 'general'::text,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  variables _text DEFAULT '{}'::text[]
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info'::text,
  category text DEFAULT 'general'::text,
  is_read bool DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  action_url text,
  action_text text,
  metadata jsonb,
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.offline_sync_batches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  device_id text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'::text,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_profile_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  menu_item_id uuid,
  item_name text NOT NULL,
  quantity int4 NOT NULL,
  unit_price numeric NOT NULL,
  line_total numeric NOT NULL,
  adjustment_reason text,
  adjusted_at timestamptz,
  station text
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  table_id uuid,
  status text NOT NULL DEFAULT 'open'::text,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  tip numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  version int4 NOT NULL DEFAULT 0,
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'pending'::text,
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  order_id uuid,
  lifecycle_status text DEFAULT 'authorized'::text,
  reconciliation_status text DEFAULT 'pending'::text,
  processor_fee numeric DEFAULT 0,
  version int4 NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pricing_windows (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  location_id uuid,
  label text NOT NULL,
  starts_at time NOT NULL,
  ends_at time NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0,
  applies_to_category text,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  role text DEFAULT 'customer'::text,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  birthday date,
  tags _text DEFAULT '{}'::text[],
  notes text,
  preferences jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL,
  event_id uuid,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  max_redemptions int4 NOT NULL DEFAULT 1,
  redeemed_count int4 NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  max_uses_per_customer int4
);

CREATE TABLE IF NOT EXISTS public.promotional_materials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  material_type text NOT NULL,
  file_url text,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  discount_type text NOT NULL,
  discount_value numeric,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active bool DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  purchase_order_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  description text,
  ordered_quantity int4 NOT NULL,
  received_quantity int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  supplier_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  ordered_at timestamptz DEFAULT now(),
  received_at timestamptz,
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recipe_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  units_per_sale numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  output_menu_item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  referrer_id uuid,
  referee_email text NOT NULL,
  referee_name text,
  status text DEFAULT 'pending'::text,
  completed_at timestamptz,
  reward_claimed bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  referee_id uuid
);

CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  value numeric,
  status text DEFAULT 'active'::text,
  requires_age_verification bool DEFAULT false,
  min_age int4 DEFAULT 0,
  claimed_at timestamptz,
  claimed_by_staff_id uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.rsvps (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid,
  customer_id uuid,
  status text DEFAULT 'confirmed'::text,
  checkin_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_receipts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  fiscal_reference text,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  role text NOT NULL DEFAULT 'staff'::text,
  notes text,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  platform text NOT NULL,
  content text NOT NULL,
  media_urls _text,
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text DEFAULT 'draft'::text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  external_post_id text,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.split_bill_allocations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  payment_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  allocated_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid,
  position text NOT NULL,
  hire_date date NOT NULL,
  permissions _text DEFAULT '{}'::text[],
  hourly_rate numeric,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid,
  deleted_at timestamptz,
  location_id uuid
);

CREATE TABLE IF NOT EXISTS public.staff_break_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  attendance_log_id uuid NOT NULL,
  break_type text NOT NULL DEFAULT 'rest'::text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_performance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid,
  period_start date NOT NULL,
  period_end date NOT NULL,
  customers_served int4 DEFAULT 0,
  events_managed int4 DEFAULT 0,
  bookings_handled int4 DEFAULT 0,
  customer_rating numeric,
  manager_rating numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  position text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_id uuid NOT NULL,
  quantity_delta int4 NOT NULL,
  movement_type text NOT NULL,
  reference_type text,
  reference_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.stocktakes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  inventory_id uuid,
  counted_quantity int4 NOT NULL,
  expected_quantity int4,
  variance int4,
  counted_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'counted'::text,
  committed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  created_at timestamptz DEFAULT now(),
  contact_name text
);

CREATE TABLE IF NOT EXISTS public.tabs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  status text NOT NULL DEFAULT 'open'::text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  version int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  preauth_hold_cents int4 NOT NULL DEFAULT 0,
  preauth_status text NOT NULL DEFAULT 'none'::text
);

CREATE TABLE IF NOT EXISTS public.task_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  assigned_to uuid,
  assigned_by uuid,
  priority text DEFAULT 'medium'::text,
  status text DEFAULT 'pending'::text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  time text,
  category text DEFAULT 'general'::text,
  tags _text DEFAULT '{}'::text[],
  created_by uuid,
  related_event_id uuid,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.timesheets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid,
  period_start date NOT NULL,
  period_end date NOT NULL,
  regular_hours numeric DEFAULT 0,
  overtime_hours numeric DEFAULT 0,
  export_status text DEFAULT 'pending'::text,
  lifecycle_status text NOT NULL DEFAULT 'draft'::text,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  locked_at timestamptz,
  payroll_exported_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.tip_pool_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  amount numeric NOT NULL,
  pool_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venue_tables (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  section_id uuid,
  table_number text NOT NULL,
  capacity int4 NOT NULL,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visit_milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  milestone_type text NOT NULL,
  visit_count int4 NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visit_qr_codes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  visit_id uuid,
  qr_code text NOT NULL,
  is_active bool DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  staff_id uuid,
  visit_date date NOT NULL,
  visit_time time DEFAULT CURRENT_TIME,
  visit_type text DEFAULT 'regular'::text,
  loyalty_points_earned int4 DEFAULT 0,
  notes text,
  check_in_time timestamptz,
  check_out_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  date date NOT NULL,
  time time NOT NULL,
  party_size int4 DEFAULT 1,
  notes text,
  priority text DEFAULT 'medium'::text,
  status text DEFAULT 'waiting'::text,
  notified_at timestamptz,
  booked_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  priority_rank int4 NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  url text NOT NULL,
  events _text NOT NULL,
  is_active bool DEFAULT true,
  secret_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
