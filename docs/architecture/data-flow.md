# Data Flow Architecture

This document describes how data flows through the Cathcr system, from user input to storage and AI processing.

## Overview

Cathcr's data flow is designed around real-time thought capture with asynchronous AI processing, ensuring immediate user feedback while maintaining high-quality automated organization.

## Primary Data Flows

### 1. Thought Capture Flow

```mermaid
graph TD
    A[User Input] --> B{Input Type}
    B -->|Voice| C[Web Speech API]
    B -->|Text| D[Direct Text Input]
    B -->|Audio File| E[File Upload]

    C --> F[Real-time Transcription]
    E --> G[Whisper API Processing]

    F --> H[Text Validation]
    G --> H
    D --> H

    H --> I[Client State Update]
    I --> J[API Request]
    J --> K[Server Validation]
    K --> L[Database Insert]

    L --> M[Trigger: Processing Queue]
    L --> N[Real-time Broadcast]

    M --> O[AI Processing Pipeline]
    N --> P[Client Real-time Update]
```

#### Flow Steps:

1. **Input Capture**:
   - Voice: Web Speech API provides real-time transcription
   - Audio File: Uploaded to server for Whisper processing
   - Text: Direct keyboard input

2. **Client Processing**:
   - Text validation and sanitization
   - Immediate UI feedback with optimistic updates
   - Local state management with Zustand

3. **Server Processing**:
   - Authentication validation
   - Input sanitization and validation
   - Database insertion with user_id

4. **Database Operations**:
   - Insert thought record
   - Trigger processing queue creation
   - Real-time subscription notification

5. **Background Processing**:
   - AI categorization queue
   - Entity extraction queue
   - Reminder parsing (if applicable)

### 2. AI Processing Pipeline

```mermaid
graph TD
    A[New Thought] --> B[Processing Queue Creation]
    B --> C[Queue Worker]
    C --> D{Task Type}

    D -->|categorize| E[OpenAI GPT-4o-mini]
    D -->|extract_entities| F[OpenAI Structured Output]
    D -->|parse_reminders| G[chrono-node Parser]

    E --> H[Category Assignment]
    F --> I[Entity Extraction]
    G --> J[Reminder Scheduling]

    H --> K[Database Update]
    I --> K
    J --> K

    K --> L[Processing Log]
    K --> M[Real-time Update]

    M --> N[Client Notification]
    L --> O[Analytics & Monitoring]
```

#### Processing Types:

1. **Categorization**:
   - OpenAI GPT-4o-mini analyzes content
   - Assigns category with confidence score
   - Updates thought record

2. **Entity Extraction**:
   - Identifies people, places, dates, amounts
   - Structured data extraction
   - Creates relationships and metadata

3. **Reminder Parsing**:
   - Natural language date/time parsing
   - chrono-node processes temporal expressions
   - Schedules future notifications

### 3. Real-time Update Flow

```mermaid
graph TD
    A[Database Change] --> B[Supabase Real-time]
    B --> C[WebSocket Broadcast]
    C --> D[Client Subscription]
    D --> E{Update Type}

    E -->|thought_created| F[Add to Local State]
    E -->|thought_updated| G[Update Local State]
    E -->|processing_complete| H[Update UI Status]

    F --> I[UI Re-render]
    G --> I
    H --> I

    I --> J[Animation Triggers]
    J --> K[User Feedback]
```

### 4. Search and Retrieval Flow

```mermaid
graph TD
    A[Search Query] --> B[Client Debounce]
    B --> C[Search API Call]
    C --> D[Server Validation]
    D --> E[PostgreSQL Full-text Search]
    E --> F[Result Ranking]
    F --> G[Response Formatting]
    G --> H[Client State Update]
    H --> I[UI Rendering]
    I --> J[Highlight Matches]
```

#### Search Process:

1. **Query Processing**:
   - Client-side debouncing (300ms)
   - Query sanitization and validation
   - Search history tracking

2. **Database Search**:
   - PostgreSQL full-text search with GIN indexes
   - ts_rank scoring for relevance
   - Filter by category, date, tags

3. **Result Processing**:
   - Relevance scoring and ranking
   - Highlight match preparation
   - Pagination and limits

## State Management Data Flow

### Client State Architecture

```mermaid
graph TD
    A[User Action] --> B[Component Handler]
    B --> C{State Type}

    C -->|Local UI| D[Zustand Store]
    C -->|Server Data| E[React Query]
    C -->|Auth| F[Auth Context]

    D --> G[Component Re-render]
    E --> H[Cache Management]
    F --> I[Route Protection]

    H --> J[Background Sync]
    J --> K[Optimistic Updates]
    K --> G
```

#### State Layers:

1. **UI State** (Zustand):
   - Modal visibility
   - Form state
   - Loading indicators
   - Theme preferences

2. **Server State** (React Query):
   - Thoughts data
   - Categories and tags
   - User profile
   - Processing status

3. **Auth State** (Context):
   - User session
   - Permissions
   - Route guards

