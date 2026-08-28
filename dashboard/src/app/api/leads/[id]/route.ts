import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore, calculateLeadScore, Lead, LeadActivityLog } from '@/lib/leads-store';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  nextLeadsStore.init();
  const leadId = params.id;
  const lead = nextLeadsStore.leads.get(leadId);

  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
  }

  const activities = Array.from(nextLeadsStore.activities.values())
    .filter(a => a.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ success: true, lead, activities });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    nextLeadsStore.init();
    const leadId = params.id;
    const updates = await req.json();
    const performedBy = updates.performed_by || req.headers.get('x-user-name') || 'Admin Agent';
    const orgId = req.headers.get('x-org-id') || 'org-demo-123';

    const lead = nextLeadsStore.leads.get(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const fieldKeys: (keyof Lead)[] = [
      'first_name', 'last_name', 'full_name', 'email', 'contact_number',
      'country_name', 'region_name', 'city', 'linkedin_url', 'company_name',
      'company_website', 'company_linkedin', 'avatar_url', 'job_department',
      'job_title', 'status', 'notes'
    ];

    const loggedChanges: LeadActivityLog[] = [];

    fieldKeys.forEach(key => {
      if (updates[key] !== undefined) {
        const oldVal = String(lead[key] || '').trim();
        const newVal = String(updates[key] || '').trim();

        if (oldVal !== newVal) {
          (lead as any)[key] = updates[key];

          const actId = uuidv4();
          const isStatus = key === 'status';
          const changeActivity: LeadActivityLog = {
            id: actId,
            lead_id: lead.id,
            org_id: orgId,
            type: isStatus ? 'status_change' : 'field_update',
            field_name: key as string,
            old_value: oldVal || '(empty)',
            new_value: newVal || '(cleared)',
            summary: isStatus 
              ? `Pipeline stage changed from "${oldVal}" to "${newVal}"`
              : `Detail corrected: "${key}" updated from "${oldVal || '(empty)'}" to "${newVal}"`,
            content: `Manual record update performed by ${performedBy}.`,
            performed_by: performedBy,
            created_at: new Date().toISOString()
          };

          nextLeadsStore.activities.set(actId, changeActivity);
          loggedChanges.push(changeActivity);
        }
      }
    });

    if (updates.first_name || updates.last_name) {
      lead.full_name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    }

    lead.score = calculateLeadScore(lead);
    lead.updated_at = new Date().toISOString();

    nextLeadsStore.leads.set(lead.id, lead);
    nextLeadsStore.save();

    return NextResponse.json({
      success: true,
      message: `Lead updated successfully. ${loggedChanges.length} field corrections audited.`,
      lead,
      logged_changes: loggedChanges
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
