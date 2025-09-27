# 📡 API Reference

*Complete REST API documentation for the Catcher backend services*

## 🎯 API Overview

The Catcher API provides endpoints for:
- **Thought Management**: CRUD operations for captured thoughts
- **AI Processing**: OpenAI GPT-4 enrichment and HuggingFace Whisper transcription
- **User Authentication**: Supabase Auth integration
- **Real-time Updates**: WebSocket connections for live updates
- **Extension Support**: Chrome extension specific endpoints
- **Search & Discovery**: Advanced search and mind mapping features

### Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://your-api-domain.com`

### Authentication
All API endpoints require JWT authentication via Supabase:
```javascript
headers: {
  'Authorization': 'Bearer <supabase-jwt-token>',
  'Content-Type': 'application/json'
}
```

---

## 🧠 Thoughts API

### POST /api/capture
Create a new thought with optional AI processing.

**Request Body:**
```json
{
  "content": "Meeting with Sarah tomorrow at 3pm about the project",
  "transcribed_text": "Meeting with Sarah tomorrow at 3pm about the project",
  "audio_url": null,
  "audio_duration": null,
  "type": "note",
  "tags": ["meeting", "project"],
  "source": "extension"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "user_id": "user-uuid",
    "content": "Meeting with Sarah tomorrow at 3pm about the project",
    "transcribed_text": "Meeting with Sarah tomorrow at 3pm about the project",
    "category": {
      "main": "work",
      "subcategory": "meeting",
      "confidence": 0.92,
      "color": "#FF6A00",
      "icon": "💼"
    },
    "tags": ["meeting", "project", "work"],
    "entities": {
      "people": ["Sarah"],
      "dates": ["tomorrow at 3pm"],
      "topics": ["project"]
    },
    "commands": [
      {
        "type": "create_event",
        "confidence": 0.87,
        "data": {
          "title": "Meeting with Sarah",
          "date": "2024-01-16T15:00:00Z",
          "description": "Project discussion"
        }
      }
    ],
    "is_processed": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Thought captured and processed successfully"
}
```

### GET /api/capture
Retrieve user's thoughts with pagination and filtering.

**Query Parameters:**
- `limit` (number): Number of thoughts to return (default: 20, max: 100)
- `offset` (number): Pagination offset (default: 0)
- `category` (string): Filter by category
- `type` (string): Filter by type (note, task, reminder, etc.)
- `search` (string): Full-text search query
- `include_processed` (boolean): Include AI-processed thoughts (default: true)
- `date_from` (string): ISO date string for date range filtering
- `date_to` (string): ISO date string for date range filtering

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4",
      "content": "Thought content...",
      "category": { "main": "work", "subcategory": "meeting" },
      "tags": ["meeting", "project"],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "has_more": true
  }
}
```

### GET /api/capture/:id
Retrieve a specific thought by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "content": "Full thought content with all metadata",
    "linked_thoughts": ["uuid-1", "uuid-2"],
    "backlinks": ["uuid-3", "uuid-4"],
    "ai_summary": "AI-generated summary",
    "processing_history": [
      {
        "type": "transcription",
        "timestamp": "2024-01-15T10:30:00Z",
        "confidence": 0.95
      }
    ]
  }
}
```

### PUT /api/capture/:id
Update an existing thought.

**Request Body:**
```json
{
  "content": "Updated thought content",
  "tags": ["updated", "tags"],
  "category": {
    "main": "personal",
    "subcategory": "journal"
  }
}
```

### DELETE /api/capture/:id
Delete a thought permanently.

**Response:**
```json
{
  "success": true,
  "message": "Thought deleted successfully"
}
```

---

## 🎤 Transcription API

### POST /api/transcription/process
Process audio file for speech-to-text conversion using HuggingFace Whisper.

**Content-Type:** `multipart/form-data`

**Request:**
```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('language', 'en');
formData.append('enhance_accuracy', 'true');

fetch('/api/transcription/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "This is the transcribed text from the audio",
    "confidence": 0.94,
    "language": "en",
    "processing_time": 1234,
    "segments": [
      {
        "text": "This is the transcribed text",
        "start": 0.0,
        "end": 2.5,
        "confidence": 0.96
      }
    ],
    "backend": "whisper-large-v3"
  }
}
```

### POST /api/transcription/enhance
Enhance Web Speech API transcription with server-side processing.

**Request Body:**
```json
{
  "web_speech_text": "Text from Web Speech API",
  "language": "en",
  "audio": "base64-encoded-audio-data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Enhanced transcription with better accuracy",
    "confidence": 0.97,
    "backend": "whisper",
    "processing_time": 800,
    "improvements": [
      "Fixed capitalization",
      "Corrected grammar",
      "Added punctuation"
    ],
    "original_web_speech": "Text from Web Speech API"
  }
}
```

