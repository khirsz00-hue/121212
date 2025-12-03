# ADHD Buddy - Deployment Guide

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Supabase project created with API credentials
- [ ] Todoist OAuth app created with client ID and secret
- [ ] Google Cloud project with Calendar API enabled
- [ ] OpenAI API key
- [ ] Vercel account
- [ ] Domain configured (if using custom domain)

## Step-by-Step Deployment

### 1. Prepare Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API and note down:
   - Project URL
   - Anon/Public key
   - Service role key (keep this secret!)
3. Go to Database > SQL Editor
4. Copy the contents of `migrations/init.sql`
5. Paste and run the SQL
6. Verify tables were created in Database > Tables

### 2. Configure OAuth Applications

#### Todoist
1. Visit https://developer.todoist.com/appconsole.html
2. Create a new app
3. Set App Name: "ADHD Buddy"
4. Set OAuth redirect URL: `https://your-domain.vercel.app/api/todoist/oauth-callback`
5. Note down Client ID and Client Secret

#### Google Calendar
1. Visit https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google Calendar API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set Application type: Web application
6. Add authorized redirect URI: `https://your-domain.vercel.app/api/google/oauth-callback`
7. Note down Client ID and Client Secret

### 3. Deploy to Vercel

#### Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and select your settings
```

#### Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click "Deploy"

### 4. Configure Environment Variables

In Vercel Dashboard, go to Settings > Environment Variables and add:

```
# Frontend (all environments)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (Production)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BASE_URL=https://your-domain.vercel.app

# Todoist
TODOIST_CLIENT_ID=your-todoist-client-id
TODOIST_CLIENT_SECRET=your-todoist-client-secret
TODOIST_WEBHOOK_SECRET=generate-a-random-string-here

# Google
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Setup (delete after initial setup)
SETUP_SECRET=generate-a-random-string-here
```

To generate random secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Update OAuth Redirect URLs

After deployment, get your actual Vercel URL and update:

1. **Todoist**: Update redirect URL to `https://your-actual-domain.vercel.app/api/todoist/oauth-callback`
2. **Google**: Update authorized redirect URI to `https://your-actual-domain.vercel.app/api/google/oauth-callback`

### 6. Redeploy

After updating environment variables:

```bash
vercel --prod
```

Or trigger a redeploy from Vercel Dashboard.

### 7. Initialize Database

Run the setup endpoint once:

```bash
curl "https://your-domain.vercel.app/api/setup?secret=YOUR_SETUP_SECRET"
```

Copy the returned SQL and run it in Supabase SQL Editor if needed.

**IMPORTANT**: After successful setup, delete or disable the `/api/setup.js` endpoint by:
- Deleting the file and redeploying, OR
- Commenting out the handler function

### 8. Test the Application

1. Visit your deployed URL
2. Sign up for a new account
3. Check email for verification (if required)
4. Sign in
5. Go to Integrations tab
6. Test connecting Todoist
7. Test connecting Google Calendar
8. Try creating a task via AI assistant
9. Try creating a calendar event

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Verify that all VITE_* environment variables are set and redeploy.

### Issue: OAuth redirect URI mismatch

**Solution**: 
1. Check that redirect URIs in Todoist/Google match your actual domain exactly
2. Ensure you're using `https://` (not `http://`)
3. No trailing slashes

### Issue: "Invalid token" errors

**Solution**:
1. Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
2. Check that JWT tokens are being sent in Authorization header
3. Clear browser cache and try logging in again

### Issue: Webhooks not working

**Solution**:
1. Verify TODOIST_WEBHOOK_SECRET is set
2. Check that your domain is publicly accessible
3. Look at Vercel function logs for errors

### Issue: Build fails

**Solution**:
1. Run `npm install` locally to verify dependencies
2. Run `npm run build` locally to check for errors
3. Check Vercel build logs for specific error messages

## Monitoring and Logs

### Vercel Function Logs

View logs in Vercel Dashboard > Deployments > [Your Deployment] > Functions

### Supabase Logs

View logs in Supabase Dashboard > Logs

### Common Log Patterns to Watch

- `Authentication failed`: Check JWT token issues
- `Integration not found`: User needs to connect integration
- `Token refresh failed`: OAuth token expired or invalid
- `Webhook signature invalid`: TODOIST_WEBHOOK_SECRET mismatch

## Security Post-Deployment

1. [ ] Verify all secrets are in environment variables (not code)
2. [ ] Delete or disable `/api/setup.js` endpoint
3. [ ] Test RLS policies by trying to access another user's data
4. [ ] Verify HTTPS is being used everywhere
5. [ ] Check that tokens are not logged anywhere
6. [ ] Enable Vercel deployment protection if needed
7. [ ] Set up monitoring/alerting for errors

## Updating the Application

To deploy updates:

```bash
git pull origin main
npm run build  # Test locally
vercel --prod  # Deploy to production
```

Or push to your Git repository and Vercel will auto-deploy.

## Rollback Procedure

If something goes wrong:

1. In Vercel Dashboard, go to Deployments
2. Find the last working deployment
3. Click "..." menu > "Promote to Production"

## Support

For issues with:
- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Todoist API**: https://developer.todoist.com/
- **Google Calendar API**: https://developers.google.com/calendar/api/guides/support

## Performance Optimization

After deployment, consider:

1. Enable Vercel Edge Functions for better global performance
2. Add caching headers for static assets
3. Optimize images and bundle size
4. Monitor API response times
5. Set up error tracking (e.g., Sentry)

---

**Last Updated**: December 2024
