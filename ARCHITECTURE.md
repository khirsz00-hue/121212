# ADHD Buddy - Architecture Visualization

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React 18 + TypeScript + Vite                  │  │
│  │                                                              │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  AuthPage  │  │  Dashboard   │  │  Integrations   │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │  ┌────────────┐  ┌──────────────┐                         │  │
│  │  │TaskAssist. │  │CalendarAssist│                         │  │
│  │  └────────────┘  └──────────────┘                         │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │              Custom Hooks Layer                        ││  │
│  │  │  useUser | useIntegrations | useTodoistTasks         ││  │
│  │  │           | useGoogleEvents                           ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐│  │
│  │  │              Services Layer                            ││  │
│  │  │   todoistService | googleService                      ││  │
│  │  └──────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS/JWT
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                    VERCEL SERVERLESS                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   API Middleware                          │  │
│  │            JWT Verification (withAuth)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Todoist    │  │   Google     │  │     OpenAI       │    │
│  │  (10 APIs)   │  │  (5 APIs)    │  │   (1 Proxy)      │    │
│  │              │  │              │  │                  │    │
│  │ • OAuth      │  │ • OAuth      │  │ • Chat API       │    │
│  │ • CRUD       │  │ • Events     │  │ • Server-side    │    │
│  │ • Webhooks   │  │ • Refresh    │  │   keys only      │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
│                                                                   │
│  ┌──────────────┐                                               │
│  │    Setup     │                                               │
│  │  (1 API)     │                                               │
│  │              │                                               │
│  │ • Migrations │                                               │
│  └──────────────┘                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        │                             │
┌───────┴────────┐         ┌─────────┴────────┐
│   SUPABASE     │         │  EXTERNAL APIs   │
│                │         │                  │
│ ┌────────────┐│         │ ┌──────────────┐ │
│ │PostgreSQL  ││         │ │Todoist API   │ │
│ │            ││         │ │              │ │
│ │6 Tables    ││         │ │Tasks,Projects││ │
│ │RLS Enabled ││         │ │Labels        │ │
│ └────────────┘│         │ └──────────────┘ │
│                │         │                  │
│ ┌────────────┐│         │ ┌──────────────┐ │
│ │Auth System ││         │ │Google API    │ │
│ │            ││         │ │              │ │
│ │JWT Tokens  ││         │ │Calendar      │ │
│ └────────────┘│         │ │Events        │ │
│                │         │ └──────────────┘ │
│ ┌────────────┐│         │                  │
│ │Real-time   ││         │ ┌──────────────┐ │
│ │            ││         │ │OpenAI API    │ │
│ │Subscriptns ││         │ │              │ │
│ └────────────┘│         │ │GPT-4 Turbo   │ │
└────────────────┘         │ └──────────────┘ │
                           └──────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User → AuthPage → Supabase Auth → JWT Token
                                    ↓
                          Store in Session State
                                    ↓
                       Include in API Headers
