# Sentinal AI - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                            USER LAYER                                 │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │              │
│  │   Browser    │  │   Browser    │  │   Browser    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ HTTPS
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                                                                         │
│                      FRONTEND (Next.js 16)                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Pages & Components                            │  │
│  │                                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │   Home   │  │   Chat   │  │  Brand   │  │ Library  │       │  │
│  │  │   Page   │  │   Page   │  │   Page   │  │   Page   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ Websites │  │ Analytics│  │ Automate │  │ Account  │       │  │
│  │  │   Page   │  │   Page   │  │   Page   │  │   Page   │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    UI Components                                 │  │
│  │                                                                  │  │
│  │  • ChatArea (real-time messaging)                               │  │
│  │  • ChatSidebar (conversation history)                           │  │
│  │  • WebPreview (live website preview)                            │  │
│  │  • Animated components (Framer Motion)                          │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    API Client Layer                              │  │
│  │                                                                  │  │
│  │  • lib/api/agent.ts (AI agent communication)                    │  │
│  │  • Axios HTTP client                                            │  │
│  │  • Error handling & retries                                     │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                │ REST API
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                                                                         │
│                    BACKEND (FastAPI + Python)                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                                 │  │
│  │                                                                  │  │
│  │  POST /generate     - Generate content (image/video + caption)  │  │
│  │  POST /publish      - Publish to Instagram                      │  │
│  │  POST /agent        - Chat with AI agents                       │  │
│  │  POST /website      - Generate website code                     │  │
│  │  GET  /health       - Health check                              │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    AI Agent System (Google ADK)                  │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │              Root Agent (Orchestrator)                    │  │  │
│  │  │                                                           │  │  │
│  │  │  Coordinates all sub-agents and manages workflow         │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │  │   Visual     │  │  Copywriter  │  │   Location   │         │  │
│  │  │   Agent      │  │    Agent     │  │    Agent     │         │  │
│  │  │              │  │              │  │              │         │  │
│  │  │ • Generates  │  │ • Writes     │  │ • Finds      │         │  │
│  │  │   images     │  │   captions   │  │   trending   │         │  │
│  │  │ • Creates    │  │ • Adds       │  │   locations  │         │  │
│  │  │   videos     │  │   hashtags   │  │ • Maps API   │         │  │
│  │  │ • Uploads    │  │ • Brand      │  │   integration│         │  │
│  │  │   to R2      │  │   voice      │  │              │         │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │  │
│  │                                                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│  │  │   Posting    │  │    Brand     │  │  Strategist  │         │  │
│  │  │   Agent      │  │   Manager    │  │    Agent     │         │  │
│  │  │              │  │              │  │              │         │  │
│  │  │ • Publishes  │  │ • Extracts   │  │ • Analyzes   │         │  │
│  │  │   to IG      │  │   brand DNA  │  │   trends     │         │  │
│  │  │ • Waits for  │  │ • Saves to   │  │ • Reviews    │         │  │
│  │  │   approval   │  │   database   │  │   performance│         │  │
│  │  │ • Confirms   │  │ • Maintains  │  │ • Adjusts    │         │  │
│  │  │   success    │  │   consistency│  │   strategy   │         │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘         │  │
│  │                                                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐                            │  │
│  │  │     Web      │  │  Automation  │                            │  │
│  │  │  Architect   │  │  Strategist  │                            │  │
│  │  │              │  │              │                            │  │
│  │  │ • Generates  │  │ • Plans      │                            │  │
│  │  │   websites   │  │   content    │                            │  │
│  │  │ • Creates    │  │ • Schedules  │                            │  │
│  │  │   React code │  │   posts      │                            │  │
│  │  │ • Applies    │  │ • Optimizes  │                            │  │
│  │  │   brand DNA  │  │   timing     │                            │  │
│  │  └──────────────┘  └──────────────┘                            │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Business Logic Layer                          │  │
│  │                                                                  │  │
│  │  • Content generation pipeline                                  │  │
│  │  • Brand DNA management                                         │  │
│  │  • Session management                                           │  │
│  │  • Media processing                                             │  │
│  │  • Instagram API integration                                    │  │
│  │                                                                  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────┬───────────────┬───────────────┬───────────────┬─────────┘
              │               │               │               │
              │               │               │               │
