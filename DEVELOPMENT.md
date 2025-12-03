# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Vercel CLI (optional, for local API testing)

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/khirsz00-hue/121212.git
cd 121212
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your local values
```

4. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Local API Testing

To test API endpoints locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run in dev mode (starts both frontend and API)
vercel dev
```

This will start the app at http://localhost:3000 with working API routes.

## Project Structure

```
121212/
├── api/                          # Serverless API functions
│   ├── lib/
│   │   └── auth.js              # Authentication middleware
│   ├── todoist/                 # Todoist integration endpoints
│   ├── google/                  # Google Calendar endpoints
│   ├── openai/                  # OpenAI proxy
│   └── setup.js                 # Database setup
│
├── migrations/
│   └── init.sql                 # Database schema
│
├── src/
│   ├── components/              # React components
│   │   ├── AuthPage.tsx         # Login/signup
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── TaskAssistant.tsx    # Task management UI
│   │   ├── CalendarAssistant.tsx # Calendar UI
│   │   └── IntegrationsPanel.tsx # Settings
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useUser.ts           # Auth hook
│   │   ├── useIntegrations.ts   # Integrations hook
│   │   ├── useTodoistTasks.ts   # Todoist data hook
│   │   └── useGoogleEvents.ts   # Calendar hook
│   │
│   ├── services/                # API service wrappers
│   │   ├── todoistService.ts
│   │   └── googleService.ts
│   │
│   ├── lib/
│   │   └── supabaseClient.ts    # Supabase client config
│   │
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
│
├── .env.example                 # Environment variables template
├── package.json
├── vite.config.ts              # Vite configuration
├── vercel.json                 # Vercel deployment config
└── README.md
```

## Architecture Overview

### Frontend Architecture

**Stack**: React 18 + TypeScript + Vite

**Data Flow**:
1. User interacts with UI components
2. Components use custom hooks to fetch/update data
3. Hooks call service functions
4. Services make authenticated API calls
5. API returns data or errors
6. Hooks update React state
7. Components re-render

**State Management**:
- Local state with React hooks
- No global state library (keeps it simple)
- Real-time updates via Supabase subscriptions

### Backend Architecture

**Stack**: Node.js serverless functions on Vercel

**Request Flow**:
1. Client makes request with JWT token
2. API middleware verifies JWT
3. Endpoint handler processes request
4. External API calls (Todoist, Google, OpenAI)
5. Database updates via Supabase
6. Response returned to client

**Authentication**:
- JWT tokens from Supabase Auth
- Verified on every request
- User ID extracted from token

### Database Architecture

**Stack**: PostgreSQL via Supabase

**Key Features**:
- Row Level Security (RLS) policies
- Real-time subscriptions
- Automatic timestamps
- Foreign key constraints

**Tables**:
- `integrations` - OAuth tokens
- `todoist_projects` - Cached projects
- `todoist_labels` - Cached labels
- `todoist_tasks` - Cached tasks
- `calendar_events` - Google Calendar events
- `user_profile` - Extended user data

## Development Workflow

### 1. Pick an Issue or Feature

Check the issues list or create a new feature branch:

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

Follow these guidelines:
- Keep changes focused and small
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation if needed

### 3. Test Locally

```bash
# Run dev server
npm run dev

# In another terminal, test API
vercel dev

# Test the feature thoroughly
```

### 4. Build and Verify

```bash
npm run build
```

Check for TypeScript errors and build issues.

### 5. Commit and Push

```bash
git add .
git commit -m "Add: description of changes"
git push origin feature/my-feature
```

### 6. Create Pull Request

Open a PR on GitHub with:
- Clear description of changes
- Screenshots if UI changes
- Testing notes

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` type (use `unknown` if needed)
- Use proper type guards

Example:
```typescript
interface Task {
  id: string;
  content: string;
  priority: number;
}

