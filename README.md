# ADHD Buddy - Production-Ready Personal Productivity Assistant

A production-ready, full-stack application designed to help users with ADHD manage tasks, schedule events, and stay productive using AI-powered assistance.

## 🌟 Features

- **Supabase Authentication**: Secure user authentication and session management
- **Todoist Integration**: Full CRUD operations for tasks, projects, labels, comments, and subtasks
- **Google Calendar Integration**: Create events with automatic token refresh
- **OpenAI Assistant**: AI-powered task management and scheduling help
- **Real-time Sync**: Webhook support for Todoist updates
- **ADHD-Friendly UI**: Clean, intuitive interface designed for focus and productivity

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Supabase Client**: Authentication and real-time data
- **Custom Hooks**: `useUser`, `useIntegrations`, `useTodoistTasks`, `useGoogleEvents`
- **Services**: Frontend wrappers for API calls
- **Components**: Modular, reusable UI components

### Backend (Vercel Serverless Functions)
- **API Routes**: RESTful endpoints for all integrations
- **Authentication Middleware**: JWT verification for all protected endpoints
- **Database**: PostgreSQL via Supabase with RLS policies
- **Webhooks**: Secure webhook receivers with signature verification

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Supabase Account**: [Sign up at supabase.com](https://supabase.com)
2. **Todoist Account**: [Get API credentials](https://developer.todoist.com/appconsole.html)
3. **Google Cloud Project**: [Set up OAuth 2.0](https://console.cloud.google.com/)
4. **OpenAI API Key**: [Get from OpenAI](https://platform.openai.com/api-keys)
5. **Vercel Account**: [Sign up at vercel.com](https://vercel.com)

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/khirsz00-hue/121212.git
cd 121212
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Go to Settings > API to get your credentials
3. Copy the SQL from `migrations/init.sql`
4. Run it in the Supabase SQL Editor (Database > SQL Editor)

### 3. Todoist Setup

1. Go to [Todoist App Console](https://developer.todoist.com/appconsole.html)
2. Create a new app
3. Set OAuth redirect URL: `https://your-domain.vercel.app/api/todoist/oauth-callback`
4. Copy Client ID and Client Secret

### 4. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.vercel.app/api/google/oauth-callback`
6. Copy Client ID and Client Secret

### 5. Environment Variables

Create a `.env` file (locally) or set in Vercel:

```bash
# Frontend (prefixed with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (server-side only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BASE_URL=https://your-domain.vercel.app

# Todoist
TODOIST_CLIENT_ID=your-client-id
TODOIST_CLIENT_SECRET=your-client-secret
TODOIST_WEBHOOK_SECRET=generate-random-string

# Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Setup (for database migrations)
SETUP_SECRET=generate-random-string-for-setup
```

### 6. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all other env vars
```

### 7. Initialize Database

After deployment, run the setup endpoint:

```bash
curl "https://your-domain.vercel.app/api/setup?secret=YOUR_SETUP_SECRET"
```

This will return the SQL. Copy it and run in Supabase SQL Editor.

### 8. Connect Integrations

1. Open your deployed app
2. Sign up / Sign in
3. Go to Integrations tab
4. Connect Todoist and Google Calendar

## 🔧 Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

For local API testing, you'll need to set up local environment variables and potentially use Vercel CLI to run serverless functions locally:

```bash
vercel dev
```

## 📁 Project Structure

```
121212/
├── api/                      # Serverless API endpoints
│   ├── lib/
│   │   └── auth.js          # Authentication middleware
│   ├── todoist/
│   │   ├── oauth-start.js
│   │   ├── oauth-callback.js
│   │   ├── create-task.js
│   │   ├── update-task.js
│   │   ├── delete-task.js
│   │   ├── add-comment.js
│   │   ├── register-webhook.js
│   │   └── webhook.js
│   ├── google/
│   │   ├── oauth-start.js
│   │   ├── oauth-callback.js
│   │   └── create-event.js
│   ├── openai/
│   │   └── proxy.js
│   └── setup.js
├── migrations/
│   └── init.sql             # Database schema
├── src/
│   ├── components/          # React components
│   │   ├── AuthPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── TaskAssistant.tsx
│   │   ├── CalendarAssistant.tsx
│   │   └── IntegrationsPanel.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useUser.ts
│   │   ├── useIntegrations.ts
│   │   ├── useTodoistTasks.ts
│   │   └── useGoogleEvents.ts
│   ├── services/           # API service wrappers
│   │   ├── todoistService.ts
│   │   └── googleService.ts
│   ├── lib/
│   │   └── supabaseClient.ts
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── vercel.json
├── vite.config.ts
└── tsconfig.json
```

## 🔒 Security Features

- **JWT Authentication**: All API endpoints verify Supabase JWT tokens
- **RLS Policies**: Row-level security in Supabase ensures data isolation
- **Webhook Verification**: HMAC signature verification for Todoist webhooks
- **Token Refresh**: Automatic refresh token handling for Google Calendar
- **Server-side API Keys**: OpenAI and service role keys never exposed to client
- **Environment Variables**: All secrets stored securely in Vercel

## 🎯 API Endpoints

### Setup
- `GET /api/setup?secret=SETUP_SECRET` - Get migration SQL

### Todoist
- `GET /api/todoist/oauth-start` - Start OAuth flow
- `GET /api/todoist/oauth-callback` - OAuth callback
- `POST /api/todoist/create-task` - Create task
- `POST /api/todoist/update-task` - Update task
- `POST /api/todoist/delete-task` - Delete task
- `POST /api/todoist/add-comment` - Add comment to task
- `POST /api/todoist/register-webhook` - Register webhook
- `POST /api/todoist/webhook` - Webhook receiver

### Google Calendar
- `GET /api/google/oauth-start` - Start OAuth flow
- `GET /api/google/oauth-callback` - OAuth callback
- `POST /api/google/create-event` - Create calendar event

### OpenAI
- `POST /api/openai/proxy` - Proxy for OpenAI API calls

## 📊 Database Schema

See `migrations/init.sql` for complete schema. Key tables:

- **integrations**: OAuth tokens and settings
- **todoist_projects**: Cached Todoist projects
- **todoist_labels**: Cached Todoist labels
- **todoist_tasks**: Cached Todoist tasks with full details
- **calendar_events**: Google Calendar events
- **user_profile**: Extended user information

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check that RLS policies are enabled
- Ensure migrations were run successfully

### OAuth Not Working
- Verify redirect URIs match exactly (including https://)
- Check client IDs and secrets
- Ensure BASE_URL is set correctly

### API Errors
- Check Vercel logs for detailed error messages
- Verify all environment variables are set
- Ensure JWT token is being sent in Authorization header

### Webhook Not Receiving Events
- Verify TODOIST_WEBHOOK_SECRET is set
- Check that webhook was registered successfully
- Ensure your domain is publicly accessible

## 🔄 Data Flow

1. **User Authentication**: 
   - Frontend → Supabase Auth → JWT Token
   
2. **Task Creation**:
   - Frontend → API Endpoint (with JWT) → Todoist API → Supabase Cache
   
3. **Webhook Updates**:
   - Todoist → Webhook Endpoint (verified) → Supabase Cache → Real-time to Frontend

4. **Calendar Events**:
   - Frontend → API Endpoint (with JWT) → Google Calendar API (with refresh) → Supabase Cache

5. **AI Assistance**:
   - Frontend → OpenAI Proxy (with JWT) → OpenAI API (server-side key) → Response

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues, questions, or contributions, please contact the repository owner.

## 🎉 Acknowledgments

- Built with React, TypeScript, and Vite
- Powered by Supabase for backend services
- Integrated with Todoist, Google Calendar, and OpenAI
- Deployed on Vercel

---

**Note**: This is a production-ready application. Ensure all security best practices are followed before deploying to production.