### GET /api/transcription/languages
Get supported languages for transcription.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "en",
      "name": "English",
      "variants": ["en-US", "en-GB", "en-AU"]
    },
    {
      "code": "es",
      "name": "Spanish",
      "variants": ["es-ES", "es-MX"]
    }
  ]
}
```

---

## 🤖 AI Processing API

### POST /api/ai/enrich
Process a thought with OpenAI GPT-4 for categorization and enhancement.

**Request Body:**
```json
{
  "thought_id": "uuid-v4",
  "content": "Raw thought content to be processed",
  "options": {
    "include_summary": true,
    "include_categorization": true,
    "include_entity_extraction": true,
    "include_command_parsing": true,
    "include_linking_suggestions": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thought_id": "uuid-v4",
    "enrichment": {
      "summary": "Concise 2-sentence summary of the thought",
      "category": {
        "main": "work",
        "subcategory": "planning",
        "confidence": 0.89
      },
      "tags": ["project", "deadline", "team"],
      "entities": {
        "people": ["John", "Sarah"],
        "dates": ["next Friday", "2024-01-20"],
        "locations": ["conference room"],
        "topics": ["quarterly review"]
      },
      "commands": [
        {
          "type": "create_calendar_event",
          "confidence": 0.85,
          "parameters": {
            "title": "Quarterly Review Meeting",
            "date": "2024-01-20T14:00:00Z",
            "attendees": ["john@company.com"]
          }
        }
      ],
      "linking_suggestions": [
        {
          "thought_id": "related-uuid",
          "similarity_score": 0.78,
          "reason": "Similar topic: quarterly planning"
        }
      ]
    },
    "processing_time": 1500,
    "model_used": "gpt-4-turbo",
    "tokens_used": 245
  }
}
```

### POST /api/ai/batch-enrich
Process multiple thoughts in a single batch request.

**Request Body:**
```json
{
  "thoughts": [
    {
      "id": "uuid-1",
      "content": "First thought content"
    },
    {
      "id": "uuid-2",
      "content": "Second thought content"
    }
  ],
  "options": {
    "include_summary": true,
    "parallel_processing": true
  }
}
```

### GET /api/ai/processing-status/:thoughtId
Check the processing status of a thought.

**Response:**
```json
{
  "success": true,
  "data": {
    "thought_id": "uuid-v4",
    "status": "processing", // "pending", "processing", "completed", "failed"
    "progress": 75,
    "estimated_completion": "2024-01-15T10:35:00Z",
    "steps_completed": [
      "transcription",
      "categorization",
      "entity_extraction"
    ],
    "steps_remaining": [
      "command_parsing"
    ]
  }
}
```

---

## 🔍 Search API

### GET /api/search
Advanced search with fuzzy matching and semantic similarity.

**Query Parameters:**
- `q` (string): Search query
- `type` (string): Search type ("fuzzy", "semantic", "exact", "mixed")
- `category` (string): Filter by category
- `tags` (array): Filter by tags
- `limit` (number): Results limit (default: 20)
- `offset` (number): Pagination offset
- `include_suggestions` (boolean): Include search suggestions
- `similarity_threshold` (number): Minimum similarity score (0.0-1.0)

**Request:**
```
GET /api/search?q=meeting%20sarah&type=mixed&limit=10&include_suggestions=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid-v4",
        "content": "Meeting with Sarah tomorrow...",
        "relevance_score": 0.95,
        "match_type": "exact",
        "highlights": [
          {
            "field": "content",
            "matches": ["<em>meeting</em> with <em>Sarah</em>"]
          }
        ]
      }
    ],
    "suggestions": [
      "sarah meeting",
      "meeting notes",
      "sarah project"
    ],
    "facets": {
      "categories": {
        "work": 15,
        "personal": 3
      },
      "tags": {
        "meeting": 12,
        "project": 8
      }
    }
  },
  "pagination": {
    "total": 18,
    "limit": 10,
    "offset": 0
  }
}
```

### GET /api/search/suggestions
Get search suggestions based on partial query.

**Query Parameters:**
- `q` (string): Partial search query
- `limit` (number): Number of suggestions (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "meeting with sarah",
        "type": "content_match",
        "frequency": 15
      },
      {
        "text": "sarah project",
        "type": "tag_combination",
        "frequency": 8
      }
    ]
  }
}
```

---

## 🔗 Integration APIs

### Google Calendar Integration

#### POST /api/integrations/google/auth
Initiate Google OAuth flow for calendar access.

**Request Body:**
```json
{
  "redirect_uri": "http://localhost:3000/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auth_url": "https://accounts.google.com/oauth2/authorize?...",
    "state": "random-state-token"
  }
}
```

#### POST /api/integrations/google/calendar/event
Create a calendar event from a thought.

