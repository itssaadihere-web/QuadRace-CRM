import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface Organization {
  id: string;
  name: string;
  tenant_slug: string;
  custom_domain?: string;
  plan_tier: 'free' | 'starter' | 'growth' | 'plus';
  billing_cycle: 'monthly' | 'annual';
  vertical?: 'ecommerce' | 'b2b' | 'services';
  solomon_guidance?: string;
  primary_color: string;
  greeting_message: string;
  copilot_mode: boolean;
  monthly_chats_used: number;
  monthly_chats_limit: number;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  password_hash: string;
  role: 'owner' | 'admin' | 'agent';
  push_token?: string;
  status: 'active' | 'offline' | 'busy';
  created_at: string;
}

export interface KnowledgeChunk {
  id: string;
  org_id: string;
  source_type: 'url' | 'pdf' | 'csv' | 'faq';
  source_url?: string;
  vector_status: 'ready' | 'processing' | 'error';
  content_chunk: string;
  embedding?: number[];
  created_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  visitor_id: string;
  visitor_name?: string;
  channel: 'web_widget' | 'whatsapp' | 'instagram' | 'email';
  assigned_agent_id?: string;
  status: 'ai_handled' | 'pending_transfer' | 'human_active' | 'closed';
  copilot_mode?: boolean;
  last_message_at: string;
  last_activity_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'solomon_ai' | 'human_agent';
  text: string;
  metadata?: any;
  created_at: string;
}

export interface EcommIntegration {
  id: string;
  org_id: string;
  provider: 'shopify' | 'woocommerce';
  store_url: string;
  api_credentials: string;
  created_at: string;
}

export interface UnansweredGap {
  id: string;
  org_id: string;
  customer_query: string;
  context?: string;
  frequency_count: number;
  resolved_status: boolean;
  created_at: string;
}

export type LeadStatus = 'new' | 'contacted' | 'meeting_scheduled' | 'qualified' | 'proposal' | 'won' | 'unqualified';

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
  status: LeadStatus;
  score: number;
  notes?: string;
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

class MultiTenantDataStore {
  public organizations: Map<string, Organization> = new Map();
  public users: Map<string, User> = new Map();
  public knowledgeBases: Map<string, KnowledgeChunk> = new Map();
  public conversations: Map<string, Conversation> = new Map();
  public messages: Map<string, Message> = new Map();
  public integrations: Map<string, EcommIntegration> = new Map();
  public unansweredGaps: Map<string, UnansweredGap> = new Map();
  public leads: Map<string, Lead> = new Map();
  public leadActivities: Map<string, LeadActivityLog> = new Map();

  private storageFilePath = path.join(__dirname, 'data_store.json');

  constructor() {
    this.loadFromDisk();
  }

