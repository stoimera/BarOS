-- RLS policies generated from schema CSV

ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "age_verifications_delete_staff" ON public.age_verifications;
CREATE POLICY "age_verifications_delete_staff" ON public.age_verifications FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "age_verifications_insert_staff" ON public.age_verifications;
CREATE POLICY "age_verifications_insert_staff" ON public.age_verifications FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "age_verifications_select_policy" ON public.age_verifications;
CREATE POLICY "age_verifications_select_policy" ON public.age_verifications FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "age_verifications_update_staff" ON public.age_verifications;
CREATE POLICY "age_verifications_update_staff" ON public.age_verifications FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view analytics events" ON public.analytics_events;
CREATE POLICY "Staff can view analytics events" ON public.analytics_events FOR SELECT TO public
  USING (is_staff())
;

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_logs_staff" ON public.attendance_logs;
CREATE POLICY "attendance_logs_staff" ON public.attendance_logs FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO public
  USING (is_admin())
;

ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage automation workflows" ON public.automation_workflows;
CREATE POLICY "Staff can manage automation workflows" ON public.automation_workflows FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_delete_policy" ON public.bookings;
CREATE POLICY "bookings_delete_policy" ON public.bookings FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "bookings_insert_policy" ON public.bookings;
CREATE POLICY "bookings_insert_policy" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
CREATE POLICY "bookings_select_policy" ON public.bookings FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "bookings_update_policy" ON public.bookings;
CREATE POLICY "bookings_update_policy" ON public.bookings FOR UPDATE TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
;

ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campaign_analytics_select_staff" ON public.campaign_analytics;
CREATE POLICY "campaign_analytics_select_staff" ON public.campaign_analytics FOR SELECT TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "campaign_analytics_write_staff" ON public.campaign_analytics;
CREATE POLICY "campaign_analytics_write_staff" ON public.campaign_analytics FOR INSERT TO authenticated
  WITH CHECK (is_staff())
;

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage campaign templates" ON public.campaign_templates;
CREATE POLICY "Staff can manage campaign templates" ON public.campaign_templates FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.compliance_retention_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compliance_retention_runs_admin_insert" ON public.compliance_retention_runs;
CREATE POLICY "compliance_retention_runs_admin_insert" ON public.compliance_retention_runs FOR INSERT TO authenticated
  WITH CHECK (is_admin())
  USING (is_staff())
;
DROP POLICY IF EXISTS "compliance_retention_runs_staff_select" ON public.compliance_retention_runs;
CREATE POLICY "compliance_retention_runs_staff_select" ON public.compliance_retention_runs FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_memberships_staff" ON public.customer_memberships;
CREATE POLICY "customer_memberships_staff" ON public.customer_memberships FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage customer segments" ON public.customer_segments;
CREATE POLICY "Staff can manage customer segments" ON public.customer_segments FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_delete_policy" ON public.customers;
CREATE POLICY "customers_delete_policy" ON public.customers FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK ((is_staff() OR (profile_id = get_user_profile_id())))
;
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;
CREATE POLICY "customers_insert_policy" ON public.customers FOR INSERT TO authenticated
  WITH CHECK ((is_staff() OR (profile_id = get_user_profile_id())))
  USING ((is_staff() OR (profile_id = get_user_profile_id())))
;
DROP POLICY IF EXISTS "customers_select_policy" ON public.customers;
CREATE POLICY "customers_select_policy" ON public.customers FOR SELECT TO authenticated
  USING ((is_staff() OR (profile_id = get_user_profile_id())))
  USING ((is_staff() OR (profile_id = get_user_profile_id())))
;
DROP POLICY IF EXISTS "customers_update_policy" ON public.customers;
CREATE POLICY "customers_update_policy" ON public.customers FOR UPDATE TO authenticated
  USING ((is_staff() OR (profile_id = get_user_profile_id())))
  WITH CHECK ((is_staff() OR (profile_id = get_user_profile_id())))