┌─────────────▼──┐  ┌─────────▼──┐  ┌─────────▼──┐  ┌─────────▼──┐
│                │  │            │  │            │  │            │
│  Google Gemini │  │  Supabase  │  │ Cloudflare │  │ Instagram  │
│      AI        │  │  Database  │  │     R2     │  │  Graph API │
│                │  │            │  │  Storage   │  │            │
│  • Gemini 2.0  │  │  • Brand   │  │            │  │  • Post    │
│    Flash       │  │    DNA     │  │  • Images  │  │    images  │
│  • Image Gen   │  │  • Users   │  │  • Videos  │  │  • Post    │
│  • Veo 2       │  │  • Content │  │  • Assets  │  │    reels   │
│    (video)     │  │  • Projects│  │            │  │  • Get     │
│  • Text Gen    │  │  • Sessions│  │  • Public  │  │    insights│
│                │  │            │  │    URLs    │  │            │
└────────────────┘  └────────────┘  └────────────┘  └────────────┘
```

## Component Interaction Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│                    User Interaction Flow                           │
│                                                                    │
│  1. User opens app                                                 │
│     │                                                              │
│     ▼                                                              │
│  2. Next.js renders landing page                                   │
│     │                                                              │
│     ▼                                                              │
│  3. User clicks "Get Started" → navigates to /chat                 │
│     │                                                              │
│     ▼                                                              │
│  4. ChatArea component loads                                       │
│     │                                                              │
│     ▼                                                              │
│  5. User types message + optionally uploads image                  │
│     │                                                              │
│     ▼                                                              │
│  6. Frontend calls lib/api/agent.ts                                │
│     │                                                              │
│     ▼                                                              │
│  7. API request sent to backend /generate endpoint                 │
│     │                                                              │
│     ▼                                                              │
│  8. Backend orchestrates AI agents                                 │
│     │                                                              │
│     ├─► Visual Agent generates image/video                         │
│     │                                                              │
│     ├─► Copywriter Agent writes caption                            │
│     │                                                              │
│     ├─► Location Agent finds trending spot                         │
│     │                                                              │
│     └─► Posting Agent waits for approval                           │
│         │                                                          │
│         ▼                                                          │
│  9. Response sent back to frontend                                 │
│     │                                                              │
│     ▼                                                              │
│  10. ChatArea displays preview                                     │
│      │                                                             │
│      ▼                                                             │
│  11. User approves                                                 │
│      │                                                             │
│      ▼                                                             │
│  12. Backend publishes to Instagram                                │
│      │                                                             │
│      ▼                                                             │
│  13. Success confirmation shown                                    │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack
```
┌─────────────────────────────────────────┐
│         Next.js 16 (React 19)           │
├─────────────────────────────────────────┤
│  • Server-side rendering                │
│  • API routes                           │
│  • Image optimization                   │
│  • File-based routing                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│          Tailwind CSS 4                 │
├─────────────────────────────────────────┤
│  • Utility-first styling                │
│  • Responsive design                    │
│  • Custom theme                         │
│  • Dark mode support                    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Framer Motion 12                │
├─────────────────────────────────────────┤
│  • Smooth animations                    │
│  • Page transitions                     │
│  • Gesture handling                     │
│  • Spring physics                       │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│            TypeScript 5                 │
├─────────────────────────────────────────┤
│  • Type safety                          │
│  • Better IDE support                   │
│  • Catch errors early                   │
│  • Self-documenting code                │
└─────────────────────────────────────────┘
```

### Backend Stack
```
┌─────────────────────────────────────────┐
│          FastAPI (Python)               │
├─────────────────────────────────────────┤
│  • Async/await support                  │
│  • Auto API documentation               │
│  • Fast performance                     │
│  • Type hints                           │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Google ADK (Agent Dev Kit)      │
├─────────────────────────────────────────┤
│  • Multi-agent orchestration            │
│  • Session management                   │
│  • Tool integration                     │
│  • State management                     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│          Google Gemini AI               │
├─────────────────────────────────────────┤
│  • Text generation                      │
│  • Image generation                     │
│  • Video generation (Veo 2)             │
│  • Vision capabilities                  │
└─────────────────────────────────────────┘
```

### Data & Storage
```
┌─────────────────────────────────────────┐
│            Supabase                     │
├─────────────────────────────────────────┤
│  • PostgreSQL database                  │
│  • Real-time subscriptions              │
│  • Authentication                       │
│  • Row-level security                   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Cloudflare R2                   │
├─────────────────────────────────────────┤
│  • S3-compatible storage                │
│  • Global CDN                           │
│  • No egress fees                       │
│  • Fast delivery                        │
└─────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Transport Layer                                          │
│     • HTTPS/TLS encryption                                   │
│     • Secure WebSocket connections                           │
│                                                              │
│  2. Authentication Layer                                     │
│     • Supabase Auth                                          │
│     • JWT tokens                                             │
│     • Session management                                     │
│                                                              │
│  3. Authorization Layer                                      │
│     • Row-level security (RLS)                               │
│     • API key validation                                     │
│     • User permissions                                       │
│                                                              │
│  4. Data Layer                                               │
│     • Encrypted at rest                                      │
│     • Encrypted in transit                                   │
│     • Regular backups                                        │
│                                                              │
│  5. API Layer                                                │
│     • Rate limiting                                          │
│     • CORS configuration                                     │
│     • Input validation                                       │
│     • Error handling                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                  Horizontal Scaling                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vercel)                                           │
│  • Edge network deployment                                   │
│  • Automatic scaling                                         │
│  • CDN caching                                               │
│                                                              │
│  Backend (Render/Cloud Run)                                  │
│  • Container-based deployment                                │
│  • Auto-scaling based on load                                │
│  • Load balancing                                            │
│                                                              │
│  Database (Supabase)                                         │
│  • Connection pooling                                        │
│  • Read replicas                                             │
│  • Automatic backups                                         │
│                                                              │
│  Storage (Cloudflare R2)                                     │
│  • Global distribution                                       │
│  • Unlimited bandwidth                                       │
│  • High availability                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
