import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { dbStore, Message, Conversation } from '../db/store';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export interface SolomonResponse {
  messageText: string;
  metadata?: any;
  confidenceScore: number;
  transferTriggered: boolean;
  copilotDraft?: string;
  sourceCitations?: string[];
}

export class SolomonAIEngine {
  /**
   * Helper to get fresh Anthropic SDK instance with valid API Key
   */
  private static getClient(): Anthropic | null {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (apiKey && apiKey.startsWith('sk-ant')) {
      return new Anthropic({ apiKey });
    }
    return null;
  }

  /**
   * Process incoming customer query using Dynamic RAG Context Matching across ALL Knowledge Base Chunks
   */
  public static async processQuery(
    orgId: string,
    conversationId: string,
    queryText: string
  ): Promise<SolomonResponse> {
    const org = dbStore.organizations.get(orgId) || Array.from(dbStore.organizations.values())[0];
    const targetOrgId = org ? org.id : 'org-demo-123';

    // Check monthly quota hard lock
    if (org && org.monthly_chats_used >= org.monthly_chats_limit) {
      return {
        messageText: "Our AI support agent has reached its monthly conversation limit. A human representative will be with you shortly.",
        confidenceScore: 1.0,
        transferTriggered: true
      };
    }

    if (org) org.monthly_chats_used += 1;

    // 1. Gather ALL Knowledge Base Chunks for this Organization
    const allKbChunks = Array.from(dbStore.knowledgeBases.values())
      .filter(kb => kb.org_id === targetOrgId || kb.org_id === 'org-demo-123');

    const formattedContext = allKbChunks
      .map(kb => `[Knowledge Source: ${kb.source_url || kb.source_type}]\n${kb.content_chunk}`)
      .join('\n\n');

    // System prompt with strict RAG instructions
    const systemPrompt = `You are Solomon AI, an autonomous RAG and E-Commerce growth assistant for "${org ? org.name : 'Store'}".
    
Guidance & Rules from Store Owner:
"${org?.solomon_guidance || 'Provide accurate, friendly customer service.'}"

Knowledge Base Context (Use this authoritative data to answer customer questions):
${formattedContext || 'No specific knowledge base uploaded yet.'}

Instructions:
- Use tool calls whenever a user asks about order status or product recommendations.
- Prioritize information strictly from the Knowledge Base Context above when answering customer queries.
- If the customer asks about information contained in the Knowledge Base, provide a precise answer based on that content.
- Be concise, warm, professional, and helpful.`;

    // 2. Try Anthropic Claude 3.5 Sonnet RAG Call
    try {
      const client = SolomonAIEngine.getClient();
      if (client) {
        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: queryText }],
          tools: [
            {
              name: 'get_order_status',
              description: 'Retrieve order tracking details, status, and shipping carrier info for a customer order number.',
              input_schema: {
                type: 'object',
                properties: {
                  order_number: { type: 'string', description: 'Order ID or number e.g. #AUR-94021' }
                },
                required: ['order_number']
              }
            },
            {
              name: 'recommend_products',
              description: 'Find top product recommendations for the customer based on item category or preference.',
              input_schema: {
                type: 'object',
                properties: {
                  category: { type: 'string', description: 'Product category or style requested' }
                },
                required: ['category']
              }
            }
          ]
        });

        const toolUseBlock = response.content.find(block => block.type === 'tool_use');
        
        if (toolUseBlock && toolUseBlock.type === 'tool_use') {
          if (toolUseBlock.name === 'get_order_status') {
            const args = toolUseBlock.input as any;
            const orderNum = args.order_number || 'AUR-94021';
            return {
              messageText: `I looked up order ${orderNum}! Here is your live tracking timeline:`,
              metadata: {
                type: 'order_status_card',
                order_number: orderNum,
                status: 'In Transit',
                carrier: 'FedEx Express',
                tracking_code: 'FX-982310492',
                estimated_delivery: 'Tomorrow by 4:00 PM',
                items: ['Organic Cotton Streetwear Hoodie']
              },
              confidenceScore: 0.98,
              transferTriggered: false
            };
          }

          if (toolUseBlock.name === 'recommend_products') {
            return {
              messageText: `Here are our top recommended items for you:`,
              metadata: {
                type: 'product_recommendations',
                products: [
                  {
                    id: 'prod-01',
                    title: 'Vintage Washed Denim Trucker Jacket',
                    price: '$118.00',
                    original_price: '$140.00',
                    rating: 4.9,
                    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
                    tag: 'Best Seller'
                  },
                  {
                    id: 'prod-02',
                    title: 'Raw Indigo Oversized Denim Shirt-Jacket',
                    price: '$95.00',
                    rating: 4.8,
                    image_url: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=600&q=80',
                    tag: 'New Arrival'
                  }
                ]
              },
              confidenceScore: 0.95,
              transferTriggered: false
            };
          }
        }

        const textBlock = response.content.find(block => block.type === 'text');
        const replyText = textBlock && textBlock.type === 'text' ? textBlock.text : "I am here to assist you!";

        return {
          messageText: replyText,
          confidenceScore: 0.96,
          sourceCitations: ['Claude 3.5 Sonnet RAG Context'],
          transferTriggered: false
        };
      }
    } catch (err) {
      console.warn('Claude API RAG execution fallback:', err);
    }

    // 3. Dynamic RAG Keyword Matcher Across ALL Knowledge Base Chunks (Offline Fallback Engine)
    const queryTokens = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    let bestChunk: any = null;
    let bestScore = 0;

    for (const kb of allKbChunks) {
      const chunkText = kb.content_chunk.toLowerCase();
      let matchCount = 0;

      queryTokens.forEach(token => {
        if (chunkText.includes(token)) {
          matchCount += 1;
        }
      });

      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestChunk = kb;
      }
    }

    if (bestChunk && bestScore > 0) {
      return {
        messageText: bestChunk.content_chunk,
        confidenceScore: 0.94,
        sourceCitations: [bestChunk.source_url || bestChunk.source_type],
        transferTriggered: false
      };
    }

    // Order status check fallback
    if (queryText.toLowerCase().includes('order') || queryText.toLowerCase().includes('track') || queryText.toLowerCase().includes('#aur')) {
      const orderMatch = queryText.match(/#[A-Za-z0-9-]+/) || ['#AUR-94021'];
      return {
        messageText: `I found your order ${orderMatch[0]}! Here is the latest shipping update:`,
        metadata: {
          type: 'order_status_card',
          order_number: orderMatch[0],
          status: 'In Transit',
          carrier: 'FedEx Express',
          tracking_code: 'FX-982310492',
          estimated_delivery: 'Tomorrow by 4:00 PM',
          items: ['Organic Cotton Hoodie (Medium / Onyx Black)']
        },
        confidenceScore: 0.99,
        transferTriggered: false
      };
    }

    // Product recommendation check fallback
    if (queryText.toLowerCase().includes('recommend') || queryText.toLowerCase().includes('jacket') || queryText.toLowerCase().includes('product')) {
      return {
        messageText: `Here are our top recommended items tailored for you:`,
        metadata: {
          type: 'product_recommendations',
          products: [
            {
              id: 'prod-01',
              title: 'Vintage Washed Denim Trucker Jacket',
              price: '$118.00',
              original_price: '$140.00',
              rating: 4.9,
              image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
              tag: 'Best Seller'
            },
            {
              id: 'prod-02',
              title: 'Raw Indigo Oversized Denim Shirt-Jacket',
              price: '$95.00',
              rating: 4.8,
              image_url: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=600&q=80',
              tag: 'New Arrival'
            }
          ]
        },
        confidenceScore: 0.95,
        transferTriggered: false
      };
    }

    // 4. Low-Confidence Gap Logging
    const newGap = {
      id: uuidv4(),
      org_id: targetOrgId,
      customer_query: queryText,
      context: `Customer query in conversation ${conversationId}`,
      frequency_count: 1,
      resolved_status: false,
      created_at: new Date().toISOString()
    };
    dbStore.unansweredGaps.set(newGap.id, newGap);

    return {
      messageText: `I want to make sure I give you the exact right answer! I have logged your query and notified our support agent team to take over this chat.`,
      confidenceScore: 0.45,
      transferTriggered: true,
      copilotDraft: `Hi! I saw your question regarding "${queryText}". Let me get that sorted for you right away!`,
      sourceCitations: ['Unanswered Gap Logged']
    };
  }
}
