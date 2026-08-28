import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore, LeadActivityLog } from '@/lib/leads-store';
import crypto from 'crypto';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  nextLeadsStore.init();
  const leadId = params.id;
  const activities = Array.from(nextLeadsStore.activities.values())
    .filter(a => a.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ success: true, activities });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    nextLeadsStore.init();
    const leadId = params.id;
    const orgId = req.headers.get('x-org-id') || 'org-demo-123';
    const body = await req.json();
    const { type, summary, content, outcome, duration_seconds, performed_by } = body;

    const lead = nextLeadsStore.leads.get(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const logId = crypto.randomUUID();
    const activity: LeadActivityLog = {
      id: logId,
      lead_id: leadId,
      org_id: orgId,
      type: type || 'note',
      summary: summary || 'Activity recorded',
      content: content || '',
      outcome: outcome || undefined,
      duration_seconds: duration_seconds ? parseInt(duration_seconds, 10) : undefined,
      performed_by: performed_by || 'Alex (Owner)',
      created_at: new Date().toISOString()
    };

    nextLeadsStore.activities.set(logId, activity);
    nextLeadsStore.save();

    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