  /**
   * Save entire store state persistently to disk JSON file
   */
  public saveToDisk() {
    try {
      const dump = {
        organizations: Array.from(this.organizations.entries()),
        users: Array.from(this.users.entries()),
        knowledgeBases: Array.from(this.knowledgeBases.entries()),
        conversations: Array.from(this.conversations.entries()),
        messages: Array.from(this.messages.entries()),
        integrations: Array.from(this.integrations.entries()),
        unansweredGaps: Array.from(this.unansweredGaps.entries()),
        leads: Array.from(this.leads.entries()),
        leadActivities: Array.from(this.leadActivities.entries())
      };
      fs.writeFileSync(this.storageFilePath, JSON.stringify(dump, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store to disk:', err);
    }
  }

  /**
   * Load store state from disk or initialize defaults
   */
  public loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, 'utf-8');
        const dump = JSON.parse(raw);

        if (dump.organizations) this.organizations = new Map(dump.organizations);
        if (dump.users) this.users = new Map(dump.users);
        if (dump.knowledgeBases) this.knowledgeBases = new Map(dump.knowledgeBases);
        if (dump.conversations) this.conversations = new Map(dump.conversations);
        if (dump.messages) this.messages = new Map(dump.messages);
        if (dump.integrations) this.integrations = new Map(dump.integrations);
        if (dump.unansweredGaps) this.unansweredGaps = new Map(dump.unansweredGaps);
        if (dump.leads) {
          this.leads = new Map(dump.leads);
          // Upgrade any old avatar URLs to live LinkedIn profile pictures
          this.leads.forEach((l, id) => {
            if (!l.avatar_url || l.avatar_url.includes('ui-avatars.com') || l.avatar_url.includes('unsplash.com')) {
              l.avatar_url = resolveLinkedInProfilePicture(l.full_name, l.row_num || 0, undefined, l.linkedin_url, l.email);
            }
          });
        }
        if (dump.leadActivities) this.leadActivities = new Map(dump.leadActivities);

        if (this.leads.size === 0) {
          this.seedSampleLeads('org-demo-123');
        }

        console.log(`💾 Knowledge Base memory loaded: ${this.knowledgeBases.size} chunks, ${this.leads.size} leads.`);
        return;
      }
    } catch (err) {
      console.warn('Disk load fallback to seed defaults:', err);
    }

    this.seedDefaults();
    this.seedSampleLeads('org-demo-123');
    this.saveToDisk();
  }

  /**
   * Seed sample leads from CSV if available
   */
  public seedSampleLeads(orgId: string = 'org-demo-123') {
    try {
      const csvPath = path.join(__dirname, 'sample_leads.csv');
      if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf-8');
        const parsed = parseCsvLeads(content, orgId);
        parsed.forEach(lead => {
          if (!this.leads.has(lead.id)) {
            this.leads.set(lead.id, lead);
            // Add initial import log
            const logId = uuidv4();
            const act: LeadActivityLog = {
              id: logId,
              lead_id: lead.id,
              org_id: orgId,
              type: 'import',
              summary: 'Lead imported from system sample dataset',
              content: `Record initialized with title: ${lead.job_title} at ${lead.company_name}`,
              performed_by: 'System Importer',
              created_at: lead.created_at || new Date().toISOString()
            };
            this.leadActivities.set(logId, act);
          }
        });
        console.log(`✅ Seeded ${parsed.length} sample leads into store.`);
      }
    } catch (err) {
      console.warn('Failed to seed sample leads:', err);
    }
  }

  private seedDefaults() {
    const defaultOrgId = 'org-demo-123';
    
    const defaultOrg: Organization = {
      id: defaultOrgId,
      name: 'Aura Fashion & Goods',
      tenant_slug: 'aura-fashion',
      custom_domain: 'support.aurafashion.com',
      plan_tier: 'growth',
      billing_cycle: 'annual',
      vertical: 'ecommerce',
      solomon_guidance: 'Always be warm, concise, and helpful. Offer 15% discount code AURA15 for orders over $100.',
      primary_color: '#0F2B1D',
      greeting_message: 'Welcome to Aura Fashion! I am Solomon AI, your personal shopping assistant. How can I help you today?',
      copilot_mode: true,
      monthly_chats_used: 42,
      monthly_chats_limit: 500,
      created_at: new Date().toISOString()
    };
    this.organizations.set(defaultOrg.id, defaultOrg);

    const user1: User = {
      id: 'usr-agent-1',
      org_id: defaultOrgId,
      email: 'alex@aurafashion.com',
      password_hash: 'hashed_pw_alex',
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString()
    };
    this.users.set(user1.id, user1);

    const kb1: KnowledgeChunk = {
      id: 'kb-1',
      org_id: defaultOrgId,
      source_type: 'faq',
      source_url: 'https://aurafashion.com/shipping-policy',
      vector_status: 'ready',
      content_chunk: 'Shipping Policy: Standard shipping takes 3-5 business days across domestic addresses. Express shipping takes 1-2 business days. Free shipping is available for all orders over $75.',
      created_at: new Date().toISOString()
    };
    const kb2: KnowledgeChunk = {
      id: 'kb-2',
      org_id: defaultOrgId,
      source_type: 'faq',
      source_url: 'https://aurafashion.com/returns',
      vector_status: 'ready',
      content_chunk: 'Return & Exchange Policy: We offer a 30-day hassle-free return policy for unworn items in original packaging with tags attached. Refunds are processed within 48 hours of item inspection.',
      created_at: new Date().toISOString()
    };
    this.knowledgeBases.set(kb1.id, kb1);
    this.knowledgeBases.set(kb2.id, kb2);

    const conv1: Conversation = {
      id: 'conv-101',
      org_id: defaultOrgId,
      visitor_id: 'vis-8891',
      visitor_name: 'Elena Rostova',
      channel: 'web_widget',
      status: 'ai_handled',
      copilot_mode: true,
      last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
      last_activity_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 120 * 60000).toISOString()
    };
    this.conversations.set(conv1.id, conv1);

    const m1: Message = {
      id: uuidv4(),
      conversation_id: 'conv-101',
      sender_type: 'visitor',
      text: 'Hi! Where is my order #AUR-94021?',
      created_at: new Date(Date.now() - 10 * 60000).toISOString()
    };
    const m2: Message = {
      id: uuidv4(),
      conversation_id: 'conv-101',
      sender_type: 'solomon_ai',
      text: 'I found your order #AUR-94021! Here is the latest shipping update:',
      metadata: {
        type: 'order_status_card',
        order_number: 'AUR-94021',
        status: 'In Transit',
        carrier: 'FedEx Express',
        tracking_code: 'FX-982310492',
        estimated_delivery: 'Tomorrow by 4:00 PM',
        items: ['Organic Cotton Hoodie (Medium / Onyx Black)']
      },
      created_at: new Date(Date.now() - 9 * 60000).toISOString()
    };
    this.messages.set(m1.id, m1);
    this.messages.set(m2.id, m2);
  }
}

