import { Server, Socket } from 'socket.io';
import { dbStore, Message, Conversation } from '../db/store';
import { SolomonAIEngine } from '../services/solomonAI';
import { v4 as uuidv4 } from 'uuid';

export function setupChatSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    socket.on('join_conversation', ({ conversationId, orgId }) => {
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
      }
      if (orgId) {
        socket.join(`org_${orgId}`);
      }
    });

    // Real-Time Typing Preview
    socket.on('typing:start', ({ conversationId, orgId, senderType, previewText }) => {
      socket.to(`conv_${conversationId}`).emit('typing:preview', {
        conversationId,
        senderType,
        previewText,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ conversationId, orgId, senderType }) => {
      socket.to(`conv_${conversationId}`).emit('typing:preview', {
        conversationId,
        senderType,
        previewText: '',
        isTyping: false
      });
    });

    // Toggle Copilot Mode
    socket.on('copilot_mode:toggle', ({ conversationId, orgId, copilotMode }) => {
      const conv = dbStore.conversations.get(conversationId);
      const org = dbStore.organizations.get(orgId);
      
      if (conv) conv.copilot_mode = copilotMode;
      if (org) org.copilot_mode = copilotMode;

      dbStore.saveToDisk();

      io.to(`conv_${conversationId}`).emit('copilot_mode:updated', { conversationId, copilotMode });
    });

    // Send Message Handler (Persisted)
    socket.on('send_message', async ({ conversationId, orgId, senderType, text, metadata }) => {
      const conv = dbStore.conversations.get(conversationId);
      const org = dbStore.organizations.get(orgId);
      if (!conv) return;

      const isApprovalMode = conv.copilot_mode !== undefined ? conv.copilot_mode : (org ? org.copilot_mode : true);

      const userMsg: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        sender_type: senderType,
        text,
        metadata: metadata || null,
        created_at: new Date().toISOString()
      };
      dbStore.messages.set(userMsg.id, userMsg);
      conv.last_message_at = userMsg.created_at;
      conv.last_activity_at = userMsg.created_at;

      dbStore.saveToDisk();

      io.to(`conv_${conversationId}`).emit('new_message', userMsg);
      if (orgId) {
        io.to(`org_${orgId}`).emit('conversation_updated', conv);
      }

      // Solomon AI Processing
      if (senderType === 'visitor' && (conv.status === 'ai_handled' || conv.status === 'pending_transfer')) {
        io.to(`conv_${conversationId}`).emit('typing:preview', {
          conversationId,
          senderType: 'solomon_ai',
          previewText: isApprovalMode ? 'Solomon Copilot drafting response...' : 'Solomon AI analyzing response...',
          isTyping: true
        });

        setTimeout(async () => {
          const aiRes = await SolomonAIEngine.processQuery(orgId, conversationId, text);
          
          if (aiRes.transferTriggered) {
            conv.status = 'pending_transfer';
          }

          io.to(`conv_${conversationId}`).emit('typing:preview', {
            conversationId,
            senderType: 'solomon_ai',
            previewText: '',
            isTyping: false
          });

          if (isApprovalMode) {
            const draftPayload = {
              conversationId,
              copilotDraft: aiRes.messageText,
              metadata: aiRes.metadata,
              sourceCitations: aiRes.sourceCitations || ['Solomon RAG Engine'],
              confidenceScore: aiRes.confidenceScore
            };

            io.to(`conv_${conversationId}`).emit('copilot_draft_ready', draftPayload);
            if (orgId) {
              io.to(`org_${orgId}`).emit('copilot_draft_ready', draftPayload);
            }
          } else {
            const aiMsg: Message = {
              id: uuidv4(),
              conversation_id: conversationId,
              sender_type: 'solomon_ai',
              text: aiRes.messageText,
              metadata: {
                ...(aiRes.metadata || {}),
                confidenceScore: aiRes.confidenceScore,
                sourceCitations: aiRes.sourceCitations
              },
              created_at: new Date().toISOString()
            };
            dbStore.messages.set(aiMsg.id, aiMsg);
            conv.last_message_at = aiMsg.created_at;

            dbStore.saveToDisk();

            io.to(`conv_${conversationId}`).emit('new_message', aiMsg);
            if (orgId) {
              io.to(`org_${orgId}`).emit('conversation_updated', conv);
            }
          }
        }, 600);
      }
    });

    // Human Takeover Protocol Event (Persisted)
    socket.on('human_takeover', ({ conversationId, orgId, agentId, action }) => {
      const conv = dbStore.conversations.get(conversationId);
      if (!conv) return;

      if (action === 'takeover') {
        conv.status = 'human_active';
        conv.assigned_agent_id = agentId || 'usr-agent-1';
      } else if (action === 'release') {
        conv.status = 'ai_handled';
      } else if (action === 'close') {
        conv.status = 'closed';
      }

      conv.last_activity_at = new Date().toISOString();
      dbStore.conversations.set(conv.id, conv);

      const sysMsg: Message = {
        id: uuidv4(),
        conversation_id: conversationId,
        sender_type: 'solomon_ai',
        text: action === 'takeover' 
          ? `[System] Human Agent has taken over control of this chat.`
          : action === 'release' 
          ? `[System] Solomon AI has resumed autonomous handling.` 
          : `[System] Conversation marked as closed.`,
        metadata: { is_system_notice: true },
        created_at: new Date().toISOString()
      };
      dbStore.messages.set(sysMsg.id, sysMsg);

      dbStore.saveToDisk();

      io.to(`conv_${conversationId}`).emit('new_message', sysMsg);
      io.to(`conv_${conversationId}`).emit('status_changed', { conversationId, status: conv.status });
      if (orgId) {
        io.to(`org_${orgId}`).emit('conversation_updated', conv);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
