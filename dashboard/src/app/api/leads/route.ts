import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore, calculateLeadScore } from '@/lib/leads-store';

export async function GET(req: NextRequest) {
  try {
    nextLeadsStore.init();
    const { searchParams } = new URL(req.url);
    const orgId = req.headers.get('x-org-id') || searchParams.get('org_id') || 'org-demo-123';
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'score';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    let allLeads = Array.from(nextLeadsStore.leads.values());

    if (query) {
      const q = query.toLowerCase();
      allLeads = allLeads.filter(l => 
        l.full_name.toLowerCase().includes(q) ||
        l.company_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.contact_number.includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.job_title.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      allLeads = allLeads.filter(l => l.status === status);
    }

    // Sort
    allLeads.sort((a: any, b: any) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (order === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    const total = allLeads.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = allLeads.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      leads: paginatedLeads
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
