# Webhooks

Receive real-time notifications when events occur in Cathcr. Webhooks allow your applications to stay synchronized with user activity and respond immediately to important events.

## Overview

Webhooks are HTTP callbacks that Cathcr sends to your application when specific events occur. Instead of polling our API for changes, webhooks provide instant notifications, making your integrations more efficient and responsive.

### Key Benefits

- **Real-time Updates**: Get notified instantly when events occur
- **Reduced API Calls**: No need to poll for changes
- **Better User Experience**: React immediately to user actions
- **Reliable Delivery**: Built-in retry mechanisms ensure delivery
- **Secure**: HMAC signature verification for authenticity

## Webhook Events

### Thought Events

#### `thought.created`
Triggered when a new thought is created.

```json
{
  "event": "thought.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "thought": {
      "id": "thought_456",
      "content": "This is a new thought",
      "category_id": "cat_123",
      "category": {
        "id": "cat_123",
        "name": "Work",
        "color": "#3B82F6"
      },
      "tags": ["important"],
      "created_at": "2024-01-15T10:30:00Z",
      "processing_status": "pending"
    },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `thought.updated`
Triggered when a thought is modified.

```json
{
  "event": "thought.updated",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "thought": {
      "id": "thought_456",
      "content": "Updated thought content",
      "category_id": "cat_124"
    },
    "previous_values": {
      "content": "Original thought content",
      "category_id": "cat_123"
    },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `thought.deleted`
Triggered when a thought is deleted.

```json
{
  "event": "thought.deleted",
  "timestamp": "2024-01-15T10:40:00Z",
  "data": {
    "thought_id": "thought_456",
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

### Category Events

#### `category.created`
Triggered when a new category is created.

```json
{
  "event": "category.created",
  "timestamp": "2024-01-15T11:00:00Z",
  "data": {
    "category": {
      "id": "cat_456",
      "name": "New Project",
      "description": "Project-specific thoughts",
      "color": "#10B981",
      "parent_id": "cat_123"
    },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `category.updated`
Triggered when a category is modified.

#### `category.deleted`
Triggered when a category is deleted.

### Reminder Events

#### `reminder.created`
Triggered when a new reminder is created.

```json
{
  "event": "reminder.created",
  "timestamp": "2024-01-15T11:15:00Z",
  "data": {
    "reminder": {
      "id": "rem_789",
      "thought_id": "thought_456",
      "content": "Follow up on project",
      "due_date": "2024-01-20T14:00:00Z",
      "status": "pending"
    },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `reminder.due`
Triggered when a reminder becomes due.

```json
{
  "event": "reminder.due",
  "timestamp": "2024-01-20T14:00:00Z",
  "data": {
    "reminder": {
      "id": "rem_789",
      "thought_id": "thought_456",
      "content": "Follow up on project",
      "due_date": "2024-01-20T14:00:00Z",
      "status": "due"
    },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `reminder.completed`
Triggered when a reminder is marked as completed.

#### `reminder.overdue`
Triggered when a reminder becomes overdue.

### AI Processing Events

#### `ai.processing_started`
Triggered when AI processing begins for a thought.

```json
{
  "event": "ai.processing_started",
  "timestamp": "2024-01-15T10:31:00Z",
  "data": {
    "job_id": "job_abc123",
    "thought_id": "thought_456",
    "services": ["categorization", "reminder_extraction"],
    "estimated_completion": "2024-01-15T10:33:00Z",
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `ai.processing_completed`
Triggered when AI processing completes.

```json
{
  "event": "ai.processing_completed",
  "timestamp": "2024-01-15T10:32:30Z",
  "data": {
    "job_id": "job_abc123",
    "thought_id": "thought_456",
    "results": {
      "categorization": {
        "suggested_category": "cat_123",
        "confidence": 0.92
      },
      "reminder_extraction": {
        "reminders_found": [
          {
            "content": "Follow up next week",
            "due_date": "2024-01-22T09:00:00Z"
          }
        ]
      }
    },
    "user_id": "user_123"
  },
  "webhook_id": "webhook_789"
}
```

#### `ai.processing_failed`
Triggered when AI processing fails.

### User Events

#### `user.subscription_updated`
Triggered when a user's subscription changes.

#### `user.preferences_updated`
Triggered when user preferences are modified.

## Setting Up Webhooks

### Creating a Webhook

```http
POST /webhooks
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "url": "https://your-app.com/webhooks/cathcr",
  "events": [
    "thought.created",
    "thought.updated",
    "reminder.due"
  ],
  "secret": "your_webhook_secret",
  "active": true,
  "description": "Main application webhook"
}
```

**Response:**
```json
{
  "id": "webhook_789",
  "url": "https://your-app.com/webhooks/cathcr",
  "events": ["thought.created", "thought.updated", "reminder.due"],
  "active": true,
  "secret": "your_webhook_secret",
  "created_at": "2024-01-15T10:00:00Z",
  "last_delivery": null,
  "delivery_count": 0,
  "failure_count": 0
}
```

### Managing Webhooks

#### List All Webhooks
```http
GET /webhooks
Authorization: Bearer your_api_key
```

#### Get Webhook Details
```http
GET /webhooks/{webhook_id}
Authorization: Bearer your_api_key
```

#### Update Webhook
```http
PATCH /webhooks/{webhook_id}
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "events": ["thought.created", "reminder.due"],
  "active": false
}
```

#### Delete Webhook
```http
DELETE /webhooks/{webhook_id}
Authorization: Bearer your_api_key
```

## Webhook Security

### HMAC Signature Verification

Every webhook payload includes an HMAC signature for verification:

**Headers:**
```
X-Cathcr-Signature-256: sha256=1234567890abcdef...
X-Cathcr-Delivery: 12345678-1234-1234-1234-123456789012
X-Cathcr-Event: thought.created
```

**Verification (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const calculatedSignature = `sha256=${hmac.digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

// Express.js example
app.post('/webhooks/cathcr', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-cathcr-signature-256'];
  const payload = req.body;

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }

  // Process webhook
  const event = JSON.parse(payload);
  handleWebhookEvent(event);

  res.status(200).send('OK');
});
```

**Verification (Python):**
```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# Flask example
from flask import Flask, request

@app.route('/webhooks/cathcr', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-Cathcr-Signature-256')
    payload = request.get_data()

    if not verify_webhook_signature(payload, signature, WEBHOOK_SECRET):
        return 'Unauthorized', 401

    event = request.get_json()
    handle_webhook_event(event)

    return 'OK', 200
```

### IP Whitelisting

Cathcr webhook requests come from these IP ranges:
```
52.89.214.238/32
54.187.174.169/32
54.187.205.235/32
52.89.218.196/32
```

## Delivery and Retry Logic

### Delivery Expectations

- **Timeout**: 30 seconds
- **Expected Response**: HTTP 2xx status code
- **User-Agent**: `Cathcr-Webhooks/1.0`
- **Content-Type**: `application/json`

### Retry Mechanism

Failed deliveries are retried using exponential backoff:

1. **Immediate retry**: If initial delivery fails
2. **5 minutes**: First retry attempt
3. **15 minutes**: Second retry attempt
4. **1 hour**: Third retry attempt
5. **6 hours**: Fourth retry attempt
6. **24 hours**: Final retry attempt

After 5 failed attempts, the webhook is automatically disabled.

### Monitoring Delivery Status

```http
GET /webhooks/{webhook_id}/deliveries
Authorization: Bearer your_api_key
```

**Response:**
```json
{
  "deliveries": [
    {
      "id": "delivery_123",
      "timestamp": "2024-01-15T10:30:00Z",
      "event": "thought.created",
      "status_code": 200,
      "response_time": 150,
      "attempt": 1,
      "success": true
    },
    {
      "id": "delivery_124",
      "timestamp": "2024-01-15T10:31:00Z",
      "event": "reminder.due",
      "status_code": 500,
      "response_time": 30000,
      "attempt": 3,
      "success": false,
      "error": "Connection timeout"
    }
  ],
  "pagination": {
    "total": 256,
    "limit": 20,
    "offset": 0
  }
}
```

## Testing Webhooks

### Webhook Testing Tool

Use our webhook testing interface:
```
https://dashboard.cathcr.com/webhooks/test
```

### Test Webhook

Send a test payload to verify your endpoint:

```http
POST /webhooks/{webhook_id}/test
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "event": "thought.created"
}
```

### Local Development

#### Using ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL in your webhook configuration
https://abc123.ngrok.io/webhooks/cathcr
```

#### Using webhook.site
1. Visit https://webhook.site
2. Copy the unique URL
3. Use it as your webhook endpoint during development
4. View incoming requests in real-time

## Webhook Examples

### Slack Integration

```javascript
// Send thought notifications to Slack
function handleWebhookEvent(event) {
  if (event.event === 'thought.created') {
    const { thought, user_id } = event.data;

    if (thought.tags.includes('team')) {
      sendSlackNotification({
        channel: '#team-thoughts',
        text: `New team thought: ${thought.content}`,
        user: user_id
      });
    }
  }
}
```

### Task Management Integration

```javascript
// Create tasks from thoughts with action items
function handleWebhookEvent(event) {
  if (event.event === 'ai.processing_completed') {
    const { results, thought_id } = event.data;

    if (results.reminder_extraction?.reminders_found?.length > 0) {
      results.reminder_extraction.reminders_found.forEach(reminder => {
        createTodoistTask({
          content: reminder.content,
          due_date: reminder.due_date,
          project: getProjectFromThought(thought_id)
        });
      });
    }
  }
}
```

### Analytics Tracking

```javascript
// Track thought patterns in analytics
function handleWebhookEvent(event) {
  switch (event.event) {
    case 'thought.created':
      analytics.track('Thought Created', {
        user_id: event.data.user_id,
        category: event.data.thought.category?.name,
        has_tags: event.data.thought.tags.length > 0
      });
      break;

    case 'reminder.completed':
      analytics.track('Reminder Completed', {
        user_id: event.data.user_id,
        completion_time: event.data.reminder.completed_at
      });
      break;
  }
}
```

## Best Practices

### Endpoint Implementation

1. **Respond Quickly**: Return 200 status immediately
2. **Process Asynchronously**: Queue heavy processing for later
3. **Handle Duplicates**: Use delivery IDs to detect duplicates
4. **Validate Signatures**: Always verify webhook authenticity
5. **Log Everything**: Keep detailed logs for debugging

### Error Handling

```javascript
app.post('/webhooks/cathcr', async (req, res) => {
  try {
    // Immediately acknowledge receipt
    res.status(200).send('OK');

    // Validate signature
    if (!verifyWebhookSignature(req.body, req.headers['x-cathcr-signature-256'])) {
      console.error('Invalid webhook signature');
      return;
    }

    // Check for duplicate delivery
    const deliveryId = req.headers['x-cathcr-delivery'];
    if (await isDuplicateDelivery(deliveryId)) {
      console.log('Duplicate delivery detected, skipping');
      return;
    }

    // Queue for processing
    await queueWebhookEvent(req.body);

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Don't return error status - we already acknowledged receipt
  }
});
```

### Scaling Considerations

1. **Use Queues**: Queue webhook processing for high-volume applications
2. **Rate Limiting**: Implement rate limiting on your webhook endpoints
3. **Load Balancing**: Distribute webhook traffic across multiple servers
4. **Monitoring**: Track webhook delivery success rates and response times

## Troubleshooting

### Common Issues

#### Webhook Not Receiving Events
- Check webhook URL accessibility from external networks
- Verify SSL certificate is valid
- Ensure endpoint returns 2xx status codes
- Check webhook is active and events are configured

#### Authentication Failures
- Verify webhook secret is correct
- Check HMAC signature calculation
- Ensure payload is raw bytes, not parsed JSON

#### Timeouts
- Optimize endpoint response time (< 30 seconds)
- Move heavy processing to background jobs
- Return 200 status immediately

### Debugging Tools

#### Webhook Logs
```http
GET /webhooks/{webhook_id}/logs?limit=50
Authorization: Bearer your_api_key
```

#### Manual Replay
```http
POST /webhooks/{webhook_id}/replay/{delivery_id}
Authorization: Bearer your_api_key
```

#### Health Check
Test your webhook endpoint health:
```bash
curl -X POST https://your-app.com/webhooks/cathcr \
  -H "Content-Type: application/json" \
  -H "X-Cathcr-Signature-256: sha256=test" \
  -d '{"test": true}'
```

Webhooks enable powerful real-time integrations with Cathcr. Start simple and iterate as your integration needs grow! 🔗