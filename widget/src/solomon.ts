import { io, Socket } from 'socket.io-client';

(function () {
  const currentScript = document.currentScript as HTMLScriptElement;
  const orgId = currentScript?.getAttribute('data-org-id') || 'org-demo-123';
  const apiHost = currentScript?.getAttribute('data-api-host') || 'http://localhost:5000';

  let socket: Socket | null = null;
  let conversationId: string | null = null;
  let visitorId = localStorage.getItem('solomon_visitor_id') || `vis-${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem('solomon_visitor_id', visitorId);

  let isOpen = false;
  let typingTimer: any = null;
  const renderedMsgIds = new Set<string>();

  const hostDiv = document.createElement('div');
  hostDiv.id = 'quadrace-widget-container';
  document.body.appendChild(hostDiv);

  const shadow = hostDiv.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    .widget-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 62px;
      height: 62px;
      border-radius: 31px;
      background: linear-gradient(135deg, #0F2B1D 0%, #153B27 100%);
      color: #D4AF37;
      box-shadow: 0 8px 24px rgba(15, 43, 29, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 2px solid #C59B27;
    }
    .widget-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 32px rgba(15, 43, 29, 0.45);
    }

    .widget-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      color: #0f172a;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(15, 43, 29, 0.15);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999998;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .widget-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #0F2B1D 0%, #153B27 100%);
      border-bottom: 2px solid #C59B27;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff;
    }
    .header-info { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #C59B27;
      overflow: hidden;
    }
    .avatar img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
    .title { font-size: 15px; font-weight: 700; color: #ffffff; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #34D399; margin-right: 6px; }
    .status-text { font-size: 12px; color: #E6C280; font-weight: 500; }
    .close-btn { background: none; border: none; color: #E6C280; cursor: pointer; font-size: 20px; }

    .messages-container {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F8FAF8;
    }

    .msg-row { display: flex; flex-direction: column; max-width: 85%; }
    .msg-row.visitor { align-self: flex-end; }
    .msg-row.solomon_ai, .msg-row.human_agent { align-self: flex-start; }

    .msg-bubble {
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .visitor .msg-bubble {
      background: #E2E8F0;
      color: #0F172A;
      border-bottom-right-radius: 4px;
    }
    .solomon_ai .msg-bubble, .human_agent .msg-bubble {
      background: #0F2B1D;
      color: #ffffff;
      border: 1px solid #C59B27;
      border-bottom-left-radius: 4px;
    }

    .card-container {
      margin-top: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-title { font-size: 12px; font-weight: 700; color: #0F2B1D; text-transform: uppercase; letter-spacing: 0.5px; }

    .product-card { display: flex; gap: 10px; background: #f8faf8; border-radius: 8px; padding: 8px; border: 1px solid #e2e8f0; }
    .product-img { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; }
    .product-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .product-name { font-size: 13px; font-weight: 700; color: #0f172a; }
    .product-price { font-size: 13px; font-weight: 800; color: #0F2B1D; }
    .add-to-cart-btn {
      margin-top: 6px;
      padding: 6px 12px;
      background: #0F2B1D;
      color: #D4AF37;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .add-to-cart-btn:hover { background: #153B27; }

    .order-card { background: #f8faf8; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .order-status-badge {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.15);
      color: #047857;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .order-meta { font-size: 12px; color: #334155; line-height: 1.6; }

    .typing-indicator {
      font-size: 12px;
      color: #0F2B1D;
      padding: 6px 16px;
      font-style: italic;
      background: #FDF8EC;
      border-top: 1px solid #C59B27;
      font-weight: 600;
    }

    .input-area {
      padding: 12px 16px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .input-box {
      flex: 1;
      background: #f8faf8;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 10px 14px;
      color: #0f172a;
      font-size: 14px;
      outline: none;
    }
    .input-box:focus { border-color: #0F2B1D; }
    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #0F2B1D;
      color: #D4AF37;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .upload-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 8px;
      font-size: 18px;
    }
  `;
  shadow.appendChild(styleEl);

  const container = document.createElement('div');
  container.innerHTML = `
    <button class="widget-launcher" id="launcherBtn">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
    </button>

    <div class="widget-window" id="window">
      <div class="header">
        <div class="header-info">
          <div class="avatar"><img src="http://localhost:3000/logo.png" alt="Logo" /></div>
          <div>
            <div class="title">Solomon AI</div>
            <div class="status-text"><span class="status-dot"></span>Quadrace CRM Active</div>
          </div>
        </div>
        <button class="close-btn" id="closeBtn">✕</button>
      </div>

      <div class="messages-container" id="messagesList"></div>

      <div class="typing-indicator" id="typingNotice" style="display: none;"></div>

      <div class="input-area">
        <input type="file" id="fileInput" style="display: none;" accept="image/*" />
        <button class="upload-btn" id="uploadBtn" title="Attach Receipt or Photo">📷</button>
        <input type="text" class="input-box" id="msgInput" placeholder="Ask Solomon AI anything..." />
        <button class="send-btn" id="sendBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </div>
    </div>
  `;
  shadow.appendChild(container);

  const launcherBtn = shadow.getElementById('launcherBtn')!;
  const windowEl = shadow.getElementById('window')!;
  const closeBtn = shadow.getElementById('closeBtn')!;
  const messagesList = shadow.getElementById('messagesList')!;
  const msgInput = shadow.getElementById('msgInput') as HTMLInputElement;
  const sendBtn = shadow.getElementById('sendBtn')!;
  const typingNotice = shadow.getElementById('typingNotice')!;
  const uploadBtn = shadow.getElementById('uploadBtn')!;
  const fileInput = shadow.getElementById('fileInput') as HTMLInputElement;

  const toggleWindow = () => {
    isOpen = !isOpen;
    if (isOpen) {
      windowEl.classList.add('open');
      if (!conversationId) initConversation();
    } else {
      windowEl.classList.remove('open');
    }
  };

  launcherBtn.addEventListener('click', toggleWindow);
  closeBtn.addEventListener('click', toggleWindow);

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e: any) => {
    const file = e.target.files[0];
    if (file) {
      if (socket && conversationId) {
        socket.emit('send_message', {
          conversationId,
          orgId,
          senderType: 'visitor',
          text: `I uploaded an image: ${file.name} for inspection.`,
          metadata: { has_attachment: true, filename: file.name }
        });
      }
    }
  });

  async function initConversation() {
    try {
      const res = await fetch(`${apiHost}/api/conversations/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': orgId },
        body: JSON.stringify({ visitor_id: visitorId, channel: 'web_widget' })
      });
      const data = await res.json();
      if (data.success) {
        conversationId = data.conversation.id;
        
        if (!socket) {
          socket = io(apiHost);
        } else {
          socket.off('new_message');
          socket.off('typing:preview');
        }

        socket.emit('join_conversation', { conversationId, orgId: '' });

        socket.on('new_message', (msg: any) => {
          appendMessage(msg);
        });

        socket.on('typing:preview', ({ senderType, previewText, isTyping }: any) => {
          if (senderType !== 'visitor') {
            if (isTyping && previewText) {
              typingNotice.textContent = previewText;
              typingNotice.style.display = 'block';
            } else {
              typingNotice.style.display = 'none';
            }
          }
        });

        const msgRes = await fetch(`${apiHost}/api/conversations/${conversationId}/messages`);
        const msgData = await msgRes.json();
        if (msgData.messages) {
          messagesList.innerHTML = '';
          renderedMsgIds.clear();
          msgData.messages.forEach((m: any) => appendMessage(m));
        }
      }
    } catch (err) {
      console.error('Solomon Widget error:', err);
    }
  }

  msgInput.addEventListener('input', () => {
    if (!socket || !conversationId) return;

    socket.emit('typing:start', {
      conversationId,
      orgId,
      senderType: 'visitor',
      previewText: msgInput.value
    });

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing:stop', { conversationId, orgId, senderType: 'visitor' });
    }, 1200);
  });

  const handleSend = () => {
    const text = msgInput.value.trim();
    if (!text || !conversationId || !socket) return;

    socket.emit('typing:stop', { conversationId, orgId, senderType: 'visitor' });
    socket.emit('send_message', {
      conversationId,
      orgId,
      senderType: 'visitor',
      text
    });

    msgInput.value = '';
  };

  sendBtn.addEventListener('click', handleSend);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  function appendMessage(msg: any) {
    if (msg.id && renderedMsgIds.has(msg.id)) return;
    if (msg.id) renderedMsgIds.add(msg.id);

    const row = document.createElement('div');
    row.className = `msg-row ${msg.sender_type}`;

    let cardHtml = '';
    
    if (msg.metadata && msg.metadata.type === 'order_status_card') {
      const card = msg.metadata;
      cardHtml = `
        <div class="card-container">
          <div class="card-title">Order Status Details</div>
          <div class="order-card">
            <span class="order-status-badge">● ${card.status}</span>
            <div class="order-meta">
              <strong>Order:</strong> #${card.order_number}<br/>
              <strong>Carrier:</strong> ${card.carrier} (${card.tracking_code})<br/>
              <strong>Est. Delivery:</strong> ${card.estimated_delivery}
            </div>
          </div>
        </div>
      `;
    }

    if (msg.metadata && msg.metadata.type === 'product_recommendations' && msg.metadata.products) {
      const prods = msg.metadata.products.map((p: any) => `
        <div class="product-card">
          <img class="product-img" src="${p.image_url}" alt="${p.title}" />
          <div class="product-details">
            <div>
              <div class="product-name">${p.title}</div>
              <div class="product-price">${p.price}</div>
            </div>
            <button class="add-to-cart-btn" onclick="alert('Added ${p.title} to cart!')">Add to Cart</button>
          </div>
        </div>
      `).join('');
      
      cardHtml = `
        <div class="card-container">
          <div class="card-title">Recommended Products</div>
          ${prods}
        </div>
      `;
    }

    row.innerHTML = `
      <div class="msg-bubble">${msg.text} ${cardHtml}</div>
    `;

    messagesList.appendChild(row);
    messagesList.scrollTop = messagesList.scrollHeight;
  }
})();