/**
 * Robust RFC 4180 CSV line parser handling quotes, double quotes, and nested commas
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  // Normalize line endings
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parse JSON array string like '["a","b"]' or '[""a"",""b""]' or fallback to string array
 */
export function safeParseJsonArray(rawStr: string): string[] {
  if (!rawStr || rawStr.trim() === '') return [];
  const trimmed = rawStr.trim();
  
  // Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch (e) {
    // If double escaped quotes e.g. ["\"item\""] or quotes inside quotes
    try {
      const fixed = trimmed.replace(/""/g, '"');
      const parsed = JSON.parse(fixed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch (e2) {
      // Regex extraction fallback
      const matches = trimmed.match(/"([^"]+)"/g);
      if (matches) {
        return matches.map(m => m.replace(/^"|"$/g, '').trim()).filter(Boolean);
      }
    }
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    return inner.split(',').map(s => s.replace(/^["'\s]+|["'\s]+$/g, '')).filter(Boolean);
  }

  return [trimmed];
}

/**
 * Calculate dynamic lead quality score (0 - 100)
 */
export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 40; // Base score

  const seniority = (lead.job_seniority_level || []).map(s => s.toLowerCase());
  const title = (lead.job_title || '').toLowerCase();

  // Seniority weight
  if (seniority.includes('owner') || seniority.includes('cxo') || title.includes('chief') || title.includes('founder') || title.includes('president') || title.includes('ceo')) {
    score += 30;
  } else if (seniority.includes('director') || seniority.includes('vp') || seniority.includes('partner') || title.includes('director') || title.includes('head')) {
    score += 20;
  } else if (seniority.includes('manager') || title.includes('manager')) {
    score += 10;
  }

  // Completeness weights
  if (lead.company_name) score += 10;
  if (lead.company_website) score += 5;
  if (lead.linkedin_url) score += 5;
  if (lead.skills && lead.skills.length > 5) score += 5;
  if (lead.experience && lead.experience.length > 0) score += 5;

  return Math.min(100, score);
}

export const PROFESSIONAL_HEADSHOTS = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=256&h=256",
  "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=256&h=256"
];

export function resolveLinkedInProfilePicture(
  fullName: string, 
  rowNum: number = 0, 
  explicitUrl?: string, 
  linkedinUrl?: string, 
  email?: string
): string {
  // If explicit image URL is provided (e.g. media.licdn.com, licdn.com, or user custom photo), use it directly!
  if (explicitUrl && explicitUrl.trim() !== '' && !explicitUrl.includes('ui-avatars.com') && !explicitUrl.includes('unavatar.io/linkedin/linkedin.com')) {
    return explicitUrl.trim();
  }

  // 1. Extract username from linkedin_url
  let username = '';
  if (linkedinUrl && linkedinUrl.trim() !== '') {
    const cleaned = linkedinUrl
      .trim()
      .replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, '')
      .replace(/^\/in\//i, '')
      .replace(/[/?#].*$/, '')
      .trim();

    if (cleaned && !cleaned.toLowerCase().includes('linkedin.com') && !cleaned.startsWith('ACoAA')) {
      username = cleaned;
    }
  }

  // 2. Fallback to name slug (e.g. "carla-briceno" or "carlabriceno")
  if (!username && fullName) {
    const cleanSlug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (cleanSlug) {
      username = cleanSlug;
    }
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Lead')}&background=0F2B1D&color=C59B27&bold=true&size=128`;

  if (username && !username.includes('linkedin.com')) {
    return `https://unavatar.io/linkedin/${username}?fallback=${encodeURIComponent(fallbackAvatar)}`;
  }

  if (email && email.includes('@')) {
    const firstEmail = email.split(/[,;\n]+/)[0].trim();
    if (firstEmail) {
      return `https://unavatar.io/${encodeURIComponent(firstEmail)}?fallback=${encodeURIComponent(fallbackAvatar)}`;
    }
  }

  return fallbackAvatar;
}

/**
 * Converts CSV string to array of Lead objects
 */
export function parseCsvLeads(csvContent: string, orgId: string = 'org-demo-123'): Lead[] {
  const rows = parseCsvRows(csvContent);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/['"]/g, ''));
  const headerMap: { [key: string]: number } = {};
  headers.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const leads: Lead[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(c => c === '')) continue;

    const getVal = (col: string): string => {
      const idx = headerMap[col];
      return idx !== undefined && row[idx] !== undefined ? row[idx] : '';
    };

    const firstName = getVal('prospect_first_name');
    const lastName = getVal('prospect_last_name');
    let fullName = getVal('prospect_full_name');
    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }

    const prospectId = getVal('prospect_id');
    const businessId = getVal('business_id');
    const rowNumStr = getVal('row_num');
    const rowNum = rowNumStr ? parseInt(rowNumStr, 10) : i;

    const countryName = getVal('prospect_country_name');
    const regionName = getVal('prospect_region_name');
    const city = getVal('prospect_city');
    const linkedin = getVal('prospect_linkedin');

    const exp = safeParseJsonArray(getVal('prospect_experience'));
    const skills = safeParseJsonArray(getVal('prospect_skills'));
    const interests = safeParseJsonArray(getVal('prospect_interests'));
    const seniority = safeParseJsonArray(getVal('prospect_job_seniority_level'));

    const companyName = getVal('prospect_company_name');
    const companyWebsite = getVal('prospect_company_website');
    const companyLinkedin = getVal('prospect_company_linkedin');
    const jobDepartment = getVal('prospect_job_department');
    const jobTitle = getVal('prospect_job_title');
    const explicitAvatar = getVal('avatar_url') || getVal('prospect_avatar') || getVal('profile_picture') || getVal('image_url');
    const createdAt = getVal('created_at') || new Date().toISOString();

    // Extract all phone numbers from any matching phone/contact column
    const phoneCols = Object.keys(headerMap).filter(k => 
      k.includes('phone') || k.includes('contact_number') || k.includes('mobile') || k.includes('cell')
    );
    const collectedPhones = phoneCols
      .map(k => getVal(k))
      .flatMap(v => v.split(/[,;\n]+/))
      .map(v => v.trim())
      .filter(Boolean);
    const contactNumber = Array.from(new Set(collectedPhones)).join(', ');

    // Extract all emails from any matching email column
    const emailCols = Object.keys(headerMap).filter(k => 
      k.includes('email') && !k.includes('linkedin')
    );
    const collectedEmails = emailCols
      .map(k => getVal(k))
      .flatMap(v => v.split(/[,;\n]+/))
      .map(v => v.trim())
      .filter(Boolean);
    const emailStr = Array.from(new Set(collectedEmails)).join(', ');

    const avatarUrl = resolveLinkedInProfilePicture(fullName || 'Lead', isNaN(rowNum) ? i : rowNum, explicitAvatar, linkedin, emailStr);

    const id = prospectId ? `lead-${prospectId.substring(0, 12)}` : `lead-${uuidv4().substring(0, 10)}`;

    const lead: Lead = {
      id,
      org_id: orgId,
      prospect_id: prospectId || undefined,
      business_id: businessId || undefined,
      row_num: isNaN(rowNum) ? i : rowNum,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName || 'Unknown Prospect',
      email: emailStr,
      contact_number: contactNumber,
      country_name: countryName,
      region_name: regionName,
      city: city,
      linkedin_url: linkedin,
      avatar_url: avatarUrl,
      experience: exp,
      skills: skills,
      interests: interests,
      company_name: companyName,
      company_website: companyWebsite,
      company_linkedin: companyLinkedin,
      job_department: jobDepartment,
      job_seniority_level: seniority,
      job_title: jobTitle,
      status: 'new',
      score: 50,
      notes: '',
      created_at: createdAt,
      updated_at: new Date().toISOString()
    };

    lead.score = calculateLeadScore(lead);
    leads.push(lead);
  }

  return leads;
}

export const dbStore = new MultiTenantDataStore();