**Request Body:**
```json
{
  "thought_id": "uuid-v4",
  "event": {
    "title": "Meeting with Sarah",
    "start_time": "2024-01-16T15:00:00Z",
    "end_time": "2024-01-16T16:00:00Z",
    "description": "Discuss project timeline",
    "attendees": ["sarah@company.com"],
    "location": "Conference Room A"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "google-calendar-event-id",
    "event_url": "https://calendar.google.com/event?...",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Google Tasks Integration

#### POST /api/integrations/google/tasks/create
Create a Google Task from a thought.

**Request Body:**
```json
{
  "thought_id": "uuid-v4",
  "task": {
    "title": "Review project proposal",
    "notes": "Details from the thought content",
    "due_date": "2024-01-20T09:00:00Z"
  }
}
```

---

## 🔌 Extension API

### POST /api/extension/thoughts/batch
Save multiple thoughts from Chrome extension (offline sync).

**Request Body:**
```json
{
  "thoughts": [
    {
      "offline_id": "local-uuid-1",
      "content": "Thought captured offline",
      "timestamp": 1642234567890,
      "source_url": "https://example.com",
      "source_title": "Example Page"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "saved": 1,
    "results": [
      {
        "offline_id": "local-uuid-1",
        "server_id": "uuid-v4",
        "status": "saved"
      }
    ]
  }
}
```

### GET /api/extension/thoughts/recent
Get recent thoughts for extension popup.

**Query Parameters:**
- `limit` (number): Number of thoughts (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-v4",
      "content": "Recent thought content (truncated to 100 chars)",
      "created_at": "2024-01-15T10:30:00Z",
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### GET /api/extension/settings
Get extension-specific user settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "global_shortcuts": true,
    "auto_sync": true,
    "voice_capture": true,
    "offline_mode": true,
    "sync_interval": 300000,
    "max_offline_thoughts": 1000
  }
}
```

---

## 📊 Analytics API

### GET /api/analytics/dashboard
Get user analytics dashboard data.

**Query Parameters:**
- `period` (string): Time period ("day", "week", "month", "year")
- `timezone` (string): User timezone (default: UTC)

**Response:**
```json
{
  "success": true,
  "data": {
    "capture_stats": {
      "total_thoughts": 1247,
      "thoughts_this_period": 45,
      "average_per_day": 6.4,
      "growth_rate": 0.12
    },
    "category_breakdown": {
      "work": 520,
      "personal": 412,
      "ideas": 315
    },
    "capture_methods": {
      "voice": 60,
      "text": 35,
      "extension": 5
    },
    "peak_hours": [9, 14, 21],
    "ai_processing_stats": {
      "accuracy_score": 0.92,
      "processing_time_avg": 1200,
      "enrichment_rate": 0.95
    }
  }
}
```

---

## 🔄 WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.send(JSON.stringify({
  type: 'auth',
  token: 'bearer-token'
}));
```

### Real-time Events

#### Thought Processing Updates
```json
{
  "type": "thought_processing",
  "data": {
    "thought_id": "uuid-v4",
    "status": "completed",
    "enrichment": {
      "category": "work",
      "tags": ["meeting", "project"]
    }
  }
}
```

#### Search Result Updates
```json
{
  "type": "search_results",
  "data": {
    "query": "meeting sarah",
    "results": [...],
    "total": 15
  }
}
```

#### Sync Status Updates
```json
{
  "type": "sync_status",
  "data": {
    "status": "syncing",
    "progress": 75,
    "pending_items": 3
  }
}
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "content",
      "reason": "Content cannot be empty"
    },
    "request_id": "req-uuid-v4"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid auth token |
| `AUTHORIZATION_FAILED` | 403 | User lacks permission |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `THOUGHT_NOT_FOUND` | 404 | Thought ID not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `AI_PROCESSING_FAILED` | 500 | OpenAI/Whisper service error |
| `DATABASE_ERROR` | 500 | Supabase database error |
| `INTERNAL_ERROR` | 500 | General server error |

---

## 📈 Rate Limits

| Endpoint Category | Requests per Minute | Burst Limit |
|------------------|---------------------|-------------|
| Thoughts CRUD | 60 | 10 |
| AI Processing | 20 | 5 |
| Transcription | 15 | 3 |
| Search | 120 | 20 |
| Extension Sync | 30 | 10 |
| WebSocket Connections | 5 | 1 |

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642234567
X-RateLimit-Burst: 10
```

---

## 🔒 Security

### API Security Features
- **JWT Authentication**: All endpoints require valid Supabase JWT
- **CORS Protection**: Configured allowed origins
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: Prevent API abuse
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Content sanitization

### Data Privacy
- **No Audio Storage**: Audio processed and discarded immediately
- **Encryption in Transit**: All API calls over HTTPS
- **Row Level Security**: Database-level access control
- **Data Retention**: Configurable data retention policies

---

*📡 This API reference covers all endpoints for the Catcher platform with OpenAI GPT-4 integration, HuggingFace Whisper transcription, and comprehensive search capabilities. The API prioritizes SPEED, ZERO FRICTION, and SNAPPINESS while maintaining security and reliability.*