### Server State Management

```mermaid
graph TD
    A[API Request] --> B[Express Middleware]
    B --> C[Auth Validation]
    C --> D[Rate Limiting]
    D --> E[Request Validation]
    E --> F[Business Logic]
    F --> G[Database Operation]
    G --> H[Response Formatting]
    H --> I[Client Response]

    F --> J[Background Jobs]
    J --> K[Processing Queue]
    K --> L[AI Services]
```

## Error Handling Data Flow

### Client Error Handling

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}

    B -->|Network| C[Retry Logic]
    B -->|Validation| D[User Feedback]
    B -->|Auth| E[Redirect to Login]
    B -->|Server| F[Error Boundary]

    C --> G[Exponential Backoff]
    G --> H{Max Retries?}
    H -->|No| I[Retry Request]
    H -->|Yes| J[Fallback UI]

    D --> K[Form Validation Display]
    E --> L[Clear Local State]
    F --> M[Error UI Component]
```

### Server Error Handling

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}

    B -->|Validation| C[400 Bad Request]
    B -->|Auth| D[401 Unauthorized]
    B -->|Permission| E[403 Forbidden]
    B -->|Not Found| F[404 Not Found]
    B -->|Server| G[500 Internal Error]

    C --> H[Validation Details]
    D --> I[Auth Challenge]
    E --> J[Permission Error]
    F --> K[Resource Error]
    G --> L[Error Logging]

    L --> M[Monitoring Alert]
    H --> N[Client Error Display]
    I --> N
    J --> N
    K --> N
```

## Performance Optimization Data Flow

### Caching Strategy

```mermaid
graph TD
    A[Data Request] --> B{Cache Type}

    B -->|Browser| C[React Query Cache]
    B -->|CDN| D[Static Asset Cache]
    B -->|Database| E[Connection Pool]

    C --> F{Cache Hit?}
    F -->|Yes| G[Return Cached Data]
    F -->|No| H[Fetch from Server]

    H --> I[Update Cache]
    I --> J[Return Fresh Data]

    D --> K[Edge Cache]
    E --> L[Query Result Cache]
```

### Data Loading Optimization

```mermaid
graph TD
    A[Page Load] --> B[Critical Data]
    B --> C[Immediate Render]
    C --> D[Progressive Loading]

    D --> E[Skeleton UI]
    E --> F[Background Fetch]
    F --> G[Incremental Updates]

    G --> H[Smooth Transitions]
    H --> I[Complete UI]
```

## Security Data Flow

### Authentication Flow

```mermaid
graph TD
    A[User Login] --> B[Supabase Auth]
    B --> C[JWT Token]
    C --> D[Client Storage]
    D --> E[API Requests]
    E --> F[Token Validation]
    F --> G{Valid?}

    G -->|Yes| H[Authorized Access]
    G -->|No| I[Token Refresh]

    I --> J{Refresh Success?}
    J -->|Yes| K[New Token]
    J -->|No| L[Redirect to Login]

    K --> H
```

### Data Protection Flow

```mermaid
graph TD
    A[User Data] --> B[Row Level Security]
    B --> C[User ID Validation]
    C --> D[Database Query]
    D --> E[RLS Policy Check]
    E --> F{Authorized?}

    F -->|Yes| G[Return Data]
    F -->|No| H[Access Denied]

    G --> I[Response Encryption]
    I --> J[Client Delivery]
```

## Monitoring and Analytics Data Flow

### Application Monitoring

```mermaid
graph TD
    A[User Interaction] --> B[Event Tracking]
    B --> C[Client Metrics]
    C --> D[Aggregation]
    D --> E[Analytics Service]

    A --> F[Error Tracking]
    F --> G[Error Reporting]
    G --> H[Alert System]

    E --> I[Dashboard Updates]
    H --> J[Developer Notification]
```

### Performance Monitoring

```mermaid
graph TD
    A[System Metrics] --> B[Performance Tracking]
    B --> C{Metric Type}

    C -->|Response Time| D[API Latency]
    C -->|Resource Usage| E[Server Metrics]
    C -->|User Experience| F[Core Web Vitals]

    D --> G[Performance Dashboard]
    E --> G
    F --> G

    G --> H[Alerting Rules]
    H --> I[Automated Scaling]
```

## Backup and Recovery Data Flow

### Data Backup

```mermaid
graph TD
    A[Scheduled Backup] --> B[Database Snapshot]
    B --> C[Incremental Backup]
    C --> D[Encryption]
    D --> E[Cloud Storage]
    E --> F[Backup Verification]
    F --> G[Retention Policy]
```

### Disaster Recovery

```mermaid
graph TD
    A[System Failure] --> B[Automatic Failover]
    B --> C[Backup Restoration]
    C --> D[Service Recovery]
    D --> E[Data Validation]
    E --> F[User Notification]
    F --> G[Normal Operations]
```

This data flow architecture ensures reliable, performant, and secure operation of the Cathcr platform while maintaining excellent user experience through real-time updates and intelligent background processing.