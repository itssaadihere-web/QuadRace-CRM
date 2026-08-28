import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore } from '@/lib/leads-store';

export async function GET(req: NextRequest) {
  try {
    nextLeadsStore.init();
    const leads = Array.from(nextLeadsStore.leads.values());

    const totalLeads = leads.length;
    const contactedLeads = leads.filter(l => l.status === 'contacted' || l.status === 'meeting_scheduled' || l.status === 'qualified' || l.status === 'proposal' || l.status === 'won').length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.status === 'won').length;
    const closedWon = leads.filter(l => l.status === 'won').length;

    const stageBreakdown: { [key: string]: number } = {};
    leads.forEach(l => {
      stageBreakdown[l.status] = (stageBreakdown[l.status] || 0) + 1;
    });

    const averageQualityScore = totalLeads > 0 
      ? Math.round(leads.reduce((acc, l) => acc + (l.score || 50), 0) / totalLeads)
      : 0;

    return NextResponse.json({
      success: true,
      total_leads: totalLeads,
      contacted_leads: contactedLeads,
      qualified_leads: qualifiedLeads,
      closed_won: closedWon,
      conversion_rate: totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) + '%' : '0%',
      average_quality_score: averageQualityScore,
      stage_breakdown: stageBreakdown
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
