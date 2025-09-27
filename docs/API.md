# CATHCR API Documentation

This document describes the REST API and Socket.IO events for the CATHCR application.

## 🌐 REST API

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.cathcr.com/api
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Error Responses
All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## 🔐 Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric, _, -)",
  "email": "string (valid email)",
  "password": "string (8+ chars, mixed case, number)"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  },
  "token": "string"
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - User already exists
- `422` - Validation errors

---

### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  },
  "token": "string"
}
```

**Error Responses:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

### POST /api/auth/refresh
Refresh an expired JWT token.

**Request Body:**
```json
{
  "token": "string (refresh token)"
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "token": "string (new access token)"
}
```

**Error Responses:**
- `400` - Missing refresh token
- `401` - Invalid refresh token

---

### GET /api/auth/me
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "username": "string", 
    "email": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Error Responses:**
- `401` - Missing or invalid token

---

## 💭 Capture Endpoints

### POST /api/capture
Create a new thought capture.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "string (required, 1-10000 chars)",
  "audioUrl": "string (optional, audio file URL)",
  "context": {
    "url": "string (optional)",
    "title": "string (optional)",
    "selectedText": "string (optional)"
  },
  "source": "web|extension|api|mobile",
  "tags": ["string array (optional)"]
}
```

**Response (201):**
```json
{
  "success": true,
  "capture": {
    "id": "string",
    "text": "string",
    "audioUrl": "string",
    "context": "object",
    "source": "string",
    "tags": ["string"],
    "isProcessed": false,
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Error Responses:**
- `400` - Invalid capture data
- `401` - Unauthorized
- `422` - Validation errors

---

### GET /api/capture
Get user's captures with filtering and pagination.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of captures (default: 20, max: 100)
- `offset` (optional): Number to skip (default: 0)
- `source` (optional): Filter by source (web, extension, api, mobile)
- `tags` (optional): Filter by tags (comma-separated)
- `search` (optional): Full-text search query
- `since` (optional): ISO date for captures after this date

**Response (200):**
```json
{
  "success": true,
  "captures": [
    {
      "id": "string",
      "text": "string",
      "audioUrl": "string",
      "context": "object",
      "source": "string",
      "tags": ["string"],
      "isProcessed": boolean,
      "aiConfidence": "number",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ],
  "pagination": {
    "total": "number",
    "limit": "number",
    "offset": "number",
    "hasMore": boolean
  }
}
```

---

### GET /api/capture/:id
Get a specific capture by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "capture": {
    "id": "string",
    "text": "string",
    "audioUrl": "string",
    "context": "object",
    "source": "string",
    "tags": ["string"],
    "isProcessed": boolean,
    "aiSuggestions": "object",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**Error Responses:**
- `404` - Capture not found
- `401` - Unauthorized

---

### PUT /api/capture/:id
Update an existing capture.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "string (optional)",
  "tags": ["string array (optional)"],
  "context": "object (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "capture": {
    "id": "string",
    "text": "string",
    "tags": ["string"],
    "updatedAt": "ISO date"
  }
}
```

---

### DELETE /api/capture/:id
Delete a capture.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Capture deleted successfully"
}
```

**Error Responses:**
- `404` - Capture not found
- `401` - Unauthorized

---

## 🎤 Transcription Endpoints

### POST /api/transcription/audio
Transcribe audio file to text using AI services.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
audio: File (required, max 25MB, formats: mp3, wav, m4a, webm)
language: string (optional, ISO 639-1 code, default: auto-detect)
model: string (optional, huggingface|openai|webspeech, default: huggingface)
```

**Response (200):**
```json
{
  "success": true,
  "transcription": {
    "text": "string",
    "confidence": "number (0-1)",
    "language": "string",
    "model": "string",
    "processingTime": "number (ms)"
  }
}
```

**Error Responses:**
- `400` - Invalid audio file or parameters
- `401` - Unauthorized
- `413` - File too large
- `415` - Unsupported media type

---

### POST /api/transcription/batch
Batch transcribe multiple audio files.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
files: File[] (required, max 10 files)
language: string (optional)
model: string (optional)
```

**Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "filename": "string",
      "success": boolean,
      "transcription": {
        "text": "string",
        "confidence": "number",
        "language": "string"
      },
      "error": "string (if failed)"
    }
  ]
}
```

