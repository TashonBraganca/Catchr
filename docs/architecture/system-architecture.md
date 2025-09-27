# System Architecture

Cathcr is an AI-powered thought capture and organization platform built with a modern microservices architecture using a monorepo approach with npm workspaces.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CATHCR PLATFORM                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React 18 + Vite)  │  Backend (Node.js + Express) │
│  ┌─────────────────────────┐  │  ┌─────────────────────────┐ │
│  │ Glass UI Components     │  │  │ AI Service Layer        │ │
│  │ Voice Capture Interface │  │  │ Authentication API      │ │
│  │ Real-time Updates       │  │  │ Thought Processing      │ │
│  │ Search & Organization   │  │  │ WebSocket Handler       │ │
│  └─────────────────────────┘  │  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    SHARED TYPES & UTILITIES                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ TypeScript Interfaces │ Constants │ Validation Utils    │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │ Supabase     │ │ OpenAI       │ │ Web Speech API       │  │
│  │ - Database   │ │ - GPT-4o-mini│ │ - Real-time Speech   │  │
│  │ - Auth       │ │ - Whisper    │ │ - Browser Integration│  │
│  │ - Real-time  │ │ - Embeddings │ │                      │  │
│  │ - Storage    │ │              │ │                      │  │
│  └──────────────┘ └──────────────┘ └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

Cathcr uses npm workspaces to organize code into three main packages:

### Client Package (`@cathcr/client`)
**Location**: `client/`
**Purpose**: React-based frontend with glassmorphism UI

**Key Technologies**:
- React 18 with TypeScript
- Vite (build tool and dev server)
- Tailwind CSS with custom glassmorphism utilities
- Framer Motion (animations)
- React Query (server state management)
- Zustand (client state management)
- react-hotkeys-hook (global shortcuts)

**Architecture Patterns**:
- Component-driven development with atomic design
- Custom hooks for business logic
- Context providers for global state
- Service layer for API communication

### Server Package (`@cathcr/server`)
**Location**: `server/`
**Purpose**: Node.js backend with AI processing capabilities

**Key Technologies**:
- Node.js with TypeScript
- Express.js (web framework)
- Supabase (backend-as-a-service)
- OpenAI API (AI processing)
- chrono-node (natural language date parsing)

**Architecture Patterns**:
- Layered architecture (routes → services → utilities)
- Dependency injection for external services
- Middleware-based request processing
- Event-driven AI processing pipeline

### Shared Package (`@cathcr/shared`)
**Location**: `shared/`
**Purpose**: Common types, utilities, and constants

**Key Technologies**:
- TypeScript (strict type definitions)
- Build system for multiple output formats

**Architecture Patterns**:
- Domain-driven type definitions
- Utility functions with pure functional approach
- Constants and configuration shared across packages

## Communication Patterns

### Client-Server Communication
1. **HTTP REST API**: Standard CRUD operations
2. **WebSocket/Real-time**: Live updates via Supabase real-time subscriptions
3. **File Upload**: Audio file processing for transcription

### AI Processing Pipeline
1. **Voice Input**: Web Speech API (client) → Text transcription
2. **Audio Fallback**: Audio file → Whisper API → Text transcription
3. **Text Processing**: OpenAI GPT-4o-mini → Categorization + Entity extraction
4. **Date Parsing**: chrono-node → Reminder scheduling

### State Management Flow
```
User Input → Client State → Server API → Database → Real-time Updates → Client State
                ↓
           AI Processing Queue → Background Jobs → Database Updates
```

## Security Architecture

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security (RLS)**: Database-level access control
- **Client-side Protection**: Route guards and component-level auth checks

### Data Security
- **Encryption in Transit**: HTTPS for all communications
- **Encryption at Rest**: Supabase handles database encryption
- **Privacy**: Audio processed and discarded, only text stored
- **API Security**: Rate limiting and input validation

## Scalability Considerations

### Horizontal Scaling
- **Stateless Server**: No server-side session storage
- **Database Scaling**: Supabase handles PostgreSQL scaling
- **CDN Integration**: Static assets served via CDN

### Performance Optimization
- **Client-side**: Code splitting, lazy loading, memoization
- **Server-side**: Connection pooling, caching strategies
- **AI Processing**: Batch processing and queue management

## Development Architecture

### Build System
- **Monorepo Management**: npm workspaces
- **Type Safety**: Shared TypeScript configurations
- **Code Quality**: ESLint, Prettier, TypeScript compiler
- **Development Experience**: Hot reload, fast refresh

### Deployment Pipeline
```
Code Changes → Type Check → Lint → Build → Test → Deploy
     ↓
Workspace Dependencies → Shared Package Build → Client/Server Build
```

## External Dependencies

### Core Infrastructure
- **Supabase**: PostgreSQL database, authentication, real-time subscriptions
- **Vercel/Netlify**: Frontend hosting and deployment
- **Railway/Render**: Backend hosting options

### AI & Processing
- **OpenAI API**: GPT-4o-mini for categorization, Whisper for transcription
- **Web Speech API**: Browser-native speech recognition
- **chrono-node**: Natural language date/time parsing

### UI & Experience
- **Tailwind CSS**: Utility-first styling framework
- **Framer Motion**: Animation library
- **React Query**: Server state management
- **Radix UI**: Accessible component primitives

## Performance Characteristics

### Client Performance
- **Initial Load**: < 3 seconds on 3G connection
- **Interaction Response**: < 100ms for UI interactions
- **Animation Performance**: 60fps for all animations
- **Bundle Size**: < 1MB gzipped for initial bundle

### Server Performance
- **API Response Time**: < 200ms for standard operations
- **AI Processing**: 2-5 seconds for thought categorization
- **Real-time Updates**: < 100ms latency
- **Concurrent Users**: Designed for 1000+ concurrent users

## Error Handling & Resilience

### Client-side Resilience
- **Offline Support**: Service worker for offline functionality
- **Error Boundaries**: React error boundaries for graceful failures
- **Retry Logic**: Automatic retry for failed API calls
- **Graceful Degradation**: Fallback UI states for failures

### Server-side Resilience
- **Circuit Breakers**: Protection against cascading failures
- **Rate Limiting**: DDoS protection and resource management
- **Health Checks**: Monitoring endpoints for system health
- **Graceful Shutdown**: Proper cleanup on server termination

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Client and server error reporting
- **Performance Monitoring**: Core Web Vitals and API response times
- **User Analytics**: Feature usage and user behavior
- **AI Processing Metrics**: Success rates and processing times

### Infrastructure Monitoring
- **Server Health**: CPU, memory, and network monitoring
- **Database Performance**: Query performance and connection pooling
- **External Service Health**: OpenAI API and Supabase status
- **Real-time Metrics**: WebSocket connection health