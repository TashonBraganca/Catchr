# API Reference

Complete API documentation for Cathcr's REST API. Build powerful integrations and extend Cathcr's functionality with our comprehensive API.

## Base URL

```
Production: https://api.cathcr.com/v1
Staging: https://staging-api.cathcr.com/v1
```

## Authentication

### API Key Authentication

Include your API key in the Authorization header:

```bash
curl -H "Authorization: Bearer your_api_key" \
     https://api.cathcr.com/v1/thoughts
```

### OAuth 2.0

For applications accessing user data on their behalf:

```javascript
// Authorization URL
https://auth.cathcr.com/oauth/authorize?
  response_type=code&
  client_id=your_client_id&
  redirect_uri=your_redirect_uri&
  scope=thoughts.read thoughts.write

// Token exchange
POST /oauth/token
{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "redirect_uri": "your_redirect_uri"
}
```

### Scopes

| Scope | Description |
|-------|-------------|
| `thoughts.read` | Read access to thoughts |
| `thoughts.write` | Create and modify thoughts |
| `categories.read` | Read access to categories |
| `categories.write` | Create and modify categories |
| `reminders.read` | Read access to reminders |
| `reminders.write` | Create and modify reminders |
| `search` | Search thoughts and content |
| `analytics.read` | Read access to analytics data |
| `admin` | Full administrative access |

## Rate Limiting

API requests are rate limited per API key:

- **Free Plan**: 1,000 requests/hour
- **Pro Plan**: 10,000 requests/hour
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "content",
        "message": "Content is required"
      }
    ],
    "request_id": "req_1234567890"
  }
}
```

## Thoughts API

### Create Thought

```http
POST /thoughts
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "content": "This is a new thought",
  "category_id": "cat_123",
  "tags": ["important", "work"],
  "metadata": {
    "source": "api",
    "location": "office"
  }
}
```

**Response:**
```json
{
  "id": "thought_456",
  "content": "This is a new thought",
  "category_id": "cat_123",
  "category": {
    "id": "cat_123",
    "name": "Work",
    "color": "#3B82F6"
  },
  "tags": ["important", "work"],
  "metadata": {
    "source": "api",
    "location": "office"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "processing_status": "pending",
  "ai_confidence": null,
  "reminders": []
}
```

### List Thoughts

```http
GET /thoughts?limit=20&offset=0&category_id=cat_123&tags=work,important
Authorization: Bearer your_api_key
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of thoughts to return (max 100) |
| `offset` | integer | Number of thoughts to skip |
| `category_id` | string | Filter by category ID |
| `tags` | string | Comma-separated list of tags |
| `search` | string | Search query |
| `created_after` | string | ISO 8601 date |
| `created_before` | string | ISO 8601 date |
| `processing_status` | string | `pending`, `processing`, `completed`, `failed` |

**Response:**
```json
{
  "thoughts": [
    {
      "id": "thought_456",
      "content": "This is a thought",
      "category": { ... },
      "tags": ["work"],
      "created_at": "2024-01-15T10:30:00Z",
      "processing_status": "completed"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Get Thought

```http
GET /thoughts/{thought_id}
Authorization: Bearer your_api_key
```

### Update Thought

```http
PATCH /thoughts/{thought_id}
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "content": "Updated thought content",
  "category_id": "cat_456",
  "tags": ["updated", "work"]
}
```

### Delete Thought

```http
DELETE /thoughts/{thought_id}
Authorization: Bearer your_api_key
```

## Categories API

### List Categories

```http
GET /categories
Authorization: Bearer your_api_key
```

**Response:**
```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "Work",
      "description": "Work-related thoughts",
      "color": "#3B82F6",
      "parent_id": null,
      "children": [
        {
          "id": "cat_124",
          "name": "Projects",
          "parent_id": "cat_123"
        }
      ],
      "thought_count": 42,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Category

```http
POST /categories
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "name": "New Category",
  "description": "Category description",
  "color": "#10B981",
  "parent_id": "cat_123"
}
```

### Update Category

```http
PATCH /categories/{category_id}
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "name": "Updated Category Name",
  "color": "#EF4444"
}
```

## Search API

### Search Thoughts

```http
POST /search
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "query": "meeting notes",
  "filters": {
    "categories": ["cat_123"],
    "tags": ["important"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  },
  "sort": {
    "field": "relevance",
    "order": "desc"
  },
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "results": [
    {
      "thought": { ... },
      "score": 0.95,
      "highlights": [
        "Found <mark>meeting</mark> <mark>notes</mark> in content"
      ]
    }
  ],
  "total": 15,
  "took": 45
}
```

### Advanced Search

```http
POST /search/advanced
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "content": "project alpha"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "category_id": "cat_123"
          }
        },
        {
          "range": {
            "created_at": {
              "gte": "2024-01-01"
            }
          }
        }
      ]
    }
  }
}
```

## Reminders API

### List Reminders

```http
GET /reminders?status=pending&due_before=2024-01-31T23:59:59Z
Authorization: Bearer your_api_key
```

