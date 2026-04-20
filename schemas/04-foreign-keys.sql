-- Check constraints and foreign keys generated from schema CSV

ALTER TABLE public.age_verifications ADD CONSTRAINT age_verifications_check_1 CHECK ((verification_method = ANY (ARRAY['id_check'::text, 'self_declaration'::text, 'manager_override'::text])));
ALTER TABLE public.age_verifications ADD CONSTRAINT age_verifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.age_verifications ADD CONSTRAINT age_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.staff(id) ON DELETE NO ACTION;


ALTER TABLE public.attendance_logs ADD CONSTRAINT attendance_logs_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.automation_workflows ADD CONSTRAINT automation_workflows_check_1 CHECK ((trigger_type = ANY (ARRAY['visit'::text, 'booking'::text, 'event'::text, 'loyalty'::text, 'custom'::text])));
ALTER TABLE public.automation_workflows ADD CONSTRAINT automation_workflows_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_check_1 CHECK (((party_size > 0) AND (party_size <= 50)));
ALTER TABLE public.bookings ADD CONSTRAINT bookings_check_2 CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text])));
ALTER TABLE public.bookings ADD CONSTRAINT bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.venue_tables(id) ON DELETE SET NULL;

ALTER TABLE public.campaign_analytics ADD CONSTRAINT campaign_analytics_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.campaign_templates ADD CONSTRAINT campaign_templates_check_1 CHECK ((template_type = ANY (ARRAY['email'::text, 'social'::text, 'sms'::text, 'promotion'::text])));
ALTER TABLE public.campaign_templates ADD CONSTRAINT campaign_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.compliance_retention_runs ADD CONSTRAINT compliance_retention_runs_created_by_profile_id_fkey FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.customer_memberships ADD CONSTRAINT customer_memberships_check_1 CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'cancelled'::text])));
ALTER TABLE public.customer_memberships ADD CONSTRAINT customer_memberships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.customer_memberships ADD CONSTRAINT customer_memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id) ON DELETE RESTRICT;


ALTER TABLE public.customers ADD CONSTRAINT customers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.email_campaigns ADD CONSTRAINT email_campaigns_check_1 CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sent'::text, 'cancelled'::text])));
ALTER TABLE public.email_campaigns ADD CONSTRAINT email_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.email_campaigns ADD CONSTRAINT email_campaigns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.enhanced_rewards ADD CONSTRAINT enhanced_rewards_check_1 CHECK ((category = ANY (ARRAY['birthday'::text, 'loyalty_punch_card'::text, 'free_coffee'::text, 'free_alcoholic_drink'::text, 'free_item'::text, 'discount'::text, 'vip_access'::text, 'referral'::text, 'milestone'::text, 'custom'::text])));
ALTER TABLE public.enhanced_rewards ADD CONSTRAINT enhanced_rewards_check_2 CHECK (((punch_kind IS NULL) OR (punch_kind = ANY (ARRAY['coffee'::text, 'alcohol'::text]))));
ALTER TABLE public.enhanced_rewards ADD CONSTRAINT enhanced_rewards_check_3 CHECK ((status = ANY (ARRAY['active'::text, 'claimed'::text, 'expired'::text, 'cancelled'::text])));
ALTER TABLE public.enhanced_rewards ADD CONSTRAINT enhanced_rewards_claimed_by_staff_id_fkey FOREIGN KEY (claimed_by_staff_id) REFERENCES public.staff(id) ON DELETE NO ACTION;
ALTER TABLE public.enhanced_rewards ADD CONSTRAINT enhanced_rewards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.event_templates ADD CONSTRAINT event_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.event_ticket_sales ADD CONSTRAINT event_ticket_sales_check_1 CHECK ((purchase_source = ANY (ARRAY['inventory'::text, 'reserved'::text])));
ALTER TABLE public.event_ticket_sales ADD CONSTRAINT event_ticket_sales_check_2 CHECK ((quantity > 0));
ALTER TABLE public.event_ticket_sales ADD CONSTRAINT event_ticket_sales_check_3 CHECK ((status = ANY (ARRAY['reserved'::text, 'paid'::text, 'refunded'::text, 'cancelled'::text])));
ALTER TABLE public.event_ticket_sales ADD CONSTRAINT event_ticket_sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.event_ticket_sales ADD CONSTRAINT event_ticket_sales_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE SET NULL;
ALTER TABLE public.event_ticket_sales ADD CONSTRAINT event_ticket_sales_ticket_tier_id_fkey FOREIGN KEY (ticket_tier_id) REFERENCES public.event_ticket_tiers(id) ON DELETE CASCADE;