---

## 🔌 Chrome Extension Endpoints

### POST /api/extension/auth
Authenticate Chrome extension with the server.

**Request Body:**
```json
{
  "extensionId": "string (required, Chrome extension ID)",
  "version": "string (required, extension version)",
  "userId": "string (optional, user ID if logged in)"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "string (JWT token for extension)",
  "message": "Extension authenticated successfully"
}
```

**Error Responses:**
- `400` - Missing required fields
- `500` - Authentication failed

---

### POST /api/extension/sync
Synchronize captures from extension to server.

**Headers:**
```
Authorization: Bearer <extension-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "captures": [
    {
      "id": "string (extension capture ID)",
      "text": "string (required)",
      "audioUrl": "string (optional)",
      "context": {
        "url": "string",
        "title": "string",
        "favicon": "string"
      },
      "timestamp": "number (Unix timestamp)",
      "source": "extension"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "synced": "number (count of successful syncs)",
  "results": {
    "successful": ["string array (capture IDs)"],
    "failed": [
      {
        "id": "string",
        "error": "string"
      }
    ],
    "duplicates": ["string array (capture IDs)"]
  }
}
```

**Error Responses:**
- `401` - Invalid or expired extension token
- `400` - Invalid capture data

---

### GET /api/extension/captures
Get user's captures for extension display.

**Headers:**
```
Authorization: Bearer <extension-token>
```

**Query Parameters:**
- `limit` (optional): Number of captures (default: 50, max: 100)
- `offset` (optional): Number to skip (default: 0)
- `since` (optional): ISO date for captures after this date

**Response (200):**
```json
{
  "success": true,
  "captures": [
    {
      "id": "string",
      "extensionId": "string",
      "text": "string",
      "audioUrl": "string",
      "context": "object",
      "source": "string",
      "createdAt": "ISO date",
      "timestamp": "number"
    }
  ],
  "pagination": {
    "limit": "number",
    "offset": "number",
    "total": "number",
    "hasMore": boolean
  }
}
```

---

### POST /api/extension/connect
Connect extension to user account using generated code.

**Request Body:**
```json
{
  "extensionId": "string (required)",
  "userId": "string (required)",
  "connectionCode": "string (required, 6-char code)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Extension successfully connected to user account"
}
```

**Error Responses:**
- `400` - Invalid or expired connection code
- `500` - Connection failed

---

### POST /api/extension/disconnect
Disconnect extension from user account.

**Headers:**
```
Authorization: Bearer <extension-token>
```

**Request Body:**
```json
{
  "extensionId": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Extension disconnected successfully"
}
```

---

### GET /api/extension/health
Health check for extension services.

**Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "ISO date",
  "version": "string"
}
```

---

## 🏠 Room Endpoints

### GET /api/rooms
Get list of chat rooms.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of rooms to return (default: 50, max: 100)
- `offset` (optional): Number of rooms to skip (default: 0)

**Response (200):**
```json
{
  "rooms": [
    {
      "id": "string",
      "name": "string",
      "createdBy": "string",
      "createdAt": "ISO date",
      "memberCount": "number"
    }
  ]
}
```

---

### POST /api/rooms
Create a new chat room.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string (1-50 chars)",
  "description": "string (optional, max 500 chars)",
  "isPrivate": "boolean (optional, default: false)"
}
```

**Response (201):**
```json
{
  "message": "Room created successfully",
  "room": {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdBy": "string",
    "createdAt": "ISO date",
    "memberCount": "number",
    "isPrivate": "boolean"
  }
}
```

**Error Responses:**
- `400` - Invalid room data
- `422` - Validation errors

---

