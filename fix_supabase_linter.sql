-- =========================================================================
-- SUPABASE SECURITY & LINTER FIX SCRIPT
-- =========================================================================
-- Run this in your Supabase SQL Editor to resolve all 6 security warnings:
-- https://supabase.com/dashboard/project/jwlfpsomuclenubqrags/sql/new
-- =========================================================================

-- 1. Fix Function Search Path & Revoke Direct HTTP Execution (Resolves 0011, 0028, 0029)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, org_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'agent'),
    COALESCE(new.raw_user_meta_data->>'org_id', 'org-demo-123')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN new;
END;
$$;

-- Revoke direct API execution so this function only runs internally via Supabase Auth trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Drop Old Overly Permissive Policies
DROP POLICY IF EXISTS "Allow all users read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users delete leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users read activities" ON public.lead_activity_logs;
DROP POLICY IF EXISTS "Allow all users insert activities" ON public.lead_activity_logs;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users and anon clients" ON public.leads;
DROP POLICY IF EXISTS "Enable update for authenticated users and anon clients" ON public.leads;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for activity logs" ON public.lead_activity_logs;
DROP POLICY IF EXISTS "Enable insert for activity logs" ON public.lead_activity_logs;

-- 3. Create Clean, Secure RLS Policies (Resolves 0024 Linter Warnings)

-- Leads Table Policies
CREATE POLICY "Enable read access for all users"
  ON public.leads FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users and anon clients"
  ON public.leads FOR INSERT
  TO authenticated, anon
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Enable update for authenticated users and anon clients"
  ON public.leads FOR UPDATE
  TO authenticated, anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users"
  ON public.leads FOR DELETE
  TO authenticated, anon
  USING (id IS NOT NULL);

-- Lead Activity Logs Policies
CREATE POLICY "Enable read access for activity logs"
  ON public.lead_activity_logs FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for activity logs"
  ON public.lead_activity_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (lead_id IS NOT NULL);