ALTER TABLE public.event_ticket_tiers ADD CONSTRAINT event_ticket_tiers_check_1 CHECK ((inventory_count >= 0));
ALTER TABLE public.event_ticket_tiers ADD CONSTRAINT event_ticket_tiers_check_2 CHECK ((reserved_count >= 0));
ALTER TABLE public.event_ticket_tiers ADD CONSTRAINT event_ticket_tiers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.events ADD CONSTRAINT events_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

ALTER TABLE public.feedback ADD CONSTRAINT feedback_check_1 CHECK ((feedback_type = ANY (ARRAY['general'::text, 'service'::text, 'food'::text, 'drinks'::text, 'atmosphere'::text])));
ALTER TABLE public.feedback ADD CONSTRAINT feedback_check_2 CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.feedback ADD CONSTRAINT feedback_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL;

ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_check_1 CHECK ((transaction_type = ANY (ARRAY['income'::text, 'expense'::text, 'refund'::text, 'adjustment'::text])));
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.financial_transactions ADD CONSTRAINT financial_transactions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE public.floor_sections ADD CONSTRAINT floor_sections_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

ALTER TABLE public.gift_cards ADD CONSTRAINT gift_cards_check_1 CHECK ((balance_cents >= 0));
ALTER TABLE public.gift_cards ADD CONSTRAINT gift_cards_check_2 CHECK ((status = ANY (ARRAY['active'::text, 'redeemed'::text, 'void'::text])));
ALTER TABLE public.gift_cards ADD CONSTRAINT gift_cards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE public.google_review_prompts ADD CONSTRAINT google_review_prompts_check_1 CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'completed'::text, 'failed'::text])));
ALTER TABLE public.google_review_prompts ADD CONSTRAINT google_review_prompts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.google_review_prompts ADD CONSTRAINT google_review_prompts_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL;


ALTER TABLE public.google_reviews ADD CONSTRAINT google_reviews_check_1 CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public.google_reviews ADD CONSTRAINT google_reviews_check_2 CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'dismissed'::text])));
ALTER TABLE public.google_reviews ADD CONSTRAINT google_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.google_reviews ADD CONSTRAINT google_reviews_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL;


ALTER TABLE public.integration_plugin_settings ADD CONSTRAINT integration_plugin_settings_check_1 CHECK ((plugin_id = ANY (ARRAY['stripe'::text, 'twilio'::text, 'resend'::text, 'google_reviews'::text])));

ALTER TABLE public.integrations ADD CONSTRAINT integrations_check_1 CHECK ((integration_type = ANY (ARRAY['payment'::text, 'email'::text, 'analytics'::text, 'social'::text, 'other'::text])));

ALTER TABLE public.inventory ADD CONSTRAINT inventory_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_waste ADD CONSTRAINT inventory_waste_check_1 CHECK ((quantity > 0));
ALTER TABLE public.inventory_waste ADD CONSTRAINT inventory_waste_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;

ALTER TABLE public.invitation_codes ADD CONSTRAINT invitation_codes_check_1 CHECK ((role = ANY (ARRAY['staff'::text, 'admin'::text])));
ALTER TABLE public.invitation_codes ADD CONSTRAINT invitation_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.invitation_codes ADD CONSTRAINT invitation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;


ALTER TABLE public.logs_inventory ADD CONSTRAINT logs_inventory_check_1 CHECK ((action = ANY (ARRAY['add'::text, 'remove'::text, 'adjust'::text, 'correction'::text])));
ALTER TABLE public.logs_inventory ADD CONSTRAINT logs_inventory_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;
ALTER TABLE public.logs_inventory ADD CONSTRAINT logs_inventory_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.loyalty ADD CONSTRAINT loyalty_check_1 CHECK ((tier = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text])));
ALTER TABLE public.loyalty ADD CONSTRAINT loyalty_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_check_1 CHECK ((reward_type = ANY (ARRAY['punch_card'::text, 'discount'::text, 'free_entry'::text, 'free_drink'::text, 'free_food'::text, 'vip_access'::text])));
ALTER TABLE public.loyalty_rewards ADD CONSTRAINT loyalty_rewards_loyalty_id_fkey FOREIGN KEY (loyalty_id) REFERENCES public.loyalty(id) ON DELETE CASCADE;

