# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cathcr is an AI-powered thought capture and organization platform built as a monorepo with npm workspaces. The architecture consists of three main packages:

- `client/` - React 18 frontend with TypeScript, Vite, Tailwind CSS, Supabase client
- `server/` - Node.js/Express backend with TypeScript, Supabase integration, OpenAI API
- `shared/` - Common TypeScript types, utilities, and constants

## Essential Commands

### Development
- `npm run dev` - Start both client (port 3000) and server (port 5004) in development mode
- `npm run dev:client` - Start only frontend development server (port 3000)
- `npm run dev:server` - Start only backend development server (port 5004)
- `npm run dev:extension` - Start Chrome extension development server
- `npm run dev:all` - Start client, server, and extension concurrently

### Current Status (Updated)
- ✅ Client: Running on http://localhost:3000
- ✅ Server: Running on http://localhost:5004 with Supabase + AI integration
- ✅ Extension: Integrated in workspace with CRXJS dev server
- ✅ Dashboard: Real-time data integration with Supabase API complete
- ✅ Glass Components: Full orange acrylic system implemented
- ⚠️ Extension Build: TypeScript errors need fixing for production
- 🔧 Next: Performance optimization and Chrome Web Store preparation

### Building & Production
- `npm run build` - Build all packages for production (runs shared → client → server)
- `npm start` - Start production server (requires build first)

### Code Quality
- `npm run lint` - Run ESLint on all packages
- `npm run lint:fix` - Auto-fix linting issues across all packages
- `npm run format` - Format all code with Prettier
- `npm run typecheck` - Verify TypeScript types across all packages
- `npm run test` - Run tests across all packages

### Maintenance
- `npm run clean` - Clean all build artifacts and node_modules

## Architecture & Key Files

### Monorepo Structure
The project uses npm workspaces defined in root `package.json`. Each workspace has its own `package.json` with specific dependencies and scripts. The shared package at `@cathcr/shared` is referenced via TypeScript path mapping in `tsconfig.json`.

### AI Integration
Cathcr uses OpenAI GPT-4o-mini for thought categorization and Whisper for transcription. Key files:
- `server/src/services/aiService.ts` - AI categorization, transcription, and reminder extraction
- `client/src/services/transcription.ts` - Web Speech API integration and audio processing
- `shared/src/types/index.ts` - AI processing interfaces and types

### Database & Backend
Supabase provides authentication, database, and real-time features. Key files:
- `server/supabase-schema.sql` - Complete database schema with RLS policies
- `server/src/config/supabase.ts` - Supabase client configuration and utilities
- `server/src/types/database.ts` - Generated database types

### Frontend Architecture
Premium glassmorphism interface with React Bits, Shadcn UI, and beautiful animations:
- `client/src/components/CaptureModal.tsx` - Main thought capture interface with glass effects
- `client/src/components/ui/` - Shadcn UI components with glassmorphism styling
- `client/src/components/glass/` - Custom glass morphism component system
- `client/src/contexts/AuthContext.tsx` - Supabase authentication state
- `client/src/contexts/CaptureContext.tsx` - Thought capture and processing state
- `client/src/styles/` - Design system with SF Pro Compact Rounded font

## Development Workflow

1. **Environment Setup**:
   - Copy `server/.env.example` to `server/.env`
   - Configure Supabase URL, keys, and OpenAI API key
   - Copy `client/.env.example` to `client/.env` and configure Vite environment variables
   - Set up Supabase project and run schema from `server/supabase-schema.sql`

2. **Install Dependencies**: Run `npm install` from root (installs all workspaces)

3. **Start Development**: Use `npm run dev` to start both client and server

4. **Code Changes**: 
   - Shared types go in `shared/src/types/`
   - AI services in `server/src/services/`
   - Glass morphism components in `client/src/components/glass/`
   - React components in `client/src/components/`
   - Database operations in `server/src/config/supabase.ts`
   - Design system styles in `client/src/styles/`

5. **Development Tracking**: Check `MVP.md` for phase-based development progress

6. **Quality Checks**: Run `npm run lint` and `npm run typecheck` before committing

## Key Development Patterns

### State Management
- Client uses Zustand for local state and React Query for server state
- Authentication state managed via Supabase Auth and React Context
- Capture state managed via custom context with Web Speech API integration

### AI Processing Pipeline
- Real-time transcription via Web Speech API (client-side)
- Fallback to Whisper API for audio files (server-side)
- Background categorization via OpenAI GPT-4o-mini
- Natural language reminder extraction with chrono-node

### Database Operations
- Row Level Security (RLS) ensures data isolation
- Real-time subscriptions for processing status updates
- Full-text search with PostgreSQL trigrams
- Batch processing for AI operations

### Design System & UI
- **Typography**: SF Pro Compact Rounded font throughout the application
- **Color System**: AMOLED black backgrounds with blue-purple gradients
- **Component Library**: React Bits + Shadcn UI with heavy glassmorphism
- **Animations**: Framer Motion for smooth transitions and synth wave backgrounds
- **Glass Effects**: Backdrop-blur, translucent surfaces, liquid glass aesthetics
- **Layout**: Bento grid systems with scroll-based fade animations

### Global Shortcuts
- `Ctrl+Shift+C` - Global capture shortcut using react-hotkeys-hook
- `Ctrl+Enter` - Quick save in capture modal
- `Escape` - Cancel capture
- `Space` - Toggle voice recording

## Testing Strategy

- Server health check at `http://localhost:3001/health`
- AI processing can be tested with mock data
- Frontend components use React Testing Library
- End-to-end testing for capture workflow

## MVP Development Phases

The project follows a 7-phase development approach tracked in `MVP.md`:

1. **Phase 1**: Design System & Foundation (SF Pro font, glassmorphism, colors)
2. **Phase 2**: Core Layout & Navigation (translucent top bar, bento grids)
3. **Phase 3**: Authentication & User Flow (Supabase auth with glass design)
4. **Phase 4**: Voice Capture Interface (global shortcuts, waveform visualization)
5. **Phase 5**: AI Processing & Categorization (OpenAI integration with beautiful UX)
6. **Phase 6**: Dashboard & Thought Organization (bento grid dashboard)
7. **Phase 7**: Polish & Performance (animations, optimization)

## Common Issues

1. **Build errors**: Usually TypeScript-related. Run `npm run typecheck` to identify type errors
2. **Font loading**: SF Pro Compact Rounded requires proper font fallbacks and loading optimization
3. **Glassmorphism performance**: Backdrop-blur can impact performance on low-end devices
4. **Animation jank**: Ensure animations run at 60fps, use transform properties for best performance
5. **AI API failures**: Check OpenAI API key and rate limits. Fallback categorization available
6. **Supabase connection**: Verify URL and keys, check RLS policies for data access
7. **Audio permissions**: Web Speech API requires HTTPS and user permission
8. **Module resolution**: Clear node_modules and reinstall, verify `@cathcr/shared` paths in tsconfig.json

## Environment Variables Required

### Server (.env)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key for AI processing
- `OPENAI_ORGANIZATION` - OpenAI organization ID (optional)

### Client (.env)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_REDIRECT_URL` - OAuth redirect URL (optional, defaults to http://localhost:3000)