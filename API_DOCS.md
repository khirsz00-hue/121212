# API Documentation

## Overview

All API endpoints are serverless functions deployed on Vercel. They require authentication via JWT tokens except for OAuth start endpoints.

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

Get the token from Supabase session:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

## Endpoints

### Setup

#### GET /api/setup

Initialize database with required schema.

**Headers:**
- `X-Setup-Secret: <SETUP_SECRET>` or query param `?secret=<SETUP_SECRET>`

**Response:**
```json
{
  "message": "Migration SQL retrieved successfully",
  "sql": "CREATE TABLE...",
  "instructions": "Execute this SQL in your Supabase SQL editor"
}
```

**Security Note:** Disable this endpoint after initial setup.

---

### Todoist API

#### GET /api/todoist/oauth-start

Start Todoist OAuth flow. Redirects to Todoist authorization page.

**No authentication required**

**Response:** 302 Redirect to Todoist

---

#### GET /api/todoist/oauth-callback

OAuth callback endpoint. Handles code exchange and token storage.

**Query Parameters:**
- `code` - Authorization code from Todoist
- `state` - CSRF protection state

**Response:** 302 Redirect to app with success flag

---

#### GET /api/todoist/get-temp-token

Retrieve temporary OAuth token from secure cookie.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "token": "todoist-access-token"
}
```

---

#### POST /api/todoist/save-integration

Save Todoist integration and sync initial data.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "access_token": "todoist-access-token"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### POST /api/todoist/create-task

Create a new task in Todoist.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "content": "Task title",
  "description": "Optional description",
  "project_id": "optional-project-id",
  "parent_id": "optional-parent-task-id",
  "priority": 1,
  "due_date": "2024-12-31",
  "due_string": "tomorrow",
  "labels": ["label1", "label2"]
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "task-id",
    "content": "Task title",
    ...
  }
}
```

---

#### POST /api/todoist/update-task

Update an existing task.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "taskId": "task-id",
  "content": "Updated title",
  "priority": 2,
  "is_completed": false
}
```

**Response:**
```json
{
  "success": true,
  "task": { ... }
}
```

---

#### POST /api/todoist/delete-task

Delete a task.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "taskId": "task-id"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### POST /api/todoist/add-comment

Add a comment to a task.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "taskId": "task-id",
  "content": "Comment text"
}
```

**Response:**
```json
{
  "success": true,
  "comment": { ... }
}
```

---

#### POST /api/todoist/register-webhook

Register webhook for real-time task updates.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "webhook_id": "webhook-id"
}
```

---

#### POST /api/todoist/webhook

Webhook receiver for Todoist events.

**Headers:**
- `X-Todoist-HMAC-SHA256: <signature>` (required)

**Body:**
```json
{
  "event_name": "item:added",
  "event_data": { ... },
  "user_id": "todoist-user-id"
}
```

**Response:**
```json
{
  "received": true
}
```

---

### Google Calendar API

#### GET /api/google/oauth-start

Start Google OAuth flow. Redirects to Google authorization page.

**No authentication required**

**Response:** 302 Redirect to Google

---

#### GET /api/google/oauth-callback

OAuth callback endpoint. Handles code exchange and token storage.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - CSRF protection state

**Response:** 302 Redirect to app with success flag

---

#### GET /api/google/get-temp-tokens

Retrieve temporary OAuth tokens from secure cookies.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "token": "google-access-token",
  "refresh_token": "google-refresh-token",
  "token_expiry": "2024-12-31T23:59:59Z"
}
```

---

#### POST /api/google/save-integration

Save Google Calendar integration.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "access_token": "google-access-token",
  "refresh_token": "google-refresh-token",
  "token_expiry": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### POST /api/google/create-event

Create a calendar event.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "summary": "Event title",
  "description": "Optional description",
  "location": "Optional location",
  "start": {
    "dateTime": "2024-12-31T10:00:00Z",
    "timeZone": "America/New_York"
  },
  "end": {
    "dateTime": "2024-12-31T11:00:00Z",
    "timeZone": "America/New_York"
  },
  "attendees": [
    { "email": "person@example.com" }
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 30 }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "event-id",
    ...
  }
}
```

---

### OpenAI API

#### POST /api/openai/proxy

Server-side proxy for OpenAI API calls.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant"
    },
    {
      "role": "user",
      "content": "Help me organize my tasks"
    }
  ],
  "model": "gpt-4-turbo-preview",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4-turbo-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's how I can help you organize..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  }
}
```

---

## Error Responses

All endpoints may return error responses:

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "details": "Invalid or expired token"
}
```

**400 Bad Request**
```json
{
  "error": "Bad Request",
  "details": "Missing required field: content"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "details": "Failed to connect to external API"
}
```

## Rate Limiting

- Vercel serverless functions have a 10-second timeout
- OpenAI API has rate limits based on your plan
- Todoist API has rate limits of 450 requests per 15 minutes
- Google Calendar API has quota limits per project

## Best Practices

1. **Always check response status** before parsing JSON
2. **Handle errors gracefully** in the UI
3. **Use exponential backoff** for retries
4. **Cache responses** where appropriate
5. **Validate input** before sending requests
6. **Never expose tokens** in client-side code

## Testing

Use curl or Postman to test endpoints:

```bash
# Test with curl
curl -X POST https://your-domain.vercel.app/api/todoist/create-task \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test task"}'
```

---

**Last Updated**: December 2024