ALTER TABLE public.marketing_campaigns ADD CONSTRAINT marketing_campaigns_check_1 CHECK ((campaign_type = ANY (ARRAY['email'::text, 'social'::text, 'sms'::text, 'promotion'::text])));
ALTER TABLE public.marketing_campaigns ADD CONSTRAINT marketing_campaigns_check_2 CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text])));
ALTER TABLE public.marketing_campaigns ADD CONSTRAINT marketing_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.marketing_consent_events ADD CONSTRAINT marketing_consent_events_check_1 CHECK ((channel = ANY (ARRAY['email'::text, 'sms'::text, 'push'::text])));
ALTER TABLE public.marketing_consent_events ADD CONSTRAINT marketing_consent_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.marketing_emails ADD CONSTRAINT marketing_emails_check_1 CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text])));
ALTER TABLE public.marketing_emails ADD CONSTRAINT marketing_emails_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE;
ALTER TABLE public.marketing_emails ADD CONSTRAINT marketing_emails_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_check_1 CHECK ((billing_interval = ANY (ARRAY['monthly'::text, 'annual'::text])));


ALTER TABLE public.menu_item_modifiers ADD CONSTRAINT menu_item_modifiers_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
ALTER TABLE public.menu_item_modifiers ADD CONSTRAINT menu_item_modifiers_modifier_id_fkey FOREIGN KEY (modifier_id) REFERENCES public.menu_modifiers(id) ON DELETE CASCADE;

ALTER TABLE public.menu_item_tags ADD CONSTRAINT menu_item_tags_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;
ALTER TABLE public.menu_item_tags ADD CONSTRAINT menu_item_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.menu_tags(id) ON DELETE CASCADE;

ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;


ALTER TABLE public.menu_subcategories ADD CONSTRAINT menu_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id) ON DELETE CASCADE;


ALTER TABLE public.newsletters ADD CONSTRAINT newsletters_check_1 CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sent'::text])));
ALTER TABLE public.newsletters ADD CONSTRAINT newsletters_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;


ALTER TABLE public.notification_templates ADD CONSTRAINT notification_templates_check_1 CHECK ((category = ANY (ARRAY['general'::text, 'booking'::text, 'event'::text, 'loyalty'::text, 'system'::text, 'customer'::text, 'reward'::text, 'visit'::text, 'birthday'::text, 'milestone'::text, 'alert'::text, 'reminder'::text, 'task'::text, 'inventory'::text, 'promotion'::text])));
ALTER TABLE public.notification_templates ADD CONSTRAINT notification_templates_check_2 CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'birthday'::text, 'reward'::text, 'visit'::text, 'milestone'::text, 'task'::text, 'event'::text, 'inventory'::text, 'promotion'::text])));

ALTER TABLE public.notifications ADD CONSTRAINT notifications_check_1 CHECK ((category = ANY (ARRAY['general'::text, 'booking'::text, 'event'::text, 'loyalty'::text, 'system'::text, 'customer'::text, 'reward'::text, 'visit'::text, 'birthday'::text, 'milestone'::text, 'alert'::text, 'reminder'::text, 'task'::text, 'inventory'::text, 'promotion'::text])));
ALTER TABLE public.notifications ADD CONSTRAINT notifications_check_2 CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text, 'birthday'::text, 'reward'::text, 'visit'::text, 'milestone'::text, 'task'::text, 'event'::text, 'inventory'::text, 'promotion'::text])));

ALTER TABLE public.offline_sync_batches ADD CONSTRAINT offline_sync_batches_check_1 CHECK ((status = ANY (ARRAY['pending'::text, 'applied'::text, 'rejected'::text])));

