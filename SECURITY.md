# Security Guidelines

## Overview

This document outlines the security measures implemented in ADHD Buddy and best practices for maintaining security in production.

## Security Features

### 1. Authentication & Authorization

#### Supabase JWT Authentication
- All protected endpoints verify JWT tokens via Supabase Auth
- Tokens include user identity and are cryptographically signed
- Token expiration is validated on each request
- Failed authentication returns 401 Unauthorized

#### Row Level Security (RLS)
- Database tables have RLS policies enabled
- Users can only access their own data
- Policies enforce `auth.uid() = user_id` checks
- Prevents data leakage between users

### 2. OAuth Security

#### Secure Token Exchange
- OAuth tokens stored in httpOnly cookies during exchange
- Cookies are Secure (HTTPS only) and SameSite=Strict
- Tokens expire after 5 minutes
- No tokens in URL parameters (prevents logging/leaking)

#### CSRF Protection
- State parameter validation in OAuth flows
- Redirect URI validation
- Client secret never exposed to frontend

### 3. API Security

#### Server-Side API Keys
- OpenAI API key only used in server-side functions
- Supabase service role key only in backend
- No API keys in frontend code or environment variables prefixed with VITE_

#### Request Validation
- Input validation on all endpoints
- Type checking and sanitization
- SQL injection prevention via parameterized queries
- XSS prevention via proper encoding

#### Webhook Verification
- HMAC-SHA256 signature verification for Todoist webhooks
- Secret key stored securely in environment variables
- Invalid signatures rejected immediately

### 4. Environment Variables

All secrets stored as environment variables:
- `SUPABASE_SERVICE_ROLE_KEY` - Never exposed to client
- `TODOIST_CLIENT_SECRET` - Server-side only
- `GOOGLE_CLIENT_SECRET` - Server-side only
- `OPENAI_API_KEY` - Server-side only
- `SETUP_SECRET` - For initial setup only
- `TODOIST_WEBHOOK_SECRET` - For webhook verification

Frontend-safe variables (prefixed with VITE_):
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key with RLS protection

### 5. Data Security

#### In Transit
- All communications use HTTPS/TLS
- Vercel provides free SSL certificates
- No mixed content (HTTP/HTTPS)

#### At Rest
- Supabase encrypts data at rest
- Passwords hashed with bcrypt
- OAuth tokens encrypted in database

#### In Memory
- Tokens cleared after use
- Sensitive data not logged
- Error messages sanitized (no secrets)

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env` files locally (gitignored)
   - Store secrets in Vercel environment variables
   - Use different secrets for dev/staging/production

2. **Validate all inputs**
   - Check required fields exist
   - Validate types and formats
   - Sanitize user-provided content
   - Limit string lengths

3. **Use parameterized queries**
   - Never concatenate user input into SQL
   - Use Supabase query builders
   - Leverage RLS policies

4. **Handle errors securely**
   - Don't expose stack traces to users
   - Log errors server-side only
   - Return generic error messages

5. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages with security fixes
   - Monitor security advisories

### For Deployment

1. **Secure environment variables**
   - Use Vercel's encrypted storage
   - Rotate secrets periodically
   - Use different secrets per environment

2. **Enable HTTPS only**
   - Vercel enforces HTTPS by default
   - Don't downgrade to HTTP

3. **Monitor access logs**
   - Review Vercel function logs
   - Check for unusual patterns
   - Set up alerts for errors

4. **Disable setup endpoint**
   - Delete `/api/setup.js` after initial setup
   - Or add time-based expiration
   - Or use one-time tokens

5. **Implement rate limiting**
   - Use Vercel rate limiting if needed
   - Monitor for abuse
   - Block suspicious IPs

### For Users

1. **Use strong passwords**
   - Minimum 8 characters
   - Mix of letters, numbers, symbols
   - Don't reuse passwords

2. **Enable 2FA when available**
   - Supabase supports 2FA
   - Configure in user settings

3. **Review connected apps**
   - Check OAuth permissions
   - Revoke unused integrations
   - Monitor for suspicious activity

4. **Keep browsers updated**
   - Latest security patches
   - No outdated plugins

## Security Checklist

Before going to production:

- [ ] All secrets in environment variables
- [ ] RLS policies tested and working
- [ ] HTTPS enforced on all endpoints
- [ ] OAuth redirect URIs validated
- [ ] Webhook signatures verified
- [ ] Setup endpoint disabled
- [ ] Dependencies updated (`npm audit`)
- [ ] Error logging configured
- [ ] Monitoring/alerting set up
- [ ] Backup strategy in place
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Penetration testing completed (if required)

## Common Vulnerabilities and Mitigations

### SQL Injection
**Mitigation**: Use Supabase query builders and RLS policies. Never concatenate user input into SQL.

### XSS (Cross-Site Scripting)
**Mitigation**: React escapes output by default. Sanitize user-provided HTML if needed.

### CSRF (Cross-Site Request Forgery)
**Mitigation**: 
- SameSite cookies
- State parameter in OAuth
- Origin header validation

### Token Theft
**Mitigation**:
- HttpOnly cookies for sensitive tokens
- Short token lifetimes
- Refresh token rotation
- Secure storage

### API Key Exposure
**Mitigation**:
- Server-side proxy for OpenAI
- No keys in frontend code
- Environment variables only

### Unauthorized Access
**Mitigation**:
- JWT verification on all endpoints
- RLS policies in database
- Proper error handling

### Brute Force Attacks
**Mitigation**:
- Supabase handles auth rate limiting
- Monitor for repeated failures
- Consider additional rate limiting

## Incident Response

If a security incident occurs:

1. **Immediate Actions**
   - Disable affected endpoints if needed
   - Rotate compromised secrets
   - Review access logs
   - Document the incident

2. **Investigation**
   - Determine scope of breach
   - Identify affected users
   - Collect evidence
   - Find root cause

3. **Remediation**
   - Patch vulnerabilities
   - Update secrets
   - Deploy fixes
   - Test thoroughly

4. **Communication**
   - Notify affected users if required
   - Document lessons learned
   - Update security procedures
   - Review with team

5. **Prevention**
   - Implement additional safeguards
   - Update documentation
   - Schedule security review
   - Train team members

## Security Contacts

- **Vercel Security**: security@vercel.com
- **Supabase Security**: security@supabase.io
- **Report Issues**: Create issue in repository (for non-sensitive bugs)
- **Sensitive Reports**: Contact repository owner directly

## Security Tools

### Recommended Tools

1. **npm audit** - Check for vulnerable dependencies
2. **CodeQL** - Static code analysis (used in this project)
3. **OWASP ZAP** - Web application security scanner
4. **Burp Suite** - API security testing
5. **Snyk** - Continuous security monitoring

### Regular Reviews

Schedule regular security reviews:
- Weekly: Check dependency updates
- Monthly: Review access logs
- Quarterly: Full security audit
- Annually: Penetration testing

## Compliance

Depending on your requirements, consider:

- **GDPR**: If handling EU user data
- **CCPA**: If handling California user data
- **HIPAA**: If handling health data (requires additional measures)
- **SOC 2**: For enterprise customers

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Vercel Security](https://vercel.com/security)
- [OpenAI Security](https://platform.openai.com/docs/guides/safety-best-practices)

---

**Last Updated**: December 2024
**Next Review**: March 2025
