import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore, parseCsvLeads, calculateLeadScore, resolveLinkedInProfilePicture, formatPhoneNumber, Lead, LeadActivityLog } from '@/lib/leads-store';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    nextLeadsStore.init();
    const body = await req.json();
    const { csv_content, raw_leads: rawLeads, strategy = 'merge', source_name = 'Direct Import' } = body;
    const orgId = req.headers.get('x-org-id') || 'org-demo-123';

    let leadsToProcess: Lead[] = [];

    if (csv_content && typeof csv_content === 'string') {
      leadsToProcess = parseCsvLeads(csv_content, orgId);
    } else if (Array.isArray(rawLeads)) {
      leadsToProcess = rawLeads.map((item: any, idx: number) => {
        const id = item.prospect_id ? `lead-${item.prospect_id.substring(0, 12)}` : (item.id || `lead-${uuidv4().substring(0, 10)}`);
        
        const phoneFields = Object.keys(item).filter(k => 
          k.toLowerCase().includes('phone') || k.toLowerCase().includes('contact_number') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('cell')
        );
        const rawPhones = phoneFields.map(k => String(item[k] || '')).flatMap(p => p.split(/[,;\n]+/)).map(s => formatPhoneNumber(s.trim())).filter(Boolean);
        const contactNumber = Array.from(new Set(rawPhones)).join(', ');

        const emailFields = Object.keys(item).filter(k => 
          k.toLowerCase().includes('email') && !k.toLowerCase().includes('linkedin')
        );
        const rawEmails = emailFields.map(k => String(item[k] || '')).flatMap(e => e.split(/[,;\n]+/)).map(s => s.trim()).filter(Boolean);
        const emailStr = Array.from(new Set(rawEmails)).join(', ');

        const lead: Lead = {
          id,
          org_id: orgId,
          prospect_id: item.prospect_id || undefined,
          business_id: item.business_id || undefined,
          row_num: item.row_num || idx + 1,
          first_name: item.first_name || item.prospect_first_name || '',
          last_name: item.last_name || item.prospect_last_name || '',
          full_name: item.full_name || item.prospect_full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Prospect',
          email: emailStr,
          contact_number: contactNumber,
          country_name: item.country_name || item.prospect_country_name || '',
          region_name: item.region_name || item.prospect_region_name || '',
          city: item.city || item.prospect_city || '',
          linkedin_url: item.linkedin_url || item.prospect_linkedin || '',
          experience: Array.isArray(item.experience) ? item.experience : (Array.isArray(item.prospect_experience) ? item.prospect_experience : []),
          skills: Array.isArray(item.skills) ? item.skills : (Array.isArray(item.prospect_skills) ? item.prospect_skills : []),
          interests: Array.isArray(item.interests) ? item.interests : (Array.isArray(item.prospect_interests) ? item.prospect_interests : []),
          company_name: item.company_name || item.prospect_company_name || '',
          company_website: item.company_website || item.prospect_company_website || '',
          company_linkedin: item.company_linkedin || item.prospect_company_linkedin || '',
          job_department: item.job_department || item.prospect_job_department || '',
          job_seniority_level: Array.isArray(item.job_seniority_level) ? item.job_seniority_level : (Array.isArray(item.prospect_job_seniority_level) ? item.prospect_job_seniority_level : []),
          job_title: item.job_title || item.prospect_job_title || '',
          avatar_url: resolveLinkedInProfilePicture(
            item.full_name || item.prospect_full_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Lead',
            idx + 1,
            item.avatar_url || item.prospect_avatar || item.profile_picture,
            item.linkedin_url || item.prospect_linkedin,
            emailStr
          ),
          status: item.status || 'new',
          score: item.score || 50,
          notes: item.notes || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        lead.score = calculateLeadScore(lead);
        return lead;
      });
    }

    if (leadsToProcess.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid lead records parsed.' }, { status: 400 });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    leadsToProcess.forEach(newLead => {
      const existing = nextLeadsStore.leads.get(newLead.id);
      if (existing) {
        if (strategy === 'skip') {
          skippedCount++;
          return;
        }
        if (strategy === 'merge') {
          if (newLead.contact_number) {
            const existingPhones = existing.contact_number ? existing.contact_number.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];
            const incomingPhones = newLead.contact_number.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
            existing.contact_number = Array.from(new Set([...existingPhones, ...incomingPhones])).join(', ');
          }
          if (newLead.email) {
            const existingEmails = existing.email ? existing.email.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];
            const incomingEmails = newLead.email.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
            existing.email = Array.from(new Set([...existingEmails, ...incomingEmails])).join(', ');
          }
          existing.updated_at = new Date().toISOString();
          nextLeadsStore.leads.set(existing.id, existing);
          updatedCount++;
          return;
        }
      }
      nextLeadsStore.leads.set(newLead.id, newLead);
      importedCount++;
    });

    nextLeadsStore.save();

    return NextResponse.json({
      success: true,
      message: `Import complete: ${importedCount} added, ${updatedCount} merged, ${skippedCount} skipped.`,
      imported_count: importedCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      total_leads: nextLeadsStore.leads.size
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
