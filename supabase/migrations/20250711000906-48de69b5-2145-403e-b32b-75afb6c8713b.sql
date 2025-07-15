-- Move vector extension from public schema to extensions schema for security
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move the vector extension to the extensions schema
-- Note: This creates a new installation in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Drop the extension from public schema (this might require manual intervention in Supabase dashboard)
-- Since we can't directly move extensions, we'll note this for manual action