;

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage email campaigns" ON public.email_campaigns;
CREATE POLICY "Staff can manage email campaigns" ON public.email_campaigns FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.enhanced_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enhanced_rewards_delete_staff" ON public.enhanced_rewards;
CREATE POLICY "enhanced_rewards_delete_staff" ON public.enhanced_rewards FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "enhanced_rewards_insert_staff" ON public.enhanced_rewards;
CREATE POLICY "enhanced_rewards_insert_staff" ON public.enhanced_rewards FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "enhanced_rewards_select_policy" ON public.enhanced_rewards;
CREATE POLICY "enhanced_rewards_select_policy" ON public.enhanced_rewards FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "enhanced_rewards_update_staff" ON public.enhanced_rewards;
CREATE POLICY "enhanced_rewards_update_staff" ON public.enhanced_rewards FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.event_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_templates_delete_staff" ON public.event_templates;
CREATE POLICY "event_templates_delete_staff" ON public.event_templates FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "event_templates_insert_staff" ON public.event_templates;
CREATE POLICY "event_templates_insert_staff" ON public.event_templates FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "event_templates_select_staff" ON public.event_templates;
CREATE POLICY "event_templates_select_staff" ON public.event_templates FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "event_templates_update_staff" ON public.event_templates;
CREATE POLICY "event_templates_update_staff" ON public.event_templates FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.event_ticket_sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_ticket_sales_customer_select" ON public.event_ticket_sales;
CREATE POLICY "event_ticket_sales_customer_select" ON public.event_ticket_sales FOR SELECT TO authenticated
  USING (((customer_id IS NOT NULL) AND (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "event_ticket_sales_staff" ON public.event_ticket_sales;
CREATE POLICY "event_ticket_sales_staff" ON public.event_ticket_sales FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.event_ticket_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_ticket_tiers_auth_select" ON public.event_ticket_tiers;
CREATE POLICY "event_ticket_tiers_auth_select" ON public.event_ticket_tiers FOR SELECT TO authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "event_ticket_tiers_staff_mutate" ON public.event_ticket_tiers;
CREATE POLICY "event_ticket_tiers_staff_mutate" ON public.event_ticket_tiers FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_delete_staff" ON public.events;
CREATE POLICY "events_delete_staff" ON public.events FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "events_insert_staff" ON public.events;
CREATE POLICY "events_insert_staff" ON public.events FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (((is_active = true) OR is_staff()))
;
DROP POLICY IF EXISTS "events_select_policy" ON public.events;
CREATE POLICY "events_select_policy" ON public.events FOR SELECT TO anon, authenticated
  USING (((is_active = true) OR is_staff()))
  USING (is_staff())
;
DROP POLICY IF EXISTS "events_update_staff" ON public.events;
CREATE POLICY "events_update_staff" ON public.events FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback_delete_staff" ON public.feedback;
CREATE POLICY "feedback_delete_staff" ON public.feedback FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "feedback_insert_policy" ON public.feedback;
CREATE POLICY "feedback_insert_policy" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "feedback_select_policy" ON public.feedback;
CREATE POLICY "feedback_select_policy" ON public.feedback FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "feedback_update_staff" ON public.feedback;
CREATE POLICY "feedback_update_staff" ON public.feedback FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage financial transactions" ON public.financial_transactions;
CREATE POLICY "Admins can manage financial transactions" ON public.financial_transactions FOR ALL TO public
  USING (is_admin())
;

ALTER TABLE public.floor_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "floor_sections_staff" ON public.floor_sections;
CREATE POLICY "floor_sections_staff" ON public.floor_sections FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gift_cards_staff" ON public.gift_cards;
CREATE POLICY "gift_cards_staff" ON public.gift_cards FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.google_review_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage review prompts" ON public.google_review_prompts;
CREATE POLICY "Staff can manage review prompts" ON public.google_review_prompts FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.google_review_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage review settings" ON public.google_review_settings;
CREATE POLICY "Staff can manage review settings" ON public.google_review_settings FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "google_reviews_delete_staff" ON public.google_reviews;
CREATE POLICY "google_reviews_delete_staff" ON public.google_reviews FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "google_reviews_insert_staff" ON public.google_reviews;
CREATE POLICY "google_reviews_insert_staff" ON public.google_reviews FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "google_reviews_select_policy" ON public.google_reviews;
CREATE POLICY "google_reviews_select_policy" ON public.google_reviews FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "google_reviews_update_staff" ON public.google_reviews;
CREATE POLICY "google_reviews_update_staff" ON public.google_reviews FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.integration_plugin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "integration_plugin_settings_admin_mutate" ON public.integration_plugin_settings;
CREATE POLICY "integration_plugin_settings_admin_mutate" ON public.integration_plugin_settings FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin())
;
DROP POLICY IF EXISTS "integration_plugin_settings_staff_select" ON public.integration_plugin_settings;
CREATE POLICY "integration_plugin_settings_staff_select" ON public.integration_plugin_settings FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "integrations_delete_admin" ON public.integrations;
CREATE POLICY "integrations_delete_admin" ON public.integrations FOR DELETE TO public
  USING (is_admin())
  WITH CHECK (is_admin())
;
DROP POLICY IF EXISTS "integrations_insert_admin" ON public.integrations;
CREATE POLICY "integrations_insert_admin" ON public.integrations FOR INSERT TO public
  WITH CHECK (is_admin())
  USING ((is_staff() OR is_admin()))
;
DROP POLICY IF EXISTS "integrations_select_staff" ON public.integrations;
CREATE POLICY "integrations_select_staff" ON public.integrations FOR SELECT TO public
  USING ((is_staff() OR is_admin()))
  USING (is_admin())
;
DROP POLICY IF EXISTS "integrations_update_admin" ON public.integrations;
CREATE POLICY "integrations_update_admin" ON public.integrations FOR UPDATE TO public
  USING (is_admin())
  WITH CHECK (is_admin())
;

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_delete_staff" ON public.inventory;
CREATE POLICY "inventory_delete_staff" ON public.inventory FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "inventory_insert_staff" ON public.inventory;
CREATE POLICY "inventory_insert_staff" ON public.inventory FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "inventory_select_staff" ON public.inventory;
CREATE POLICY "inventory_select_staff" ON public.inventory FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "inventory_update_staff" ON public.inventory;
CREATE POLICY "inventory_update_staff" ON public.inventory FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.inventory_waste ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_waste_staff" ON public.inventory_waste;
CREATE POLICY "inventory_waste_staff" ON public.inventory_waste FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invitation_codes_delete_admin" ON public.invitation_codes;
CREATE POLICY "invitation_codes_delete_admin" ON public.invitation_codes FOR DELETE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin())
;
DROP POLICY IF EXISTS "invitation_codes_insert_admin" ON public.invitation_codes;
CREATE POLICY "invitation_codes_insert_admin" ON public.invitation_codes FOR INSERT TO authenticated
  WITH CHECK (is_admin())
  USING (true)
;
DROP POLICY IF EXISTS "invitation_codes_select_public" ON public.invitation_codes;
CREATE POLICY "invitation_codes_select_public" ON public.invitation_codes FOR SELECT TO anon, authenticated
  USING (true)
  USING (is_admin())
;
DROP POLICY IF EXISTS "invitation_codes_update_admin" ON public.invitation_codes;
CREATE POLICY "invitation_codes_update_admin" ON public.invitation_codes FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin())
;

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locations_admin_write" ON public.locations;
CREATE POLICY "locations_admin_write" ON public.locations FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin())
;
DROP POLICY IF EXISTS "locations_staff_select" ON public.locations;
CREATE POLICY "locations_staff_select" ON public.locations FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.logs_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logs_inventory_insert_staff" ON public.logs_inventory;
CREATE POLICY "logs_inventory_insert_staff" ON public.logs_inventory FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "logs_inventory_select_staff" ON public.logs_inventory;
CREATE POLICY "logs_inventory_select_staff" ON public.logs_inventory FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.loyalty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loyalty_delete_staff" ON public.loyalty;
CREATE POLICY "loyalty_delete_staff" ON public.loyalty FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "loyalty_insert_staff" ON public.loyalty;
CREATE POLICY "loyalty_insert_staff" ON public.loyalty FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "loyalty_select_policy" ON public.loyalty;
CREATE POLICY "loyalty_select_policy" ON public.loyalty FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "loyalty_update_staff" ON public.loyalty;
CREATE POLICY "loyalty_update_staff" ON public.loyalty FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loyalty_rewards_delete_staff" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_delete_staff" ON public.loyalty_rewards FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "loyalty_rewards_insert_staff" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_insert_staff" ON public.loyalty_rewards FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (loyalty_id IN ( SELECT loyalty.id
;
DROP POLICY IF EXISTS "loyalty_rewards_select_policy" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_select_policy" ON public.loyalty_rewards FOR SELECT TO authenticated
  USING ((is_staff() OR (loyalty_id IN ( SELECT loyalty.id
;
DROP POLICY IF EXISTS "loyalty_rewards_update_staff" ON public.loyalty_rewards;
CREATE POLICY "loyalty_rewards_update_staff" ON public.loyalty_rewards FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_campaigns_rw_staff" ON public.marketing_campaigns;
CREATE POLICY "marketing_campaigns_rw_staff" ON public.marketing_campaigns FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.marketing_consent_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_consent_events_customer_insert" ON public.marketing_consent_events;
CREATE POLICY "marketing_consent_events_customer_insert" ON public.marketing_consent_events FOR INSERT TO authenticated
  WITH CHECK (((customer_id IS NOT NULL) AND (customer_id = get_user_customer_id())))
  USING (((customer_id IS NOT NULL) AND (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "marketing_consent_events_customer_select" ON public.marketing_consent_events;
CREATE POLICY "marketing_consent_events_customer_select" ON public.marketing_consent_events FOR SELECT TO authenticated
  USING (((customer_id IS NOT NULL) AND (customer_id = get_user_customer_id())))
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "marketing_consent_events_staff_insert" ON public.marketing_consent_events;
CREATE POLICY "marketing_consent_events_staff_insert" ON public.marketing_consent_events FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "marketing_consent_events_staff_select" ON public.marketing_consent_events;
CREATE POLICY "marketing_consent_events_staff_select" ON public.marketing_consent_events FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.marketing_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage marketing emails" ON public.marketing_emails;
CREATE POLICY "Staff can manage marketing emails" ON public.marketing_emails FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.marketing_segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage marketing segments" ON public.marketing_segments;
CREATE POLICY "Staff can manage marketing segments" ON public.marketing_segments FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "membership_plans_staff" ON public.membership_plans;
CREATE POLICY "membership_plans_staff" ON public.membership_plans FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_categories_delete_staff" ON public.menu_categories;
CREATE POLICY "menu_categories_delete_staff" ON public.menu_categories FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "menu_categories_insert_staff" ON public.menu_categories;
CREATE POLICY "menu_categories_insert_staff" ON public.menu_categories FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (true)
;
DROP POLICY IF EXISTS "menu_categories_select_public" ON public.menu_categories;
CREATE POLICY "menu_categories_select_public" ON public.menu_categories FOR SELECT TO anon, authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "menu_categories_update_staff" ON public.menu_categories;
CREATE POLICY "menu_categories_update_staff" ON public.menu_categories FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_item_modifiers_staff" ON public.menu_item_modifiers;
CREATE POLICY "menu_item_modifiers_staff" ON public.menu_item_modifiers FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_item_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_item_tags_delete_staff" ON public.menu_item_tags;
CREATE POLICY "menu_item_tags_delete_staff" ON public.menu_item_tags FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "menu_item_tags_insert_staff" ON public.menu_item_tags;
CREATE POLICY "menu_item_tags_insert_staff" ON public.menu_item_tags FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (true)
;
DROP POLICY IF EXISTS "menu_item_tags_select_public" ON public.menu_item_tags;
CREATE POLICY "menu_item_tags_select_public" ON public.menu_item_tags FOR SELECT TO anon, authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "menu_item_tags_update_staff" ON public.menu_item_tags;
CREATE POLICY "menu_item_tags_update_staff" ON public.menu_item_tags FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_items_delete_staff" ON public.menu_items;
CREATE POLICY "menu_items_delete_staff" ON public.menu_items FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "menu_items_insert_staff" ON public.menu_items;
CREATE POLICY "menu_items_insert_staff" ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (true)
;
DROP POLICY IF EXISTS "menu_items_select_public" ON public.menu_items;
CREATE POLICY "menu_items_select_public" ON public.menu_items FOR SELECT TO anon, authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "menu_items_update_staff" ON public.menu_items;
CREATE POLICY "menu_items_update_staff" ON public.menu_items FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_modifiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_modifiers_staff" ON public.menu_modifiers;
CREATE POLICY "menu_modifiers_staff" ON public.menu_modifiers FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_subcategories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_subcategories_delete_staff" ON public.menu_subcategories;
CREATE POLICY "menu_subcategories_delete_staff" ON public.menu_subcategories FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "menu_subcategories_insert_staff" ON public.menu_subcategories;
CREATE POLICY "menu_subcategories_insert_staff" ON public.menu_subcategories FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (true)
;
DROP POLICY IF EXISTS "menu_subcategories_select_public" ON public.menu_subcategories;
CREATE POLICY "menu_subcategories_select_public" ON public.menu_subcategories FOR SELECT TO anon, authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "menu_subcategories_update_staff" ON public.menu_subcategories;
CREATE POLICY "menu_subcategories_update_staff" ON public.menu_subcategories FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.menu_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "menu_tags_delete_staff" ON public.menu_tags;
CREATE POLICY "menu_tags_delete_staff" ON public.menu_tags FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "menu_tags_insert_staff" ON public.menu_tags;
CREATE POLICY "menu_tags_insert_staff" ON public.menu_tags FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (true)
;
DROP POLICY IF EXISTS "menu_tags_select_public" ON public.menu_tags;
CREATE POLICY "menu_tags_select_public" ON public.menu_tags FOR SELECT TO anon, authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "menu_tags_update_staff" ON public.menu_tags;
CREATE POLICY "menu_tags_update_staff" ON public.menu_tags FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "newsletters_rw_staff" ON public.newsletters;
CREATE POLICY "newsletters_rw_staff" ON public.newsletters FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_settings_delete_own" ON public.notification_settings;
CREATE POLICY "notification_settings_delete_own" ON public.notification_settings FOR DELETE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)))
;
DROP POLICY IF EXISTS "notification_settings_insert_own" ON public.notification_settings;
CREATE POLICY "notification_settings_insert_own" ON public.notification_settings FOR INSERT TO authenticated
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)))
  USING ((user_id = ( SELECT auth.uid() AS uid)))
;
DROP POLICY IF EXISTS "notification_settings_select_own" ON public.notification_settings;
CREATE POLICY "notification_settings_select_own" ON public.notification_settings FOR SELECT TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  USING ((user_id = ( SELECT auth.uid() AS uid)))
;
DROP POLICY IF EXISTS "notification_settings_update_own" ON public.notification_settings;
CREATE POLICY "notification_settings_update_own" ON public.notification_settings FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)))
;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage notification templates" ON public.notification_templates;
CREATE POLICY "Staff can manage notification templates" ON public.notification_templates FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  USING ((user_id = ( SELECT auth.uid() AS uid)))
;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)))
;