### GET /api/rooms/:roomId
Get details of a specific room.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "room": {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdBy": "string",
    "createdAt": "ISO date",
    "memberCount": "number",
    "isPrivate": "boolean"
  }
}
```

**Error Responses:**
- `404` - Room not found
- `403` - Access denied (private room)

---

### GET /api/rooms/:roomId/messages
Get messages from a specific room.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50, max: 100)
- `before` (optional): Get messages before this message ID
- `after` (optional): Get messages after this message ID

**Response (200):**
```json
{
  "messages": [
    {
      "id": "string",
      "content": "string",
      "userId": "string",
      "username": "string",
      "roomId": "string",
      "createdAt": "ISO date",
      "editedAt": "ISO date (optional)",
      "type": "text|image|file"
    }
  ],
  "total": "number"
}
```

**Error Responses:**
- `404` - Room not found
- `403` - Access denied

---

## 🔌 Socket.IO Events

### Connection URL
```
ws://localhost:3001/socket.io/
```

### Authentication
Send authentication data immediately after connecting:

```javascript
socket.emit('authenticate', {
  userId: 'string',
  username: 'string'
});
```

---

## 📡 Client to Server Events

### authenticate
Authenticate the socket connection.

**Payload:**
```javascript
{
  userId: 'string',
  username: 'string'
}
```

### create_room
Create a new chat room.

**Payload:**
```javascript
{
  name: 'string',
  creatorId: 'string'
}
```

### join_room
Join an existing chat room.

**Payload:**
```javascript
'roomId' // string
```

### leave_room
Leave the current chat room.

**Payload:**
```javascript
'roomId' // string  
```

### send_message
Send a message to the current room.

**Payload:**
```javascript
{
  content: 'string',
  userId: 'string',
  username: 'string',
  roomId: 'string'
}
```

---

## 📨 Server to Client Events

### room_created
Emitted when a room is successfully created.

**Payload:**
```javascript
{
  id: 'string',
  name: 'string',
  createdBy: 'string',
  createdAt: 'ISO date',
  memberCount: 'number'
}
```

### room_create_error
Emitted when room creation fails.

**Payload:**
```javascript
'error message' // string
```

### rooms_updated
Emitted when the user's room list changes.

**Payload:**
```javascript
[
  {
    id: 'string',
    name: 'string',
    createdBy: 'string',
    createdAt: 'ISO date',
    memberCount: 'number'
  }
]
```

### room_joined
Emitted when successfully joining a room.

**Payload:**
```javascript
{
  roomId: 'string',
  messages: [
    {
      id: 'string',
      content: 'string',
      userId: 'string',
      username: 'string',
      roomId: 'string',
      createdAt: 'ISO date'
    }
  ]
}
```

### room_left
Emitted when leaving a room.

**Payload:** None

### message
Emitted when a new message is received.

**Payload:**
```javascript
{
  id: 'string',
  content: 'string',
  userId: 'string',
  username: 'string',
  roomId: 'string',
  createdAt: 'ISO date'
}
```

### user_joined
Emitted when a user joins the current room.

**Payload:**
```javascript
{
  userId: 'string',
  username: 'string'
}
```

### user_left
Emitted when a user leaves the current room.

**Payload:**
```javascript
{
  userId: 'string',
  username: 'string'
}
```

### error
Emitted when an error occurs.

**Payload:**
```javascript
'error message' // string
```

---

## 🔧 Example Usage

### JavaScript/TypeScript Client

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Authenticate
socket.emit('authenticate', {
  userId: 'user123',
  username: 'john_doe'
});

// Listen for room updates
socket.on('rooms_updated', (rooms) => {
  console.log('Available rooms:', rooms);
});

// Join a room
socket.emit('join_room', 'room123');

// Listen for room messages
socket.on('room_joined', (roomId, messages) => {
  console.log(`Joined room ${roomId}`, messages);
});

// Send a message
socket.emit('send_message', {
  content: 'Hello, world!',
  userId: 'user123',
  username: 'john_doe',
  roomId: 'room123'
});

// Listen for new messages
socket.on('message', (message) => {
  console.log('New message:', message);
});
```

### REST API with fetch

```javascript
// Register user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123'
  })
});

const { user, token } = await registerResponse.json();

// Create room
const roomResponse = await fetch('/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'General Chat'
  })
});

const { room } = await roomResponse.json();
```

---

## 🚨 Rate Limiting

Current implementation doesn't include rate limiting, but production deployments should consider:

- Authentication endpoints: 5 requests per minute
- Room creation: 10 requests per hour
- Message sending: 100 messages per minute
- General API: 1000 requests per hour

---

## 🔒 Security Considerations

- All sensitive endpoints require JWT authentication
- CORS is configured for development (update for production)
- Input validation is performed on all endpoints
- Socket.IO connections are authenticated
- Consider implementing rate limiting for production
- Use HTTPS in production environments