const tasks: Task[] = [];
```

### React Components

- Use functional components with hooks
- One component per file
- Use meaningful prop names
- Add PropTypes or TypeScript interfaces

Example:
```typescript
interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onComplete }) => {
  // Component logic
};
```

### API Endpoints

- Use `withAuth` middleware for protected routes
- Validate inputs
- Handle errors gracefully
- Return consistent response format

Example:
```javascript
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({ error: 'Task ID required' });
  }

  try {
    // Logic here
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### CSS Styling

- Use CSS modules or separate CSS files per component
- Follow BEM naming convention
- Use CSS variables for colors and spacing
- Make responsive (mobile-first)

Example:
```css
.task-item {
  padding: 16px;
  border-radius: 8px;
}

.task-item__title {
  font-size: 16px;
  font-weight: 600;
}

.task-item--completed {
  opacity: 0.6;
}
```

## Testing

### Manual Testing Checklist

Before submitting a PR:

- [ ] All features work as expected
- [ ] No console errors or warnings
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] Loading states show properly
- [ ] Error messages are clear
- [ ] Authentication works correctly
- [ ] API calls succeed/fail gracefully

### Testing OAuth Flows

1. Clear cookies and local storage
2. Sign in to app
3. Go to Integrations tab
4. Click "Connect Todoist" or "Connect Google Calendar"
5. Complete OAuth flow
6. Verify integration shows as connected
7. Test creating tasks/events

### Testing Real-time Updates

1. Open app in two browser windows
2. Sign in with same account
3. Make change in one window (create task)
4. Verify change appears in other window
5. Check that updates are immediate

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Import and use in parent component
3. Add CSS file if needed
4. Export from component

### Adding a New API Endpoint

1. Create file in `api/[service]/endpoint.js`
2. Import `withAuth` if authentication needed
3. Implement handler function
4. Test with curl or Postman
5. Update API_DOCS.md

### Adding a New Hook

1. Create file in `src/hooks/useFeature.ts`
2. Implement hook logic
3. Export hook function
4. Use in component
5. Test thoroughly

### Updating Database Schema

1. Modify `migrations/init.sql`
2. Test SQL locally in Supabase
3. Document changes
4. Run migration in production
5. Update types if needed

## Debugging

### Frontend Debugging

**React DevTools**:
- Install React DevTools browser extension
- Inspect component state and props
- Profile component performance

**Console Debugging**:
```typescript
console.log('Debug:', variable);
console.table(arrayOfObjects);
```

**Network Tab**:
- Check API calls in browser Network tab
- Verify request/response data
- Check for errors

### Backend Debugging

**Vercel Logs**:
- View logs in Vercel Dashboard
- Check function logs for errors
- Look for stack traces

**Local Debugging**:
```javascript
console.log('Debug:', data);
console.error('Error:', error);
```

**Testing API Endpoints**:
```bash
# Use curl for testing
curl -X POST https://localhost:3000/api/todoist/create-task \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test"}'
```

## Performance Optimization

### Frontend

1. **Code Splitting**: Vite handles this automatically
2. **Lazy Loading**: Use `React.lazy()` for routes
3. **Memoization**: Use `useMemo` and `useCallback` for expensive operations
4. **Debouncing**: Debounce search/filter inputs

### Backend

1. **Caching**: Cache frequently accessed data
2. **Database Queries**: Use indexes and efficient queries
3. **Batch Operations**: Combine multiple operations when possible
4. **Connection Pooling**: Supabase handles this

## Troubleshooting

### Build Fails

1. Check for TypeScript errors: `npm run build`
2. Verify all imports are correct
3. Check for missing dependencies
4. Clear node_modules and reinstall

### API Not Working Locally

1. Make sure you're using `vercel dev` not just `npm run dev`
2. Check environment variables are set
3. Verify API endpoint paths
4. Check Vercel CLI version

### Real-time Updates Not Working

1. Verify Supabase connection
2. Check subscription setup in hooks
3. Look for console errors
4. Verify RLS policies allow reads

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Getting Help

- Check existing documentation
- Search issues on GitHub
- Ask in team chat
- Create new issue with details

---

**Last Updated**: December 2024