ALTER TABLE public.order_events ADD CONSTRAINT order_events_actor_profile_id_fkey FOREIGN KEY (actor_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.order_events ADD CONSTRAINT order_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_items ADD CONSTRAINT order_items_check_1 CHECK ((quantity > 0));
ALTER TABLE public.order_items ADD CONSTRAINT order_items_check_2 CHECK (((station IS NULL) OR (station = ANY (ARRAY['kitchen'::text, 'bar'::text, 'service'::text]))));
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.orders ADD CONSTRAINT orders_check_1 CHECK ((status = ANY (ARRAY['open'::text, 'active'::text, 'closed'::text, 'voided'::text])));
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.venue_tables(id) ON DELETE SET NULL;

ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_check_1 CHECK ((lifecycle_status = ANY (ARRAY['authorized'::text, 'captured'::text, 'refunded'::text, 'chargeback'::text])));
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_check_2 CHECK ((reconciliation_status = ANY (ARRAY['pending'::text, 'matched'::text, 'exception'::text])));
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_check_3 CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])));
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.payment_transactions ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.pricing_windows ADD CONSTRAINT pricing_windows_check_1 CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric)));
ALTER TABLE public.pricing_windows ADD CONSTRAINT pricing_windows_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_check_1 CHECK ((role = ANY (ARRAY['customer'::text, 'staff'::text, 'admin'::text])));

ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_check_1 CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_check_2 CHECK ((discount_value > (0)::numeric));
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_check_3 CHECK ((max_redemptions > 0));
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_check_4 CHECK (((max_uses_per_customer IS NULL) OR (max_uses_per_customer > 0)));
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.promotional_materials ADD CONSTRAINT promotional_materials_check_1 CHECK ((material_type = ANY (ARRAY['image'::text, 'video'::text, 'document'::text, 'banner'::text])));
ALTER TABLE public.promotional_materials ADD CONSTRAINT promotional_materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.promotions ADD CONSTRAINT promotions_check_1 CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'free_item'::text])));
ALTER TABLE public.promotions ADD CONSTRAINT promotions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_check_1 CHECK ((ordered_quantity > 0));
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_check_2 CHECK ((received_quantity >= 0));
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_check_1 CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'received'::text, 'cancelled'::text])));
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;

ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_check_1 CHECK ((units_per_sale > (0)::numeric));
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;
ALTER TABLE public.recipe_ingredients ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE;

ALTER TABLE public.recipes ADD CONSTRAINT recipes_output_menu_item_id_fkey FOREIGN KEY (output_menu_item_id) REFERENCES public.menu_items(id) ON DELETE CASCADE;

ALTER TABLE public.referrals ADD CONSTRAINT referrals_check_1 CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'expired'::text])));
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.rewards ADD CONSTRAINT rewards_check_1 CHECK ((category = ANY (ARRAY['birthday'::text, 'loyalty_punch_card'::text, 'free_coffee'::text, 'free_alcoholic_drink'::text, 'free_item'::text, 'discount'::text, 'vip_access'::text, 'referral'::text, 'milestone'::text, 'custom'::text])));
ALTER TABLE public.rewards ADD CONSTRAINT rewards_check_2 CHECK ((status = ANY (ARRAY['active'::text, 'claimed'::text, 'expired'::text, 'cancelled'::text])));
ALTER TABLE public.rewards ADD CONSTRAINT rewards_claimed_by_staff_id_fkey FOREIGN KEY (claimed_by_staff_id) REFERENCES public.staff(id) ON DELETE NO ACTION;
ALTER TABLE public.rewards ADD CONSTRAINT rewards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_check_1 CHECK ((status = ANY (ARRAY['confirmed'::text, 'pending'::text, 'cancelled'::text])));
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.sales_receipts ADD CONSTRAINT sales_receipts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.shifts ADD CONSTRAINT shifts_check_1 CHECK ((role = ANY (ARRAY['manager'::text, 'staff'::text, 'bartender'::text, 'chef'::text, 'server'::text, 'host'::text, 'security'::text, 'cleaner'::text])));
ALTER TABLE public.shifts ADD CONSTRAINT shifts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_check_1 CHECK ((platform = ANY (ARRAY['facebook'::text, 'instagram'::text, 'twitter'::text, 'linkedin'::text, 'tiktok'::text])));
ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_check_2 CHECK ((status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'posted'::text, 'failed'::text])));
ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.split_bill_allocations ADD CONSTRAINT split_bill_allocations_check_1 CHECK ((allocated_amount >= (0)::numeric));
ALTER TABLE public.split_bill_allocations ADD CONSTRAINT split_bill_allocations_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;
ALTER TABLE public.split_bill_allocations ADD CONSTRAINT split_bill_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment_transactions(id) ON DELETE CASCADE;

