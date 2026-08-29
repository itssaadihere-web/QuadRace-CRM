import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://jwlfpsomuclenubqrags.supabase.co';
const supabaseAnonKey = 'sb_publishable_I6m2tPk22acyg7RXBT4wFA_0MzJ8AiJ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function parseCsvRows(csvText: string): string[][] {
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

function safeParseJsonArray(str: string): any[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return str.split(/[,;\n]+/).map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
}

function resolveLinkedInProfilePicture(fullName: string, rowNum: number, explicitAvatar?: string, linkedinUrl?: string, email?: string): string {
  if (explicitAvatar && explicitAvatar.trim() !== '' && !explicitAvatar.includes('ui-avatars.com') && !explicitAvatar.includes('unavatar.io/linkedin/linkedin.com')) {
    return explicitAvatar.trim();
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
    if (cleanSlug) username = cleanSlug;
  }

  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'Lead')}&background=0F2B1D&color=C59B27&bold=true&size=128`;
  if (username && !username.includes('linkedin.com')) {
    return `https://unavatar.io/linkedin/${username}?fallback=${encodeURIComponent(fallback)}`;
  }
  return fallback;
}

async function seedSupabase() {
  console.log('🚀 Seeding verified leads directly into Supabase PostgreSQL...');
  const csvPath = path.join(process.cwd(), 'src/lib/sample_leads.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at:', csvPath);
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsvRows(csvContent);
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/['"]/g, ''));
  const headerMap: { [key: string]: number } = {};
  headers.forEach((h, idx) => { headerMap[h] = idx; });

  const leads = [];

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
    const explicitAvatar = getVal('avatar_url') || getVal('prospect_avatar');
    const createdAt = getVal('created_at') || new Date().toISOString();

    const avatarUrl = resolveLinkedInProfilePicture(fullName || 'Lead', isNaN(rowNum) ? i : rowNum, explicitAvatar, linkedin);
    const id = prospectId ? `lead-${prospectId.substring(0, 12)}` : `lead-seed-${i}`;

    leads.push({
      id,
      org_id: 'org-demo-123',
      prospect_id: prospectId || null,
      business_id: businessId || null,
      row_num: isNaN(rowNum) ? i : rowNum,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName || 'Unknown Prospect',
      email: '',
      contact_number: '',
      country_name: countryName,
      region_name: regionName,
      city: city,
      linkedin_url: linkedin,
      experience: exp,
      skills: skills,
      interests: interests,
      company_name: companyName,
      company_website: companyWebsite,
      company_linkedin: companyLinkedin,
      job_department: jobDepartment,
      job_seniority_level: seniority,
      job_title: jobTitle,
      avatar_url: avatarUrl,
      status: 'new',
      score: 100,
      notes: '',
      created_at: createdAt,
      updated_at: new Date().toISOString()
    });
  }

  console.log(`Parsed ${leads.length} leads. Inserting into Supabase...`);

  // Batch insert into Supabase
  const batchSize = 50;
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    const { error } = await supabase.from('leads').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('Insert error:', error.message);
    } else {
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} leads)`);
    }
  }

  console.log('🎉 Supabase PostgreSQL database seeded successfully with 100 leads!');
}

seedSupabase();
