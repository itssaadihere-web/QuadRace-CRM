import fs from 'fs';
import path from 'path';

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

export function formatPhoneNumber(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  
  if (!digits) return hasPlus ? '+' : '';

  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4);
    const middle = digits.slice(4, 7);
    const last = digits.slice(7, 11);
    return `+1 (${area}) ${middle}-${last}`;
  } else if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const middle = digits.slice(3, 6);
    const last = digits.slice(6, 10);
    return `+1 (${area}) ${middle}-${last}`;
  } else if (digits.length === 12 && digits.startsWith('92')) {
    return `+92 (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 12)}`;
  } else if (digits.length === 12 && digits.startsWith('44')) {
    return `+44 ${digits.slice(2, 6)} ${digits.slice(6, 12)}`;
  } else if (hasPlus && digits.length >= 7) {
    if (digits.length <= 10) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
  }

  return trimmed;
}

export function resolveLinkedInProfilePicture(
  fullName: string, 
  rowNum: number = 0, 
  explicitUrl?: string, 
  linkedinUrl?: string, 
  email?: string
): string {
  if (explicitUrl && explicitUrl.trim() !== '' && !explicitUrl.includes('ui-avatars.com') && !explicitUrl.includes('unavatar.io/linkedin/linkedin.com')) {
    return explicitUrl.trim();
  }

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

export function calculateLeadScore(lead: Partial<Lead>): number {
  let score = 40;
  const seniority = (lead.job_seniority_level || []).map(s => s.toLowerCase());
  const title = (lead.job_title || '').toLowerCase();

  if (seniority.includes('owner') || seniority.includes('cxo') || title.includes('chief') || title.includes('founder') || title.includes('president') || title.includes('ceo')) {
    score += 30;
  } else if (seniority.includes('director') || seniority.includes('vp') || seniority.includes('partner') || title.includes('director') || title.includes('head')) {
    score += 20;
  } else if (seniority.includes('manager') || title.includes('manager')) {
    score += 10;
  }

  if (lead.company_name) score += 10;
  if (lead.company_website) score += 5;
  if (lead.linkedin_url) score += 5;
  if (lead.skills && lead.skills.length > 5) score += 5;
  if (lead.experience && lead.experience.length > 0) score += 5;

  return Math.min(100, score);
}

export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.length > 0 && !(currentRow.length === 1 && currentRow[0] === '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

function safeParseJsonArray(str: string): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return str.split(/[,;\n]+/).map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
}

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

    const phoneCols = Object.keys(headerMap).filter(k => 
      k.includes('phone') || k.includes('contact_number') || k.includes('mobile') || k.includes('cell')
    );
    const collectedPhones = phoneCols
      .map(k => getVal(k))
      .flatMap(v => v.split(/[,;\n]+/))
      .map(v => formatPhoneNumber(v.trim()))
      .filter(Boolean);
    const contactNumber = Array.from(new Set(collectedPhones)).join(', ');

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
    const id = prospectId ? `lead-${prospectId.substring(0, 12)}` : `lead-seed-${i}`;

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

// In-Memory & Persisted Next.js Standalone Store
class NextLeadsStore {
  public leads: Map<string, Lead> = new Map();
  public activities: Map<string, LeadActivityLog> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.initialized && this.leads.size > 0) return;

    try {
      // 1. Try reading disk cache if exists
      const cachePath = path.join(process.cwd(), 'src/lib/data_cache.json');
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.leads && Array.isArray(data.leads)) {
          data.leads.forEach((l: Lead) => this.leads.set(l.id, l));
        }
        if (data.activities && Array.isArray(data.activities)) {
          data.activities.forEach((a: LeadActivityLog) => this.activities.set(a.id, a));
        }
      }

      // 2. If empty, load sample_leads.csv
      if (this.leads.size === 0) {
        const csvPath = path.join(process.cwd(), 'src/lib/sample_leads.csv');
        if (fs.existsSync(csvPath)) {
          const csvText = fs.readFileSync(csvPath, 'utf-8');
          const parsed = parseCsvLeads(csvText, 'org-demo-123');
          parsed.forEach(l => this.leads.set(l.id, l));
        }
      }
      this.initialized = true;
    } catch (err) {
      console.warn('NextLeadsStore init fallback:', err);
    }
  }

  public save() {
    try {
      const cachePath = path.join(process.cwd(), 'src/lib/data_cache.json');
      const payload = {
        leads: Array.from(this.leads.values()),
        activities: Array.from(this.activities.values())
      };
      fs.writeFileSync(cachePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.warn('NextLeadsStore save warning:', err);
    }
  }
}

const globalStore = (global as any).__nextLeadsStore || new NextLeadsStore();
if (process.env.NODE_ENV !== 'production') {
  (global as any).__nextLeadsStore = globalStore;
}

export const nextLeadsStore = globalStore as NextLeadsStore;
