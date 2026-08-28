import { NextRequest, NextResponse } from 'next/server';
import { nextLeadsStore, parseCsvLeads } from '@/lib/leads-store';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), 'src/lib/sample_leads.csv');
    if (fs.existsSync(csvPath)) {
      const csvText = fs.readFileSync(csvPath, 'utf-8');
      const parsed = parseCsvLeads(csvText, 'org-demo-123');
      parsed.forEach(l => nextLeadsStore.leads.set(l.id, l));
      nextLeadsStore.save();
      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${parsed.length} verified prospect leads into CRM.`,
        leads_count: parsed.length
      });
    }
    return NextResponse.json({ success: true, message: 'Leads store active.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