ALTER TABLE public.staff ADD CONSTRAINT staff_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.staff ADD CONSTRAINT staff_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.staff_break_logs ADD CONSTRAINT staff_break_logs_check_1 CHECK ((break_type = ANY (ARRAY['rest'::text, 'meal'::text])));
ALTER TABLE public.staff_break_logs ADD CONSTRAINT staff_break_logs_attendance_log_id_fkey FOREIGN KEY (attendance_log_id) REFERENCES public.attendance_logs(id) ON DELETE CASCADE;

ALTER TABLE public.staff_performance ADD CONSTRAINT staff_performance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.staff_schedules ADD CONSTRAINT staff_schedules_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_check_1 CHECK ((movement_type = ANY (ARRAY['purchase_receive'::text, 'stocktake_commit'::text, 'waste'::text, 'recipe_depletion'::text, 'pos_sale'::text, 'adjustment'::text])));
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;

ALTER TABLE public.stocktakes ADD CONSTRAINT stocktakes_check_1 CHECK ((status = ANY (ARRAY['draft'::text, 'counted'::text, 'committed'::text])));
ALTER TABLE public.stocktakes ADD CONSTRAINT stocktakes_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;


ALTER TABLE public.tabs ADD CONSTRAINT tabs_check_1 CHECK ((preauth_hold_cents >= 0));
ALTER TABLE public.tabs ADD CONSTRAINT tabs_check_2 CHECK ((preauth_status = ANY (ARRAY['none'::text, 'pending'::text, 'captured'::text, 'released'::text, 'failed'::text])));
ALTER TABLE public.tabs ADD CONSTRAINT tabs_check_3 CHECK ((status = ANY (ARRAY['open'::text, 'active'::text, 'closed'::text, 'voided'::text])));
ALTER TABLE public.tabs ADD CONSTRAINT tabs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


ALTER TABLE public.tasks ADD CONSTRAINT tasks_check_1 CHECK ((category = ANY (ARRAY['inventory'::text, 'staff'::text, 'events'::text, 'maintenance'::text, 'customer_service'::text, 'general'::text])));
ALTER TABLE public.tasks ADD CONSTRAINT tasks_check_2 CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])));
ALTER TABLE public.tasks ADD CONSTRAINT tasks_check_3 CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text])));
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.staff(id) ON DELETE NO ACTION;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_related_event_id_fkey FOREIGN KEY (related_event_id) REFERENCES public.events(id) ON DELETE NO ACTION;

ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_check_1 CHECK ((export_status = ANY (ARRAY['pending'::text, 'exported'::text])));
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_check_2 CHECK ((lifecycle_status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'locked'::text])));
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.timesheets ADD CONSTRAINT timesheets_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.tip_pool_entries ADD CONSTRAINT tip_pool_entries_check_1 CHECK ((amount >= (0)::numeric));
ALTER TABLE public.tip_pool_entries ADD CONSTRAINT tip_pool_entries_check_2 CHECK ((pool_type = ANY (ARRAY['staff'::text, 'kitchen'::text, 'house'::text])));
ALTER TABLE public.tip_pool_entries ADD CONSTRAINT tip_pool_entries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.venue_tables ADD CONSTRAINT venue_tables_check_1 CHECK ((capacity > 0));
ALTER TABLE public.venue_tables ADD CONSTRAINT venue_tables_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.floor_sections(id) ON DELETE SET NULL;

ALTER TABLE public.visit_milestones ADD CONSTRAINT visit_milestones_check_1 CHECK ((milestone_type = ANY (ARRAY['first_visit'::text, 'tenth_visit'::text, 'fiftieth_visit'::text, 'hundredth_visit'::text, 'yearly_anniversary'::text])));
ALTER TABLE public.visit_milestones ADD CONSTRAINT visit_milestones_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE public.visit_qr_codes ADD CONSTRAINT visit_qr_codes_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;

ALTER TABLE public.visits ADD CONSTRAINT visits_check_1 CHECK ((visit_type = ANY (ARRAY['regular'::text, 'event'::text, 'special'::text, 'birthday'::text, 'vip'::text, 'alcoholic'::text, 'non_alcoholic'::text])));
ALTER TABLE public.visits ADD CONSTRAINT visits_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE public.visits ADD CONSTRAINT visits_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_check_1 CHECK (((party_size > 0) AND (party_size <= 50)));
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_check_2 CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'vip'::text])));
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_check_3 CHECK ((status = ANY (ARRAY['waiting'::text, 'notified'::text, 'booked'::text, 'expired'::text])));
ALTER TABLE public.waitlist ADD CONSTRAINT waitlist_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE NO ACTION;

