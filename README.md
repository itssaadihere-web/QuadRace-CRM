# QuadRace-CRM

> **Autonomous AI-Powered Omnichannel Customer Engagement & Growth Platform**

QuadRace CRM is an enterprise-grade omnichannel customer engagement solution powered by **Solomon AI**, Claude 3.5 Sonnet RAG context retrieval, real-time WebSocket infrastructure, and cross-platform mobile support.

---

## 🌟 Key Features

- **Public Marketing & Gateway Portal**: Full public marketing website (`/`, `/about`, `/solutions`, `/integrations`, `/pricing`) and authentication gateway (`/login`, `/signup`).
- **Solomon AI RAG Agent**: Autonomous customer service agent powered by Claude 3.5 Sonnet RAG retrieval, pgvector embeddings, and persistent disk memory.
- **Dynamic Onboarding Popup**: Smart 4-step vertical setup with live dynamic rule synchronization and a prominent skip option.
- **Real-Time Omnichannel Inbox**: Unifies Web Chat, WhatsApp, Instagram, and Email into a single live dashboard with Socket.io real-time updates.
- **Copilot Approval Mode**: Switch between 100% automated AI mode and 1-Click Human Agent approval draft mode.
- **Unanswered Gaps Hub**: Log low-confidence customer queries and inject verified answers directly into vector memory with 1 click.
- **Vite Web Widget SDK**: Lightweight Shadow DOM chat widget (<25KB gzipped) isolated from host website styles.
- **React Native Expo Mobile App**: Mobile support team app with real-time push notifications and 1-tap takeover.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend API**: Node.js, Express, Socket.io, TypeScript
- **AI & RAG Engine**: Anthropic Claude 3.5 Sonnet, pgvector, persistent disk storage (`data_store.json`)
- **Widget SDK**: Vanilla TypeScript, Vite, Shadow DOM
- **Mobile**: React Native, Expo (SDK 51), Expo Router

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# Dashboard
cd ../dashboard && npm install

# Widget
cd ../widget && npm install

# Mobile
cd ../mobile && npm install
```

### 2. Run Local Development Servers
```bash
# Backend API (Port 5000)
cd backend && npm run dev

# Dashboard & Marketing Web Site (Port 3000)
cd dashboard && npm run dev

# Chat Widget Preview (Port 5173)
cd widget && npx vite --port 5173
```

---

## 📜 License

MIT License © 2026 QuadRace CRM & Solomon AI
