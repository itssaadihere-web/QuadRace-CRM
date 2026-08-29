import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jwlfpsomuclenubqrags.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_I6m2tPk22acyg7RXBT4wFA_0MzJ8AiJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'owner' | 'admin' | 'agent' | 'sales_rep';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  org_id: string;
  created_at: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  org_id: string;
  prospect_id?: string;
  business_id?: string;
  row_num?: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  contact_number: string;
  country_name: string;
  region_name: string;
  city: string;
  linkedin_url: string;
  experience: string[];
  skills: string[];
  interests: string[];
  company_name: string;
  company_website: string;
  company_linkedin: string;
  job_department: string;
  job_seniority_level: string[];
  job_title: string;
  avatar_url?: string;
  status: 'new' | 'contacted' | 'meeting_scheduled' | 'qualified' | 'proposal' | 'won' | 'unqualified';
  score: number;
  notes?: string;
  assigned_agent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityLog {
  id: string;
  lead_id: string;
  org_id: string;
  type: 'import' | 'field_update' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'status_change';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  summary: string;
  content?: string;
  outcome?: string;
  duration_seconds?: number;
  performed_by: string;
  created_at: string;
}
