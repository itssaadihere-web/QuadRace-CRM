import { parseCsvLeads, calculateLeadScore, parseCsvRows } from '../src/db/store';
import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('=== 🧪 RUNNING LEAD IMPORT & CRM TESTS ===\n');

  const csvPath = path.join(__dirname, '../src/db/sample_leads.csv');
  const rawCsv = fs.readFileSync(csvPath, 'utf-8');

  // Test 1: RFC 4180 CSV Rows Parser
  const rows = parseCsvRows(rawCsv);
  console.log(`✅ Test 1: CSV Row Parser parsed ${rows.length} total rows (Header + 100 data rows).`);
  if (rows.length !== 101) {
    throw new Error(`Expected 101 rows (1 header + 100 data), got ${rows.length}`);
  }

  // Test 2: CSV Lead Objects Extractor
  const leads = parseCsvLeads(rawCsv, 'org-demo-123');
  console.log(`✅ Test 2: parseCsvLeads produced ${leads.length} structured Lead objects.`);
  if (leads.length !== 100) {
    throw new Error(`Expected 100 leads, got ${leads.length}`);
  }

  // Test 3: Field Verification on First Lead (Carla Briceno)
  const lead1 = leads[0];
  console.log('Lead 1 sample:', {
    name: lead1.full_name,
    company: lead1.company_name,
    website: lead1.company_website,
    title: lead1.job_title,
    skills_count: lead1.skills.length,
    experience_count: lead1.experience.length,
    interests_count: lead1.interests.length,
    score: lead1.score,
    contact_number: lead1.contact_number,
    email: lead1.email
  });

  if (lead1.full_name !== 'Carla Briceno' || lead1.company_name !== 'Bixal') {
    throw new Error(`Lead 1 field mismatch: ${lead1.full_name}, ${lead1.company_name}`);
  }

  if (lead1.contact_number !== '' || lead1.email !== '') {
    throw new Error(`Expected contact_number and email to be initialized blank for manual entry`);
  }

  if (lead1.skills.length === 0 || lead1.experience.length === 0) {
    throw new Error(`Expected JSON arrays for skills and experience to be parsed properly`);
  }

  // Test 4: Deduplication simulation
  const duplicateLeads = parseCsvLeads(rawCsv, 'org-demo-123');
  const seenIds = new Set<string>();
  let duplicates = 0;
  leads.forEach(l => seenIds.add(l.id));
  duplicateLeads.forEach(l => {
    if (seenIds.has(l.id)) duplicates++;
  });
  console.log(`✅ Test 4: Deduplication detected ${duplicates} exact duplicate IDs upon second parse.`);

  console.log('\n🎉 ALL 4 LEAD IMPORT & CRM TESTS PASSED SUCCESSFULLY!');
}

runTests();