```

### 2. Task Management Flow
```
TaskAssistant → todoistService → API /todoist/* → Todoist API
                                        ↓
                                  Supabase DB
                                        ↓
                              Real-time Update
                                        ↓
                            useTodoistTasks Hook
                                        ↓
                              UI Re-renders
```

### 3. Calendar Flow
```
CalendarAssistant → googleService → API /google/* → Google API
                                         ↓
                                   Supabase DB
                                         ↓
                               Real-time Update
                                         ↓
                             useGoogleEvents Hook
                                         ↓
                               UI Re-renders
```

### 4. AI Assistance Flow
```
User Input → Component → API /openai/proxy → OpenAI API
                              (JWT verified)   (Server-side key)
                                    ↓
                             AI Response
                                    ↓
                          Display to User
```

### 5. OAuth Flow (Secure)
```
1. User clicks "Connect"
         ↓
2. Redirect to OAuth Provider
         ↓
3. User authorizes
         ↓
4. Callback receives code
         ↓
5. Exchange code for tokens (server-side)
         ↓
6. Store in httpOnly cookies (5 min)
         ↓
7. Frontend retrieves via authenticated endpoint
         ↓
8. Save to Supabase
         ↓
9. Clear cookies
```

## Database Schema

```
┌────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                    │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────────┐   │
│  │  integrations    │      │   todoist_projects   │   │
│  ├──────────────────┤      ├──────────────────────┤   │
│  │ • user_id (FK)   │      │ • user_id (FK)       │   │
│  │ • provider       │      │ • todoist_id         │   │
│  │ • access_token   │      │ • name               │   │
│  │ • refresh_token  │      │ • color              │   │
│  │ • token_expiry   │      │ • parent_id          │   │
│  └──────────────────┘      └──────────────────────┘   │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────────┐   │
│  │  todoist_labels  │      │   todoist_tasks      │   │
│  ├──────────────────┤      ├──────────────────────┤   │
│  │ • user_id (FK)   │      │ • user_id (FK)       │   │
│  │ • todoist_id     │      │ • todoist_id         │   │
│  │ • name           │      │ • content            │   │
│  │ • color          │      │ • description        │   │
│  │ • order_index    │      │ • project_id         │   │
│  └──────────────────┘      │ • parent_id          │   │
│                             │ • priority           │   │
│  ┌──────────────────┐      │ • due_date           │   │
│  │ calendar_events  │      │ • labels[]           │   │
│  ├──────────────────┤      │ • is_completed       │   │
│  │ • user_id (FK)   │      └──────────────────────┘   │
│  │ • google_event_id│                                  │
│  │ • summary        │      ┌──────────────────────┐   │
│  │ • description    │      │   user_profile       │   │
│  │ • start_time     │      ├──────────────────────┤   │
│  │ • end_time       │      │ • user_id (FK)       │   │
│  │ • location       │      │ • display_name       │   │
│  └──────────────────┘      │ • timezone           │   │
│                             │ • preferences        │   │
│                             └──────────────────────┘   │
│                                                          │
│  All tables have:                                       │
│  • RLS Policies (user_id = auth.uid())                 │
│  • Auto-updating timestamps                             │
│  • Proper indexes                                       │
└────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
│                                                          │
│  Layer 1: HTTPS/TLS                                     │
│  └─ All communication encrypted                         │
│                                                          │
│  Layer 2: JWT Authentication                            │
│  └─ Every API call verified                             │
│                                                          │
│  Layer 3: Row Level Security (RLS)                      │
│  └─ Database-level access control                       │
│                                                          │
│  Layer 4: Environment Variables                         │
│  └─ All secrets server-side only                        │
│                                                          │
│  Layer 5: Input Validation                              │
│  └─ All inputs sanitized & validated                    │
│                                                          │
│  Layer 6: OAuth Security                                │
│  └─ HttpOnly cookies, CSRF protection                   │
│                                                          │
│  Layer 7: Webhook Verification                          │
│  └─ HMAC-SHA256 signature check                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
                    ┌───────────────┐
                    │   GitHub      │
                    │   Repository  │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │   Vercel      │
                    │   Build       │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │                               │
    ┌───────▼────────┐            ┌────────▼────────┐
    │  Static Assets  │            │  API Functions  │
    │  (Frontend)     │            │  (Backend)      │
    │                 │            │                 │
    │  • index.html   │            │  • /api/*       │
    │  • JavaScript   │            │  • Node.js      │
    │  • CSS          │            │  • Serverless   │
    └────────┬────────┘            └────────┬────────┘
             │                               │
             └───────────────┬───────────────┘
                             │
                    ┌────────▼────────┐
                    │  Vercel CDN     │
                    │  Global Edge    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   End Users     │
                    │   (Browsers)    │
                    └─────────────────┘
```

## Component Hierarchy

```
App.tsx
├── AuthPage.tsx
│   ├── Login Form
│   └── Signup Form
│
└── Dashboard.tsx
    ├── Header
    │   ├── Logo
    │   ├── User Email
    │   └── Sign Out Button
    │
    ├── Navigation Tabs
    │   ├── Tasks Tab
    │   ├── Calendar Tab
    │   └── Integrations Tab
    │
    └── Content Area
        ├── TaskAssistant.tsx
        │   ├── Task Stats Cards
        │   ├── AI Chat Interface
        │   └── Task List
        │
        ├── CalendarAssistant.tsx
        │   ├── Calendar Stats
        │   ├── AI Chat Interface
        │   └── Events List
        │
        └── IntegrationsPanel.tsx
            ├── Todoist Card
            │   ├── Status Badge
            │   ├── Connect Button
            │   └── Features List
            │
            ├── Google Calendar Card
            │   ├── Status Badge
            │   ├── Connect Button
            │   └── Features List
            │
            ├── OpenAI Card
            │   ├── Always Active Badge
            │   └── Features List
            │
            └── Setup Instructions
```

## File Organization

```
Root Directory
│
├── Documentation/
│   ├── README.md (190 lines)
│   ├── API_DOCS.md (340 lines)
│   ├── DEPLOYMENT.md (230 lines)
│   ├── DEVELOPMENT.md (420 lines)
│   ├── SECURITY.md (340 lines)
│   └── SUMMARY.md (360 lines)
│
├── Source Code/
│   ├── Frontend (src/)
│   │   ├── Components (5 files, ~1200 LOC)
│   │   ├── Hooks (4 files, ~300 LOC)
│   │   ├── Services (2 files, ~200 LOC)
│   │   └── Lib (1 file, ~10 LOC)
│   │
│   └── Backend (api/)
│       ├── Todoist (10 files, ~800 LOC)
│       ├── Google (5 files, ~400 LOC)
│       ├── OpenAI (1 file, ~60 LOC)
│       ├── Setup (1 file, ~70 LOC)
│       └── Lib (1 file, ~90 LOC)
│
├── Database/
│   └── migrations/
│       └── init.sql (~300 LOC)
│
└── Configuration/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── vercel.json
    ├── .gitignore
    └── .env.example
```

---

**Total Implementation:**
- 48 Files
- ~2,900 Lines of Code
- 6 Documentation Files (~1,880 lines)
- Production Ready ✅
