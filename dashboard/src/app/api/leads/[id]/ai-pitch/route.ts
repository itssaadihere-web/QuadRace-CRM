import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore } from '@/lib/leads-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    nextLeadsStore.init();
    const leadId = params.id;
    const { channel } = await req.json();
    const lead = nextLeadsStore.leads.get(leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const company = lead.company_name || 'your company';
    const name = lead.first_name || lead.full_name || 'there';
    const title = lead.job_title || 'Executive';

    let subject = '';
    let pitch = '';

    if (channel === 'email') {
      subject = `Scaling customer engagement & automation at ${company}`;
      pitch = `Hi ${name},\n\nI noticed your leadership role as ${title} at ${company}. At Quadrace, we empower enterprises with Solomon AI—an omnichannel customer engagement platform that automates sales qualification, customer support, and instant WhatsApp & Web response workflows.\n\nI’d love to share a 10-minute demo on how we help similar businesses double lead conversions. Would you be open for a quick chat this week?\n\nBest regards,\nAlex (Quadrace CRM)`;
    } else if (channel === 'whatsapp') {
      pitch = `Hello ${name}! 👋 This is Alex from Quadrace CRM. We noticed ${company}'s impressive growth and wanted to connect regarding our Solomon AI omnichannel engagement platform. Are you available for a brief 5-min demo?`;
    } else {
      pitch = `Hi ${name}, thrilled to connect! Following your impactful work as ${title} at ${company}. Would love to share how Solomon AI is transforming omnichannel customer workflows.`;
    }

    return NextResponse.json({
      success: true,
      channel,
      subject,
      pitch
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
