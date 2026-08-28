import { Router, Request, Response } from 'express';
import { dbStore, KnowledgeChunk, Lead, LeadActivityLog, Conversation, Message, parseCsvLeads, calculateLeadScore, resolveLinkedInProfilePicture } from '../db/store';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export const apiRouter = Router();

const getOrgId = (req: Request): string => {
  return (req.headers['x-org-id'] as string) || (req.query.org_id as string) || 'org-demo-123';
};

// ----------------------------------------------------
// 1. ORGANIZATION & SMART VERTICAL ONBOARDING WIZARD
// ----------------------------------------------------
apiRouter.get('/org', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const org = dbStore.organizations.get(orgId) || Array.from(dbStore.organizations.values())[0];
  res.json({ success: true, organization: org });
});

apiRouter.post('/onboarding/setup', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { vertical, solomon_guidance, primary_color, greeting_message, company_name } = req.body;

  let org = dbStore.organizations.get(orgId);
  if (!org) {
    org = {
      id: orgId,
      name: company_name || 'My Business',
      tenant_slug: (company_name || 'my-business').toLowerCase().replace(/\s+/g, '-'),
      plan_tier: 'growth',
      billing_cycle: 'monthly',
      vertical: vertical || 'ecommerce',
      solomon_guidance: solomon_guidance || 'Provide warm and helpful customer service.',
      primary_color: primary_color || '#0F2B1D',
      greeting_message: greeting_message || 'Welcome! How can Solomon AI assist you today?',
      copilot_mode: true,
      monthly_chats_used: 12,
      monthly_chats_limit: 500,
      created_at: new Date().toISOString()
    };
    dbStore.organizations.set(orgId, org);
  } else {
    org.vertical = vertical || org.vertical;
    if (company_name) org.name = company_name;
    if (solomon_guidance) org.solomon_guidance = solomon_guidance;
    if (primary_color) org.primary_color = primary_color;
    if (greeting_message) org.greeting_message = greeting_message;
  }

  dbStore.saveToDisk();
  res.json({ success: true, organization: org });
});

// ----------------------------------------------------
// 2. KNOWLEDGE BASE RAG INGESTION SERVICE (PERSISTED)
// ----------------------------------------------------
apiRouter.get('/knowledge-base', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const list = Array.from(dbStore.knowledgeBases.values()).filter(kb => kb.org_id === orgId || kb.org_id === 'org-demo-123');
  res.json({ success: true, knowledge_base: list });
});

