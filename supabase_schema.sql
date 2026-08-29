-- =========================================================================
-- QUADRACE CRM & SOLOMON AI - SOLE SUPABASE DATABASE SCHEMA (HARDENED)
-- =========================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jwlfpsomuclenubqrags/sql/new
-- =========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create User Profiles Table (Multi-User Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner', 'admin', 'agent', 'sales_rep')),
  org_id TEXT NOT NULL DEFAULT 'org-demo-123',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL DEFAULT 'org-demo-123',
  prospect_id TEXT,
  business_id TEXT,
  row_num INTEGER,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  full_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  contact_number TEXT DEFAULT '',
  country_name TEXT DEFAULT '',
  region_name TEXT DEFAULT '',
  city TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  experience JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  company_name TEXT DEFAULT '',
  company_website TEXT DEFAULT '',
  company_linkedin TEXT DEFAULT '',
  job_department TEXT DEFAULT '',
  job_seniority_level JSONB DEFAULT '[]'::jsonb,
  job_title TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'meeting_scheduled', 'qualified', 'proposal', 'won', 'unqualified')),
  score INTEGER NOT NULL DEFAULT 50,
  notes TEXT DEFAULT '',
  assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Lead Activity Logs Table (Omnichannel Audit Timeline)
CREATE TABLE IF NOT EXISTS public.lead_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL DEFAULT 'org-demo-123',
  type TEXT NOT NULL CHECK (type IN ('import', 'field_update', 'call', 'email', 'whatsapp', 'meeting', 'note', 'status_change')),
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  summary TEXT NOT NULL,
  content TEXT DEFAULT '',
  outcome TEXT,
  duration_seconds INTEGER,
  performed_by TEXT NOT NULL DEFAULT 'Sales Agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_full_name ON public.leads(full_name);
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON public.leads(company_name);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activity_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activity_logs(created_at DESC);

-- 6. Trigger to automatically create a profile on new Auth User Signup (Security Hardened)
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

-- Revoke direct REST API access to trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

-- 8. Clean, Hardened RLS Policies

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leads Policies
DROP POLICY IF EXISTS "Allow all users read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users insert leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users update leads" ON public.leads;
DROP POLICY IF EXISTS "Allow all users delete leads" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert for authenticated users and anon clients" ON public.leads;
DROP POLICY IF EXISTS "Enable update for authenticated users and anon clients" ON public.leads;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.leads;

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
DROP POLICY IF EXISTS "Allow all users read activities" ON public.lead_activity_logs;
DROP POLICY IF EXISTS "Allow all users insert activities" ON public.lead_activity_logs;
DROP POLICY IF EXISTS "Enable read access for activity logs" ON public.lead_activity_logs;
DROP POLICY IF EXISTS "Enable insert for activity logs" ON public.lead_activity_logs;

CREATE POLICY "Enable read access for activity logs"
  ON public.lead_activity_logs FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for activity logs"
  ON public.lead_activity_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (lead_id IS NOT NULL);

-- 9. Enable Realtime Publications for Live Multi-User Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
