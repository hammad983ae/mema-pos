-- Fix function search path security issues by setting secure search_path
-- This prevents SQL injection through search_path manipulation

-- Update all custom functions to have secure search_path
ALTER FUNCTION public.generate_store_access_code() SET search_path = '';
ALTER FUNCTION public.assign_store_access_code() SET search_path = '';
ALTER FUNCTION public.get_user_business_context() SET search_path = '';
ALTER FUNCTION public.log_chargeback_activity() SET search_path = '';
ALTER FUNCTION public.get_user_commission_rate(uuid, numeric, text) SET search_path = '';
ALTER FUNCTION public.update_goal_progress() SET search_path = '';
ALTER FUNCTION public.calculate_payroll_data(uuid, uuid, date, date) SET search_path = '';
ALTER FUNCTION public.check_sales_announcements() SET search_path = '';
ALTER FUNCTION public.create_shipping_requests_for_order() SET search_path = '';
ALTER FUNCTION public.user_has_business_role(user_role[]) SET search_path = '';
ALTER FUNCTION public.get_user_business_role() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.generate_order_number() SET search_path = '';
ALTER FUNCTION public.update_customer_totals() SET search_path = '';
ALTER FUNCTION public.update_inventory_on_sale() SET search_path = '';
ALTER FUNCTION public.generate_po_number() SET search_path = '';
ALTER FUNCTION public.check_low_stock_alerts() SET search_path = '';
ALTER FUNCTION public.record_inventory_movement() SET search_path = '';
ALTER FUNCTION public.get_user_business_context(uuid) SET search_path = '';
ALTER FUNCTION public.generate_invitation_code() SET search_path = '';
ALTER FUNCTION public.check_username_availability(text) SET search_path = '';
ALTER FUNCTION public.handle_refund_inventory() SET search_path = '';
ALTER FUNCTION public.log_activity(text, text, uuid, jsonb, jsonb, text, uuid) SET search_path = '';
ALTER FUNCTION public.log_order_changes() SET search_path = '';
ALTER FUNCTION public.log_refund_changes() SET search_path = '';
ALTER FUNCTION public.create_inventory_alert() SET search_path = '';
ALTER FUNCTION public.add_business_members_to_public_channel() SET search_path = '';
ALTER FUNCTION public.get_user_business_id() SET search_path = '';
ALTER FUNCTION public.calculate_team_compatibility(uuid, uuid, uuid) SET search_path = '';
ALTER FUNCTION public.generate_ticket_number() SET search_path = '';
ALTER FUNCTION public.search_knowledge_base(text) SET search_path = '';
ALTER FUNCTION public.classify_sale() SET search_path = '';
ALTER FUNCTION public.auto_add_user_to_channels() SET search_path = '';
ALTER FUNCTION public.handle_position_type_change() SET search_path = '';
ALTER FUNCTION public.create_default_channels_for_business() SET search_path = '';