**Response:**
```json
{
  "reminders": [
    {
      "id": "rem_789",
      "thought_id": "thought_456",
      "content": "Follow up on project alpha",
      "due_date": "2024-01-20T14:00:00Z",
      "status": "pending",
      "notification_sent": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Reminder

```http
POST /reminders
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "thought_id": "thought_456",
  "content": "Call client about project update",
  "due_date": "2024-01-25T09:00:00Z",
  "notification_preferences": {
    "email": true,
    "push": true,
    "advance_notice": 15
  }
}
```

### Update Reminder Status

```http
PATCH /reminders/{reminder_id}
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "status": "completed",
  "completed_at": "2024-01-20T14:30:00Z",
  "notes": "Task completed successfully"
}
```

## AI Processing API

### Trigger AI Analysis

```http
POST /thoughts/{thought_id}/analyze
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "services": ["categorization", "reminder_extraction", "sentiment_analysis"],
  "force_reprocess": false
}
```

**Response:**
```json
{
  "job_id": "job_abc123",
  "status": "queued",
  "estimated_completion": "2024-01-15T10:35:00Z",
  "services_requested": ["categorization", "reminder_extraction"]
}
```

### Get Processing Status

```http
GET /processing/jobs/{job_id}
Authorization: Bearer your_api_key
```

**Response:**
```json
{
  "job_id": "job_abc123",
  "status": "completed",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:32:00Z",
  "results": {
    "categorization": {
      "suggested_category": "cat_123",
      "confidence": 0.92,
      "alternatives": [
        {
          "category_id": "cat_124",
          "confidence": 0.76
        }
      ]
    },
    "reminder_extraction": {
      "reminders_found": [
        {
          "content": "Follow up next week",
          "due_date": "2024-01-22T09:00:00Z",
          "confidence": 0.88
        }
      ]
    }
  }
}
```

## Analytics API

### Get Thought Statistics

```http
GET /analytics/thoughts?period=month&start_date=2024-01-01
Authorization: Bearer your_api_key
```

**Response:**
```json
{
  "period": "month",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "metrics": {
    "total_thoughts": 156,
    "thoughts_per_day": 5.03,
    "categories_used": 8,
    "most_active_day": "monday",
    "peak_hour": 14
  },
  "category_breakdown": [
    {
      "category_id": "cat_123",
      "category_name": "Work",
      "count": 89,
      "percentage": 57.1
    }
  ],
  "daily_counts": [
    {
      "date": "2024-01-01",
      "count": 3
    }
  ]
}
```

### Get Category Analytics

```http
GET /analytics/categories/{category_id}?period=quarter
Authorization: Bearer your_api_key
```

## Webhooks API

### List Webhooks

```http
GET /webhooks
Authorization: Bearer your_api_key
```

### Create Webhook

```http
POST /webhooks
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "url": "https://your-app.com/webhooks/cathcr",
  "events": ["thought.created", "thought.updated", "reminder.due"],
  "secret": "your_webhook_secret",
  "active": true
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `thought.created` | New thought created |
| `thought.updated` | Thought modified |
| `thought.deleted` | Thought deleted |
| `category.created` | New category created |
| `reminder.created` | New reminder created |
| `reminder.due` | Reminder is due |
| `processing.completed` | AI processing finished |

**Webhook Payload Example:**
```json
{
  "event": "thought.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "thought": { ... },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_456"
}
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @cathcr/sdk
```

```javascript
import { CathcrSDK } from '@cathcr/sdk';

const cathcr = new CathcrSDK({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.cathcr.com/v1'
});

// Create a thought
const thought = await cathcr.thoughts.create({
  content: 'This is a new thought',
  category_id: 'cat_123'
});

// Search thoughts
const results = await cathcr.search.query('meeting notes', {
  filters: { categories: ['cat_123'] }
});
```

### Python

```bash
pip install cathcr-python
```

```python
from cathcr import CathcrClient

client = CathcrClient(api_key='your_api_key')

# Create a thought
thought = client.thoughts.create(
    content='This is a new thought',
    category_id='cat_123'
)

# List thoughts
thoughts = client.thoughts.list(
    limit=20,
    category_id='cat_123'
)
```

### Go

```bash
go get github.com/cathcr/cathcr-go
```

```go
package main

import (
    "github.com/cathcr/cathcr-go"
)

func main() {
    client := cathcr.NewClient("your_api_key")

    thought, err := client.Thoughts.Create(&cathcr.ThoughtCreateRequest{
        Content:    "This is a new thought",
        CategoryID: "cat_123",
    })
}
```

## Testing

### Sandbox Environment

Use the sandbox environment for testing:
```
Base URL: https://sandbox-api.cathcr.com/v1
```

### Test Data

The sandbox includes sample data:
- 50 pre-created thoughts
- 10 categories
- 5 active reminders

### Webhook Testing

Use webhook.site or ngrok for local webhook testing:

```bash
# Using ngrok
ngrok http 3000

# Then use the ngrok URL in your webhook configuration
```

## Best Practices

### Pagination

Always handle pagination for list endpoints:

```javascript
async function getAllThoughts() {
  let allThoughts = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await cathcr.thoughts.list({ limit, offset });
    allThoughts.push(...response.thoughts);

    if (!response.pagination.has_more) break;
    offset += limit;
  }

  return allThoughts;
}
```

### Error Handling

Implement proper error handling:

```javascript
try {
  const thought = await cathcr.thoughts.create({ content: 'Test' });
} catch (error) {
  if (error.status === 429) {
    // Handle rate limiting
    await delay(error.retryAfter * 1000);
    // Retry request
  } else if (error.status === 400) {
    // Handle validation errors
    console.log('Validation errors:', error.details);
  }
}
```

### Caching

Cache frequently accessed data:

```javascript
const categoryCache = new Map();

async function getCategory(id) {
  if (categoryCache.has(id)) {
    return categoryCache.get(id);
  }

  const category = await cathcr.categories.get(id);
  categoryCache.set(id, category);
  return category;
}
```

Need help? Contact our API support team at api-support@cathcr.com 🚀