ALTER TABLE public.offline_sync_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "offline_sync_batches_staff" ON public.offline_sync_batches;
CREATE POLICY "offline_sync_batches_staff" ON public.offline_sync_batches FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_events_customer_select" ON public.order_events;
CREATE POLICY "order_events_customer_select" ON public.order_events FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
;
DROP POLICY IF EXISTS "order_events_staff_insert" ON public.order_events;
CREATE POLICY "order_events_staff_insert" ON public.order_events FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "order_events_staff_select" ON public.order_events;
CREATE POLICY "order_events_staff_select" ON public.order_events FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_customer_select" ON public.order_items;
CREATE POLICY "order_items_customer_select" ON public.order_items FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
;
DROP POLICY IF EXISTS "order_items_staff_all" ON public.order_items;
CREATE POLICY "order_items_staff_all" ON public.order_items FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_customer_select" ON public.orders;
CREATE POLICY "orders_customer_select" ON public.orders FOR SELECT TO authenticated
  USING (((customer_id IS NOT NULL) AND (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "orders_staff_all" ON public.orders;
CREATE POLICY "orders_staff_all" ON public.orders FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_transactions_select_policy" ON public.payment_transactions;
CREATE POLICY "payment_transactions_select_policy" ON public.payment_transactions FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;

ALTER TABLE public.pricing_windows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pricing_windows_staff" ON public.pricing_windows;
CREATE POLICY "pricing_windows_staff" ON public.pricing_windows FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated
  USING (is_admin())
  WITH CHECK ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
  USING ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated
  USING ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
  USING ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated
  USING ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
  WITH CHECK ((is_admin() OR (user_id = ( SELECT auth.uid() AS uid))))
;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_auth_select" ON public.promo_codes;
CREATE POLICY "promo_codes_auth_select" ON public.promo_codes FOR SELECT TO authenticated
  USING (true)
  USING (is_staff())
;
DROP POLICY IF EXISTS "promo_codes_staff_mutate" ON public.promo_codes;
CREATE POLICY "promo_codes_staff_mutate" ON public.promo_codes FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.promotional_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promotional_materials_rw_staff" ON public.promotional_materials;
CREATE POLICY "promotional_materials_rw_staff" ON public.promotional_materials FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promotions_rw_staff" ON public.promotions;
CREATE POLICY "promotions_rw_staff" ON public.promotions FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_order_items_staff" ON public.purchase_order_items;
CREATE POLICY "purchase_order_items_staff" ON public.purchase_order_items FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_orders_staff" ON public.purchase_orders;
CREATE POLICY "purchase_orders_staff" ON public.purchase_orders FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions FOR ALL TO authenticated
  USING ((profile_id IN ( SELECT profiles.id
;

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipe_ingredients_staff" ON public.recipe_ingredients;
CREATE POLICY "recipe_ingredients_staff" ON public.recipe_ingredients FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipes_staff" ON public.recipes;
CREATE POLICY "recipes_staff" ON public.recipes FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_delete_staff" ON public.referrals;
CREATE POLICY "referrals_delete_staff" ON public.referrals FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK ((is_staff() OR (referrer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "referrals_insert_policy" ON public.referrals;
CREATE POLICY "referrals_insert_policy" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK ((is_staff() OR (referrer_id = get_user_customer_id())))
  USING ((is_staff() OR (referrer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "referrals_select_policy" ON public.referrals;
CREATE POLICY "referrals_select_policy" ON public.referrals FOR SELECT TO authenticated
  USING ((is_staff() OR (referrer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "referrals_update_staff" ON public.referrals;
CREATE POLICY "referrals_update_staff" ON public.referrals FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rewards_delete_staff" ON public.rewards;
CREATE POLICY "rewards_delete_staff" ON public.rewards FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "rewards_insert_staff" ON public.rewards;
CREATE POLICY "rewards_insert_staff" ON public.rewards FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "rewards_select_policy" ON public.rewards;
CREATE POLICY "rewards_select_policy" ON public.rewards FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "rewards_update_staff" ON public.rewards;
CREATE POLICY "rewards_update_staff" ON public.rewards FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rsvps_delete_staff" ON public.rsvps;
CREATE POLICY "rsvps_delete_staff" ON public.rsvps FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "rsvps_insert_policy" ON public.rsvps;
CREATE POLICY "rsvps_insert_policy" ON public.rsvps FOR INSERT TO authenticated
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "rsvps_select_policy" ON public.rsvps;
CREATE POLICY "rsvps_select_policy" ON public.rsvps FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "rsvps_update_policy" ON public.rsvps;
CREATE POLICY "rsvps_update_policy" ON public.rsvps FOR UPDATE TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  WITH CHECK ((is_staff() OR (customer_id = get_user_customer_id())))
;

ALTER TABLE public.sales_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_receipts_staff" ON public.sales_receipts;
CREATE POLICY "sales_receipts_staff" ON public.sales_receipts FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can create shifts" ON public.shifts;
CREATE POLICY "Staff can create shifts" ON public.shifts FOR INSERT TO public
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "Staff can delete shifts" ON public.shifts;
CREATE POLICY "Staff can delete shifts" ON public.shifts FOR DELETE TO public
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "Staff can update shifts" ON public.shifts;
CREATE POLICY "Staff can update shifts" ON public.shifts FOR UPDATE TO public
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "Staff can view all shifts" ON public.shifts;
CREATE POLICY "Staff can view all shifts" ON public.shifts FOR SELECT TO public
  USING (is_staff())
;

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_posts_delete_admin" ON public.social_posts;
CREATE POLICY "social_posts_delete_admin" ON public.social_posts FOR DELETE TO public
  USING (is_admin())
  WITH CHECK (is_admin())
;
DROP POLICY IF EXISTS "social_posts_insert_admin" ON public.social_posts;
CREATE POLICY "social_posts_insert_admin" ON public.social_posts FOR INSERT TO public
  WITH CHECK (is_admin())
  USING (((status = 'posted'::text) OR is_staff() OR is_admin()))
;
DROP POLICY IF EXISTS "social_posts_select_public" ON public.social_posts;
CREATE POLICY "social_posts_select_public" ON public.social_posts FOR SELECT TO public
  USING (((status = 'posted'::text) OR is_staff() OR is_admin()))
  USING (is_admin())
;
DROP POLICY IF EXISTS "social_posts_update_admin" ON public.social_posts;
CREATE POLICY "social_posts_update_admin" ON public.social_posts FOR UPDATE TO public
  USING (is_admin())
  WITH CHECK (is_admin())
;

ALTER TABLE public.split_bill_allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "split_allocations_staff" ON public.split_bill_allocations;
CREATE POLICY "split_allocations_staff" ON public.split_bill_allocations FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_delete_policy" ON public.staff;
CREATE POLICY "staff_delete_policy" ON public.staff FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "staff_insert_policy" ON public.staff;
CREATE POLICY "staff_insert_policy" ON public.staff FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "staff_select_policy" ON public.staff;
CREATE POLICY "staff_select_policy" ON public.staff FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "staff_update_policy" ON public.staff;
CREATE POLICY "staff_update_policy" ON public.staff FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.staff_break_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_break_logs_staff" ON public.staff_break_logs;
CREATE POLICY "staff_break_logs_staff" ON public.staff_break_logs FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.staff_performance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_performance_delete_staff" ON public.staff_performance;
CREATE POLICY "staff_performance_delete_staff" ON public.staff_performance FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "staff_performance_insert_staff" ON public.staff_performance;
CREATE POLICY "staff_performance_insert_staff" ON public.staff_performance FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "staff_performance_select_staff" ON public.staff_performance;
CREATE POLICY "staff_performance_select_staff" ON public.staff_performance FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "staff_performance_update_staff" ON public.staff_performance;
CREATE POLICY "staff_performance_update_staff" ON public.staff_performance FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_schedules_delete_staff" ON public.staff_schedules;
CREATE POLICY "staff_schedules_delete_staff" ON public.staff_schedules FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "staff_schedules_insert_staff" ON public.staff_schedules;
CREATE POLICY "staff_schedules_insert_staff" ON public.staff_schedules FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "staff_schedules_select_staff" ON public.staff_schedules;
CREATE POLICY "staff_schedules_select_staff" ON public.staff_schedules FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "staff_schedules_update_staff" ON public.staff_schedules;
CREATE POLICY "staff_schedules_update_staff" ON public.staff_schedules FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stock_movements_staff_insert" ON public.stock_movements;
CREATE POLICY "stock_movements_staff_insert" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "stock_movements_staff_select" ON public.stock_movements;
CREATE POLICY "stock_movements_staff_select" ON public.stock_movements FOR SELECT TO authenticated
  USING (is_staff())
;

ALTER TABLE public.stocktakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stocktakes_staff" ON public.stocktakes;
CREATE POLICY "stocktakes_staff" ON public.stocktakes FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_staff" ON public.suppliers;
CREATE POLICY "suppliers_staff" ON public.suppliers FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tabs_customer_select" ON public.tabs;
CREATE POLICY "tabs_customer_select" ON public.tabs FOR SELECT TO authenticated
  USING (((order_id IS NOT NULL) AND (EXISTS ( SELECT 1
;
DROP POLICY IF EXISTS "tabs_staff_all" ON public.tabs;
CREATE POLICY "tabs_staff_all" ON public.tabs FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_categories_delete_admin" ON public.task_categories;
CREATE POLICY "task_categories_delete_admin" ON public.task_categories FOR DELETE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin())
;
DROP POLICY IF EXISTS "task_categories_insert_admin" ON public.task_categories;
CREATE POLICY "task_categories_insert_admin" ON public.task_categories FOR INSERT TO authenticated
  WITH CHECK (is_admin())
  USING (is_staff())
;
DROP POLICY IF EXISTS "task_categories_select_staff" ON public.task_categories;
CREATE POLICY "task_categories_select_staff" ON public.task_categories FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_admin())
;
DROP POLICY IF EXISTS "task_categories_update_admin" ON public.task_categories;
CREATE POLICY "task_categories_update_admin" ON public.task_categories FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin())
;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_delete_staff" ON public.tasks;
CREATE POLICY "tasks_delete_staff" ON public.tasks FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "tasks_insert_staff" ON public.tasks;
CREATE POLICY "tasks_insert_staff" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "tasks_select_staff" ON public.tasks;
CREATE POLICY "tasks_select_staff" ON public.tasks FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "tasks_update_staff" ON public.tasks;
CREATE POLICY "tasks_update_staff" ON public.tasks FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timesheets_staff" ON public.timesheets;
CREATE POLICY "timesheets_staff" ON public.timesheets FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.tip_pool_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tip_entries_staff" ON public.tip_pool_entries;
CREATE POLICY "tip_entries_staff" ON public.tip_pool_entries FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.venue_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venue_tables_staff" ON public.venue_tables;
CREATE POLICY "venue_tables_staff" ON public.venue_tables FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.visit_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visit_milestones_delete_staff" ON public.visit_milestones;
CREATE POLICY "visit_milestones_delete_staff" ON public.visit_milestones FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "visit_milestones_insert_staff" ON public.visit_milestones;
CREATE POLICY "visit_milestones_insert_staff" ON public.visit_milestones FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "visit_milestones_select_policy" ON public.visit_milestones;
CREATE POLICY "visit_milestones_select_policy" ON public.visit_milestones FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "visit_milestones_update_staff" ON public.visit_milestones;
CREATE POLICY "visit_milestones_update_staff" ON public.visit_milestones FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.visit_qr_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage visit QR codes" ON public.visit_qr_codes;
CREATE POLICY "Staff can manage visit QR codes" ON public.visit_qr_codes FOR ALL TO public
  USING (is_staff())
;

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visits_delete_staff" ON public.visits;
CREATE POLICY "visits_delete_staff" ON public.visits FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;
DROP POLICY IF EXISTS "visits_insert_staff" ON public.visits;
CREATE POLICY "visits_insert_staff" ON public.visits FOR INSERT TO authenticated
  WITH CHECK (is_staff())
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
;
DROP POLICY IF EXISTS "visits_select_policy" ON public.visits;
CREATE POLICY "visits_select_policy" ON public.visits FOR SELECT TO authenticated
  USING ((is_staff() OR (customer_id = get_user_customer_id())))
  USING (is_staff())
;
DROP POLICY IF EXISTS "visits_update_staff" ON public.visits;
CREATE POLICY "visits_update_staff" ON public.visits FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_delete_staff" ON public.waitlist;
CREATE POLICY "waitlist_delete_staff" ON public.waitlist FOR DELETE TO authenticated
  USING (is_staff())
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL))
;
DROP POLICY IF EXISTS "waitlist_insert_authenticated" ON public.waitlist;
CREATE POLICY "waitlist_insert_authenticated" ON public.waitlist FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL))
  USING (is_staff())
;
DROP POLICY IF EXISTS "waitlist_select_staff" ON public.waitlist;
CREATE POLICY "waitlist_select_staff" ON public.waitlist FOR SELECT TO authenticated
  USING (is_staff())
  USING (is_staff())
;
DROP POLICY IF EXISTS "waitlist_update_staff" ON public.waitlist;
CREATE POLICY "waitlist_update_staff" ON public.waitlist FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff())
;

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage webhooks" ON public.webhooks;
CREATE POLICY "Admins can manage webhooks" ON public.webhooks FOR ALL TO public
  USING (is_admin())
;
