-- Add email configuration fields to payroll_settings table
ALTER TABLE public.payroll_settings 
ADD COLUMN sender_email TEXT,
ADD COLUMN sender_name TEXT,
ADD COLUMN reply_to_email TEXT,
ADD COLUMN reply_to_name TEXT;