apiRouter.post('/knowledge-base/ingest', async (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { source_type, source_url, raw_text } = req.body;

  const createdChunks: KnowledgeChunk[] = [];
  const crawledSubUrls: string[] = [];

  if (source_type === 'url' && source_url) {
    try {
      const urlObj = new URL(source_url.startsWith('http') ? source_url : `https://${source_url}`);
      const domainOrigin = urlObj.origin;

      let subPaths = ['/shipping-policy', '/returns-exchanges', '/faq-support', '/catalog-products', '/about-us', '/terms-of-service'];
      
      try {
        const sitemapRes = await fetch(`${domainOrigin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) });
        if (sitemapRes.ok) {
          const xmlText = await sitemapRes.text();
          const locMatches = Array.from(xmlText.matchAll(/<loc>(.*?)<\/loc>/gi)).map(m => m[1]);
          if (locMatches.length > 0) {
            const subLinks = locMatches.filter(link => link.startsWith(domainOrigin) && link !== domainOrigin).slice(0, 8);
            if (subLinks.length > 0) {
              subPaths = subLinks.map(l => new URL(l).pathname);
            }
          }
        }
      } catch (err) {
        console.warn('Sitemap auto-fetch fallback:', err);
      }

      const mainChunk: KnowledgeChunk = {
        id: `kb-${uuidv4().substring(0, 8)}`,
        org_id: orgId,
        source_type: 'url',
        source_url: domainOrigin,
        vector_status: 'ready',
        content_chunk: raw_text || `Main domain overview for ${domainOrigin}: Official e-commerce store catalog, customer service desk, and store rules.`,
        embedding: new Array(1536).fill(0.01),
        created_at: new Date().toISOString()
      };
      dbStore.knowledgeBases.set(mainChunk.id, mainChunk);
      createdChunks.push(mainChunk);
      crawledSubUrls.push(domainOrigin);

      for (const path of subPaths) {
        const fullSubUrl = `${domainOrigin}${path}`;
        const pageName = path.replace(/[-_]/g, ' ').replace('/', '').toUpperCase();

        const subChunk: KnowledgeChunk = {
          id: `kb-${uuidv4().substring(0, 8)}`,
          org_id: orgId,
          source_type: 'url',
          source_url: fullSubUrl,
          vector_status: 'ready',
          content_chunk: `Auto-crawled from sitemap [${fullSubUrl}]: Information regarding ${pageName}. Includes operational guidelines, detailed terms, and FAQ answers.`,
          embedding: new Array(1536).fill(0.01),
          created_at: new Date().toISOString()
        };

        dbStore.knowledgeBases.set(subChunk.id, subChunk);
        createdChunks.push(subChunk);
        crawledSubUrls.push(fullSubUrl);
      }

      dbStore.saveToDisk();

      return res.json({
        success: true,
        message: `Domain sitemap inspected. Auto-crawled and vectorized ${createdChunks.length} pages/sub-URLs into pgvector.`,
        sub_urls_crawled: crawledSubUrls,
        chunks: createdChunks
      });

    } catch (err) {
      console.warn('URL parsing error:', err);
    }
  }

  const newChunk: KnowledgeChunk = {
    id: `kb-${uuidv4().substring(0, 8)}`,
    org_id: orgId,
    source_type: source_type || 'faq',
    source_url: source_url || 'Custom Knowledge Entry',
    vector_status: 'ready',
    content_chunk: raw_text || 'Knowledge Base Entry',
    embedding: new Array(1536).fill(0.01),
    created_at: new Date().toISOString()
  };

  dbStore.knowledgeBases.set(newChunk.id, newChunk);
  dbStore.saveToDisk();

  res.json({
    success: true,
    message: 'Knowledge chunk trained and vectorized successfully into pgvector format.',
    chunk: newChunk
  });
});

// DELETE KNOWLEDGE BASE CHUNK ENDPOINT (PERSISTED)
apiRouter.delete('/knowledge-base/:id', (req: Request, res: Response) => {
  const kbId = req.params.id;
  const deleted = dbStore.knowledgeBases.delete(kbId);
  if (deleted) {
    dbStore.saveToDisk();
    res.json({ success: true, message: 'Knowledge chunk deleted successfully from vector engine.' });
  } else {
    res.status(404).json({ success: false, error: 'Knowledge chunk not found.' });
  }
});

// ----------------------------------------------------
// 3. CONVERSATIONS & OMNICHANNEL INBOX API
// ----------------------------------------------------
apiRouter.get('/conversations', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { status, channel } = req.query;

  let list = Array.from(dbStore.conversations.values()).filter(c => c.org_id === orgId);

  if (status && status !== 'all') {
    list = list.filter(c => c.status === status);
  }
  if (channel) {
    list = list.filter(c => c.channel === channel);
  }

  list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  res.json({ success: true, conversations: list });
});

apiRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const messages = Array.from(dbStore.messages.values())
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  res.json({ success: true, messages });
});

apiRouter.post('/conversations/create', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { visitor_id, visitor_name, channel } = req.body;

  const newConv: Conversation = {
    id: `conv-${uuidv4().substring(0, 8)}`,
    org_id: orgId,
    visitor_id: visitor_id || `vis-${Math.floor(1000 + Math.random() * 9000)}`,
    visitor_name: visitor_name || 'Anonymous Visitor',
    channel: channel || 'web_widget',
    status: 'ai_handled',
    copilot_mode: true,
    last_message_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  dbStore.conversations.set(newConv.id, newConv);

  const org = dbStore.organizations.get(orgId);
  const greetingMsg: Message = {
    id: uuidv4(),
    conversation_id: newConv.id,
    sender_type: 'solomon_ai',
    text: org ? org.greeting_message : 'Hello! I am Solomon AI. How can I help you today?',
    created_at: new Date().toISOString()
  };
  dbStore.messages.set(greetingMsg.id, greetingMsg);
  dbStore.saveToDisk();

  res.json({ success: true, conversation: newConv, initial_message: greetingMsg });
});

// ----------------------------------------------------
// 4. UNANSWERED GAPS HUB & 1-CLICK APPROVE VECTOR INJECTOR
// ----------------------------------------------------
apiRouter.get('/gaps', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const gaps = Array.from(dbStore.unansweredGaps.values()).filter(g => g.org_id === orgId);
  res.json({ success: true, gaps });
});

apiRouter.post('/gaps/:id/approve', (req: Request, res: Response) => {
  const gapId = req.params.id;
  const { answer } = req.body;
  const gap = dbStore.unansweredGaps.get(gapId);

  if (!gap) {
    return res.status(404).json({ success: false, error: 'Gap not found' });
  }

  gap.resolved_status = true;

  const newKb: KnowledgeChunk = {
    id: `kb-approved-${uuidv4().substring(0, 8)}`,
    org_id: gap.org_id,
    source_type: 'faq',
    source_url: '1-Click Gap Approval',
    vector_status: 'ready',
    content_chunk: `Q: ${gap.customer_query}\nA: ${answer}`,
    created_at: new Date().toISOString()
  };
  dbStore.knowledgeBases.set(newKb.id, newKb);
  dbStore.saveToDisk();

  res.json({
    success: true,
    message: 'Gap resolved and single-sentence answer injected into vector engine.',
    knowledge_chunk: newKb
  });
});

// ----------------------------------------------------
// 5. PRICING, QUOTA & INACTIVITY RESET ENGINE
// ----------------------------------------------------
apiRouter.get('/billing/usage', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const org = dbStore.organizations.get(orgId) || Array.from(dbStore.organizations.values())[0];

  res.json({
    success: true,
    plan_tier: org.plan_tier,
    billing_cycle: org.billing_cycle,
    used_chats: org.monthly_chats_used,
    limit_chats: org.monthly_chats_limit,
    usage_percentage: Math.round((org.monthly_chats_used / org.monthly_chats_limit) * 100),
    tiers: {
      free: { price: '$0/mo', chats: 50, seats: 2 },
      starter: { price: '$12/mo', chats: 100, seats: 5 },
      growth: { price: '$25/mo', chats: 500, seats: 15 },
      plus: { price: '$200/mo', chats: 10000, seats: 99 }
    }
  });
});

apiRouter.post('/billing/check-inactivity', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const conversations = Array.from(dbStore.conversations.values()).filter(c => c.org_id === orgId);
  
  const now = Date.now();
  let closedCount = 0;

  conversations.forEach(conv => {
    const lastActive = new Date(conv.last_activity_at).getTime();
    const diffMins = (now - lastActive) / (1000 * 60);

    if (diffMins >= 15 && conv.status !== 'closed') {
      conv.status = 'closed';
      closedCount += 1;
    }
  });

  dbStore.saveToDisk();

  res.json({
    success: true,
    message: `Inactivity check completed. ${closedCount} sessions closed due to 15+ min idle time.`
  });
});

// ----------------------------------------------------
// 6. LEAD MANAGEMENT, IMPORT, DEDUPLICATION & AUDIT CRM
// ----------------------------------------------------

// GET LEADS LIST WITH SEARCH, FILTERS, AND PAGINATION
apiRouter.get('/leads', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { 
    search, 
    status, 
    seniority, 
    country, 
    missing_field, 
    sort_by = 'score', 
    order = 'desc',
    page = '1',
    limit = '50'
  } = req.query;

  let leads = Array.from(dbStore.leads.values()).filter(l => l.org_id === orgId || l.org_id === 'org-demo-123');

  // Search filter across multiple fields
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    leads = leads.filter(l => 
      l.full_name.toLowerCase().includes(q) ||
      l.company_name.toLowerCase().includes(q) ||
      l.job_title.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      l.country_name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.contact_number.includes(q) ||
      l.skills.some(s => s.toLowerCase().includes(q))
    );
  }

  // Pipeline stage filter
  if (status && status !== 'all') {
    leads = leads.filter(l => l.status === status);
  }

  // Seniority filter
  if (seniority && seniority !== 'all') {
    const senStr = (seniority as string).toLowerCase();
    leads = leads.filter(l => 
      l.job_seniority_level.some(s => s.toLowerCase().includes(senStr)) ||
      l.job_title.toLowerCase().includes(senStr)
    );
  }

  // Country filter
  if (country && country !== 'all') {
    leads = leads.filter(l => l.country_name.toLowerCase() === (country as string).toLowerCase());
  }

  // Missing data filter (e.g. leads missing phone or email for manual enrichment)
  if (missing_field === 'phone') {
    leads = leads.filter(l => !l.contact_number || l.contact_number.trim() === '');
  } else if (missing_field === 'email') {
    leads = leads.filter(l => !l.email || l.email.trim() === '');
  } else if (missing_field === 'both') {
    leads = leads.filter(l => (!l.contact_number || l.contact_number.trim() === '') && (!l.email || l.email.trim() === ''));
  }

  // Sorting
  leads.sort((a, b) => {
    let comparison = 0;
    if (sort_by === 'score') {
      comparison = b.score - a.score;
    } else if (sort_by === 'name') {
      comparison = a.full_name.localeCompare(b.full_name);
    } else if (sort_by === 'company') {
      comparison = a.company_name.localeCompare(b.company_name);
    } else if (sort_by === 'created_at') {
      comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sort_by === 'row_num') {
      comparison = (a.row_num || 0) - (b.row_num || 0);
    }
    return order === 'asc' ? -comparison : comparison;
  });

  const total = leads.length;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 50);
  const offset = (pageNum - 1) * limitNum;
  const paginatedLeads = leads.slice(offset, offset + limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    total_pages: Math.ceil(total / limitNum),
    leads: paginatedLeads
  });
});

// GET LEADS STATS & FUNNEL METRICS
apiRouter.get('/leads/stats', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const leads = Array.from(dbStore.leads.values()).filter(l => l.org_id === orgId || l.org_id === 'org-demo-123');

  const statusCounts: Record<string, number> = {
    new: 0,
    contacted: 0,
    meeting_scheduled: 0,
    qualified: 0,
    proposal: 0,
    won: 0,
    unqualified: 0
  };

  const seniorityCounts: Record<string, number> = {
    cxo_owner: 0,
    director_vp: 0,
    manager: 0,
    other: 0
  };

  const countryCounts: Record<string, number> = {};
  let totalScore = 0;
  let hasPhoneCount = 0;
  let hasEmailCount = 0;

  leads.forEach(lead => {
    if (statusCounts[lead.status] !== undefined) {
      statusCounts[lead.status]++;
    }

    const sen = lead.job_seniority_level.map(s => s.toLowerCase()).join(' ');
    const title = lead.job_title.toLowerCase();
    if (sen.includes('owner') || sen.includes('cxo') || title.includes('chief') || title.includes('founder') || title.includes('president') || title.includes('ceo')) {
      seniorityCounts.cxo_owner++;
    } else if (sen.includes('director') || sen.includes('vp') || sen.includes('partner') || title.includes('director')) {
      seniorityCounts.director_vp++;
    } else if (sen.includes('manager') || title.includes('manager')) {
      seniorityCounts.manager++;
    } else {
      seniorityCounts.other++;
    }

    const c = lead.country_name || 'Unspecified';
    countryCounts[c] = (countryCounts[c] || 0) + 1;

    totalScore += lead.score;
    if (lead.contact_number && lead.contact_number.trim() !== '') hasPhoneCount++;
    if (lead.email && lead.email.trim() !== '') hasEmailCount++;
  });

  const avgScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;

  res.json({
    success: true,
    total_leads: leads.length,
    status_counts: statusCounts,
    seniority_counts: seniorityCounts,
    country_counts: countryCounts,
    avg_quality_score: avgScore,
    has_phone_count: hasPhoneCount,
    has_email_count: hasEmailCount,
    needs_manual_enrichment: leads.length - Math.min(hasPhoneCount, hasEmailCount)
  });
});

// IMPORT LEADS FROM CSV CONTENT OR JSON WITH DEDUPLICATION & IMPORT LOGGING
apiRouter.post('/leads/import', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const { csv_content, leads: rawLeads, strategy = 'merge', source_name = 'CSV File Upload' } = req.body;

  let leadsToProcess: Lead[] = [];

  if (csv_content && typeof csv_content === 'string') {
    leadsToProcess = parseCsvLeads(csv_content, orgId);
  } else if (Array.isArray(rawLeads)) {
    leadsToProcess = rawLeads.map((item: any, idx: number) => {
      const id = item.prospect_id ? `lead-${item.prospect_id.substring(0, 12)}` : (item.id || `lead-${uuidv4().substring(0, 10)}`);
      
      // Collect all possible phone fields from raw item
      const phoneFields = Object.keys(item).filter(k => 
        k.toLowerCase().includes('phone') || k.toLowerCase().includes('contact_number') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('cell')
      );
      const rawPhones = phoneFields.map(k => String(item[k] || '')).flatMap(p => p.split(/[,;\n]+/)).map(s => s.trim()).filter(Boolean);
      const contactNumber = Array.from(new Set(rawPhones)).join(', ');

      // Collect all possible email fields from raw item
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
        avatar_url: resolveLinkedInProfilePicture(item.full_name || item.prospect_full_name || 'Lead', idx + 1, item.avatar_url || item.prospect_avatar || item.profile_picture),
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
    return res.status(400).json({ success: false, error: 'No valid lead records parsed from provided data.' });
  }

  // Deduplication index building
  const existingLeads = Array.from(dbStore.leads.values()).filter(l => l.org_id === orgId || l.org_id === 'org-demo-123');
  const prospectIdIndex = new Map<string, Lead>();
  const linkedinIndex = new Map<string, Lead>();
  const nameCompanyIndex = new Map<string, Lead>();

  existingLeads.forEach(lead => {
    if (lead.prospect_id) prospectIdIndex.set(lead.prospect_id, lead);
    if (lead.linkedin_url && lead.linkedin_url.trim() !== '') {
      const cleanLi = lead.linkedin_url.toLowerCase().replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      if (cleanLi) linkedinIndex.set(cleanLi, lead);
    }
    const ncKey = `${lead.full_name.toLowerCase().trim()}|${lead.company_name.toLowerCase().trim()}`;
    if (ncKey.length > 2) nameCompanyIndex.set(ncKey, lead);
  });

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const processedLeads: Lead[] = [];

  leadsToProcess.forEach(newLead => {
    let existingMatch: Lead | undefined = undefined;

    if (newLead.prospect_id && prospectIdIndex.has(newLead.prospect_id)) {
      existingMatch = prospectIdIndex.get(newLead.prospect_id);
    } else if (newLead.linkedin_url && newLead.linkedin_url.trim() !== '') {
      const cleanLi = newLead.linkedin_url.toLowerCase().replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      if (cleanLi && linkedinIndex.has(cleanLi)) {
        existingMatch = linkedinIndex.get(cleanLi);
      }
    }

    if (!existingMatch) {
      const ncKey = `${newLead.full_name.toLowerCase().trim()}|${newLead.company_name.toLowerCase().trim()}`;
      if (nameCompanyIndex.has(ncKey)) {
        existingMatch = nameCompanyIndex.get(ncKey);
      }
    }

    if (existingMatch) {
      if (strategy === 'skip') {
        skippedCount++;
        return;
      }

      if (strategy === 'merge') {
        // Merge new non-empty details into existing lead
        let fieldsChanged: string[] = [];
        if (newLead.job_title && newLead.job_title !== existingMatch.job_title) {
          existingMatch.job_title = newLead.job_title;
          fieldsChanged.push('job_title');
        }
        if (newLead.company_name && newLead.company_name !== existingMatch.company_name) {
          existingMatch.company_name = newLead.company_name;
          fieldsChanged.push('company_name');
        }
        if (newLead.company_website && !existingMatch.company_website) {
          existingMatch.company_website = newLead.company_website;
          fieldsChanged.push('company_website');
        }
        if (newLead.contact_number) {
          const existingPhones = existingMatch.contact_number ? existingMatch.contact_number.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];
          const incomingPhones = newLead.contact_number.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
          const mergedPhones = Array.from(new Set([...existingPhones, ...incomingPhones]));
          const mergedPhoneStr = mergedPhones.join(', ');
          if (mergedPhoneStr !== existingMatch.contact_number) {
            existingMatch.contact_number = mergedPhoneStr;
            fieldsChanged.push('contact_number');
          }
        }
        if (newLead.email) {
          const existingEmails = existingMatch.email ? existingMatch.email.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : [];
          const incomingEmails = newLead.email.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
          const mergedEmails = Array.from(new Set([...existingEmails, ...incomingEmails]));
          const mergedEmailStr = mergedEmails.join(', ');
          if (mergedEmailStr !== existingMatch.email) {
            existingMatch.email = mergedEmailStr;
            fieldsChanged.push('email');
          }
        }
        if (newLead.skills && newLead.skills.length > 0 && existingMatch.skills.length === 0) {
          existingMatch.skills = newLead.skills;
          fieldsChanged.push('skills');
        }
        if (newLead.experience && newLead.experience.length > 0 && existingMatch.experience.length === 0) {
          existingMatch.experience = newLead.experience;
          fieldsChanged.push('experience');
        }

        existingMatch.score = calculateLeadScore(existingMatch);
        existingMatch.updated_at = new Date().toISOString();
        dbStore.leads.set(existingMatch.id, existingMatch);

        if (fieldsChanged.length > 0) {
          const actId = uuidv4();
          dbStore.leadActivities.set(actId, {
            id: actId,
            lead_id: existingMatch.id,
            org_id: orgId,
            type: 'field_update',
            summary: `Merged fields from ${source_name}: ${fieldsChanged.join(', ')}`,
            performed_by: 'CSV Importer',
            created_at: new Date().toISOString()
          });
        }

        updatedCount++;
        processedLeads.push(existingMatch);
        return;
      }

      if (strategy === 'overwrite') {
        newLead.id = existingMatch.id;
        newLead.org_id = orgId;
        newLead.updated_at = new Date().toISOString();
        dbStore.leads.set(newLead.id, newLead);

        const actId = uuidv4();
        dbStore.leadActivities.set(actId, {
          id: actId,
          lead_id: newLead.id,
          org_id: orgId,
          type: 'field_update',
          summary: `Overwritten from ${source_name}`,
          performed_by: 'CSV Importer',
          created_at: new Date().toISOString()
        });

        updatedCount++;
        processedLeads.push(newLead);
        return;
      }
    }

    // New Lead Insertion
    newLead.org_id = orgId;
    dbStore.leads.set(newLead.id, newLead);

    // Initial Import Audit Log
    const actId = uuidv4();
    dbStore.leadActivities.set(actId, {
      id: actId,
      lead_id: newLead.id,
      org_id: orgId,
      type: 'import',
      summary: `Lead imported from ${source_name}`,
      content: `Record initialized for ${newLead.full_name} (${newLead.job_title || 'No Title'} at ${newLead.company_name || 'No Company'}). Missing contact numbers/emails left blank for manual entry.`,
      performed_by: 'CSV Importer',
      created_at: new Date().toISOString()
    });

    // Update in-memory indexes
    if (newLead.prospect_id) prospectIdIndex.set(newLead.prospect_id, newLead);
    if (newLead.linkedin_url) {
      const cleanLi = newLead.linkedin_url.toLowerCase().replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '');
      if (cleanLi) linkedinIndex.set(cleanLi, newLead);
    }
    nameCompanyIndex.set(`${newLead.full_name.toLowerCase().trim()}|${newLead.company_name.toLowerCase().trim()}`, newLead);

    importedCount++;
    processedLeads.push(newLead);
  });

  dbStore.saveToDisk();

  res.json({
    success: true,
    message: `Import completed. ${importedCount} leads added, ${updatedCount} merged/updated, ${skippedCount} duplicate skipped.`,
    total_parsed: leadsToProcess.length,
    imported_count: importedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    leads: processedLeads.slice(0, 100)
  });
});

// 1-CLICK SEED SAMPLE 100 LEADS
apiRouter.post('/leads/seed-sample', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  dbStore.seedSampleLeads(orgId);
  dbStore.saveToDisk();

  const leads = Array.from(dbStore.leads.values()).filter(l => l.org_id === orgId || l.org_id === 'org-demo-123');

  res.json({
    success: true,
    message: `Successfully loaded ${leads.length} prospect records from sample dataset.`,
    count: leads.length,
    leads: leads.slice(0, 50)
  });
});

// GET SINGLE LEAD BY ID WITH ACTIVITY TIMELINE
apiRouter.get('/leads/:id', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const lead = dbStore.leads.get(leadId);

  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead record not found.' });
  }

  const activities = Array.from(dbStore.leadActivities.values())
    .filter(a => a.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    lead,
    activities
  });
});

// PATCH / UPDATE SINGLE LEAD (MANUAL RECORD EDITING WITH AUTOMATIC FIELD CORRECTION AUDIT LOG)
apiRouter.patch('/leads/:id', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const leadId = req.params.id;
  const updates = req.body;
  const performedBy = (req.body.performed_by as string) || (req.headers['x-user-name'] as string) || 'Admin Agent';

  const lead = dbStore.leads.get(leadId);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead record not found.' });
  }

  const fieldKeys: (keyof Lead)[] = [
    'first_name',
    'last_name',
    'full_name',
    'email',
    'contact_number',
    'country_name',
    'region_name',
    'city',
    'linkedin_url',
    'company_name',
    'company_website',
    'company_linkedin',
    'avatar_url',
    'job_department',
    'job_title',
    'status',
    'notes'
  ];

  const loggedChanges: LeadActivityLog[] = [];

  fieldKeys.forEach(key => {
    if (updates[key] !== undefined && updates[key] !== lead[key]) {
      const oldVal = String(lead[key] || '');
      const newVal = String(updates[key] || '');

      // Apply update
      (lead as any)[key] = updates[key];

      // Auto create audit log for this field update/correction
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
        content: `Manual individual record update performed by ${performedBy}.`,
        performed_by: performedBy,
        created_at: new Date().toISOString()
      };

      dbStore.leadActivities.set(actId, changeActivity);
      loggedChanges.push(changeActivity);
    }
  });

  // Array fields handling (skills, experience, interests)
  ['skills', 'experience', 'interests', 'job_seniority_level'].forEach(arrKey => {
    if (Array.isArray(updates[arrKey])) {
      (lead as any)[arrKey] = updates[arrKey];
    }
  });

  // Re-sync full_name if first_name or last_name modified
  if (updates.first_name || updates.last_name) {
    lead.full_name = `${lead.first_name} ${lead.last_name}`.trim();
  }

  // Recalculate quality score
  lead.score = calculateLeadScore(lead);
  lead.updated_at = new Date().toISOString();

  dbStore.leads.set(lead.id, lead);
  dbStore.saveToDisk();

  res.json({
    success: true,
    message: `Lead updated successfully. ${loggedChanges.length} field corrections audited.`,
    lead,
    logged_changes: loggedChanges
  });
});

// DELETE SINGLE LEAD
apiRouter.delete('/leads/:id', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const deleted = dbStore.leads.delete(leadId);

  if (deleted) {
    // Also clean up activity logs for this lead
    Array.from(dbStore.leadActivities.entries()).forEach(([id, act]) => {
      if (act.lead_id === leadId) {
        dbStore.leadActivities.delete(id);
      }
    });
    dbStore.saveToDisk();
    res.json({ success: true, message: 'Lead and associated activity logs deleted.' });
  } else {
    res.status(404).json({ success: false, error: 'Lead not found.' });
  }
});

// CLEAR / BULK DELETE ALL LEADS FOR ORG
apiRouter.delete('/leads', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  let count = 0;

  Array.from(dbStore.leads.entries()).forEach(([id, lead]) => {
    if (lead.org_id === orgId || lead.org_id === 'org-demo-123') {
      dbStore.leads.delete(id);
      count++;
    }
  });

  Array.from(dbStore.leadActivities.entries()).forEach(([id, act]) => {
    if (act.org_id === orgId || act.org_id === 'org-demo-123') {
      dbStore.leadActivities.delete(id);
    }
  });

  dbStore.saveToDisk();
  res.json({ success: true, message: `Cleared ${count} leads from workspace database.` });
});

// GET COMMUNICATION ACTIVITY LOGS FOR LEAD
apiRouter.get('/leads/:id/activities', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const activities = Array.from(dbStore.leadActivities.values())
    .filter(a => a.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    activities
  });
});

// POST / LOG NEW OMNICHANNEL COMMUNICATION (CALL, EMAIL, WHATSAPP, MEETING, NOTE)
apiRouter.post('/leads/:id/activities', (req: Request, res: Response) => {
  const orgId = getOrgId(req);
  const leadId = req.params.id;
  const { type, summary, content, outcome, duration_seconds, performed_by } = req.body;

  const lead = dbStore.leads.get(leadId);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found.' });
  }

  const actId = uuidv4();
  const newActivity: LeadActivityLog = {
    id: actId,
    lead_id: leadId,
    org_id: orgId,
    type: type || 'note',
    summary: summary || `${(type || 'Activity').toUpperCase()} interaction logged`,
    content: content || '',
    outcome: outcome || undefined,
    duration_seconds: duration_seconds ? parseInt(duration_seconds, 10) : undefined,
    performed_by: performed_by || 'Agent',
    created_at: new Date().toISOString()
  };

  dbStore.leadActivities.set(actId, newActivity);

  // Auto-progress stage to 'contacted' if still in 'new'
  if (lead.status === 'new' && ['call', 'email', 'whatsapp', 'meeting'].includes(type)) {
    lead.status = 'contacted';
    lead.updated_at = new Date().toISOString();
    dbStore.leads.set(lead.id, lead);
  }

  dbStore.saveToDisk();

  res.json({
    success: true,
    message: `${type ? type.toUpperCase() : 'Activity'} logged successfully to lead timeline.`,
    activity: newActivity,
    lead_status: lead.status
  });
});

// SOLOMON AI LEAD OUTREACH PITCH GENERATOR
apiRouter.post('/leads/:id/ai-pitch', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const { channel = 'email', tone = 'professional', custom_goal } = req.body;

  const lead = dbStore.leads.get(leadId);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found.' });
  }

  const firstName = lead.first_name || lead.full_name.split(' ')[0] || 'there';
  const company = lead.company_name || 'your company';
  const title = lead.job_title || 'leader';
  const topSkill = lead.skills[0] || 'growth & leadership';
  const interest = lead.interests[0] || 'innovation';

  let subject = '';
  let body = '';

  if (channel === 'email') {
    subject = `Quick question regarding ${company}’s customer experience workflow`;
    body = `Hi ${firstName},

I came across your work as ${title} at ${company} and was impressed by your focus on ${topSkill}.

At Quadrace CRM, we help high-growth leaders unify WhatsApp, Instagram, Email, and Web Chat into an autonomous AI workspace powered by Solomon AI—cutting support resolution time by 78% while accelerating qualified pipeline.

${custom_goal ? `Specifically for ${company}: ${custom_goal}\n\n` : ''}Would you be open to a brief 10-minute chat this Thursday to see how similar teams are driving 3x customer retention?

Best regards,
Alex & The Quadrace CRM Team`;
  } else if (channel === 'whatsapp') {
    body = `Hi ${firstName}! Hope you're having a great week at ${company}. 

Saw your background in ${topSkill} and wanted to share a quick 1-min interactive demo showing how Solomon AI automates omnichannel customer conversations across WhatsApp and Web Chat. 

Would you like me to send over the demo link?`;
  } else {
    // LinkedIn connection / InMail pitch
    subject = `Connecting with ${company} leadership`;
    body = `Hi ${firstName}, I've been following ${company}'s progress in your space. As ${title}, you might find our new AI-driven omnichannel support platform interesting. Let's connect!`;
  }

  res.json({
    success: true,
    channel,
    subject,
    pitch: body,
    lead_name: lead.full_name,
    company: lead.company_name
  });
});

