# CATHCR Development Guide

This guide provides detailed information for developers working on the CATHCR project.

## 🏗️ Project Architecture

CATHCR is built as a modern monorepo using npm workspaces with four main packages:

### Client Package (`@cathcr/client`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **Typography**: Apple System Fonts (SF Pro Text, SF Pro Display, SF Compact Rounded)
- **State Management**: Zustand for local state, React Query for server state
- **Authentication**: Supabase Auth with React Context
- **Real-time**: Supabase subscriptions and Socket.IO client
- **AI Integration**: Web Speech API with fallback transcription chain

### Server Package (`@cathcr/server`)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **AI Services**: OpenAI GPT-4o and HuggingFace Whisper integration
- **Authentication**: JWT tokens with Supabase integration
- **Real-time**: Socket.IO server for live updates
- **Security**: Helmet, CORS, rate limiting, input validation

### Extension Package (`@cathcr/extension`)
- **Architecture**: Chrome Manifest V3 with TypeScript
- **Build Tool**: CRXJS Vite plugin with hot reloading
- **Background**: Modern Service Worker with sync capabilities
- **Content Scripts**: Modal injection with keyboard shortcuts
- **Popup Interface**: Quick capture with voice recording
- **Options Page**: Comprehensive settings and account management
- **Authentication**: JWT-based extension auth with account linking

### Shared Package (`@cathcr/shared`)
- **Purpose**: Common types, utilities, constants, and validation
- **AI Constants**: Model configurations and fallback chains
- **WCAG Utilities**: Color contrast validation and accessibility helpers
- **Build**: TypeScript compilation to CommonJS/ESM

## 🛠️ Development Setup

### Initial Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd cathcr
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Server configuration
   cp server/.env.example server/.env
   ```

   Update the `server/.env` file:
   ```env
   PORT=3001
   NODE_ENV=development

   # Supabase Configuration
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # AI Services
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_ORGANIZATION=your-openai-org-id
   HUGGINGFACE_TOKEN=your-huggingface-token

   # Security
   JWT_SECRET=your-development-secret
   CORS_ORIGIN=http://localhost:3000
   ```

   ```bash
   # Client configuration
   cp client/.env.example client/.env
   ```

   Update the `client/.env` file:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_REDIRECT_URL=http://localhost:3000
   ```

3. **Database setup**:
   ```bash
   # 1. Create a new Supabase project
   # 2. Run server/supabase-schema.sql in Supabase SQL Editor
   # 3. Run server/extension-schema.sql for extension support
   # 4. Configure Row-Level Security policies
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

### Development Workflow

1. **Code Organization**:
   - Put shared types in `shared/src/types/`
   - Add server logic in `server/src/`
   - Create client components in `client/src/components/`
   - Extension code in `extension/src/`
   - AI services in `server/src/services/`
   - Design system in `client/src/styles/`

2. **Making Changes**:
   ```bash
   # Make your changes
   npm run lint        # Check for linting errors
   npm run typecheck   # Verify TypeScript types
   npm run format      # Format code with Prettier
   npm run test        # Run all tests
   ```

3. **Testing Changes**:
   - Client: http://localhost:3000
   - Server: http://localhost:3001
   - Health check: http://localhost:3001/health
   - Extension: Load unpacked from `extension/dist/`

## 📁 Detailed File Structure

```
cathcr/
├── package.json              # Root package.json (workspace configuration)
├── tsconfig.json            # Base TypeScript configuration
├── .eslintrc.js             # Base ESLint configuration
├── .prettierrc              # Prettier configuration
├── .gitignore               # Git ignore rules
├── README.md                # Project documentation
│
├── client/
│   ├── package.json         # Client-specific dependencies
│   ├── tsconfig.json        # Client TypeScript config
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── index.html           # HTML entry point
│   ├── public/              # Static assets
│   └── src/
│       ├── main.tsx         # React entry point
│       ├── App.tsx          # Root App component
│       ├── index.css        # Global styles with Apple fonts
│       ├── components/      # Reusable UI components
│       │   ├── ui/          # Shadcn UI components
│       │   ├── glass/       # Glassmorphism components
│       │   ├── CaptureModal.tsx
│       │   ├── Dashboard.tsx
│       │   └── Layout.tsx
│       ├── pages/           # Route components
│       │   ├── HomePage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── LoginPage.tsx
│       │   └── SettingsPage.tsx
│       ├── contexts/        # React contexts
│       │   ├── AuthContext.tsx
│       │   ├── CaptureContext.tsx
│       │   └── ThemeContext.tsx
│       ├── hooks/           # Custom React hooks
│       ├── services/        # API service functions
│       │   ├── api.ts
│       │   ├── transcription.ts
│       │   └── supabase.ts
│       ├── utils/           # Client utilities
│       │   ├── constants.ts
│       │   ├── wcagCompliance.ts
│       │   └── helpers.ts
│       ├── styles/          # Design system
│       │   ├── globals.css
│       │   ├── components.css
│       │   └── animations.css
│       └── types/           # Client-specific types
│
├── server/
│   ├── package.json         # Server-specific dependencies
│   ├── tsconfig.json        # Server TypeScript config
│   ├── .env.example         # Environment variables template
│   ├── supabase-schema.sql  # Main database schema
│   ├── extension-schema.sql # Extension-specific schema
│   └── src/
│       ├── index.ts         # Server entry point
│       ├── controllers/     # Request handlers
│       │   ├── authController.ts
│       │   ├── captureController.ts
│       │   └── transcriptionController.ts
│       ├── routes/          # Express routes
│       │   ├── auth.ts
│       │   ├── capture.ts
│       │   ├── transcription.ts
│       │   ├── rooms.ts
│       │   └── extension.ts
│       ├── middleware/      # Express middleware
│       │   ├── errorHandler.ts
│       │   ├── auth.ts
│       │   └── rateLimit.ts
│       ├── services/        # Business logic
│       │   ├── aiService.ts
│       │   ├── transcriptionService.ts
│       │   ├── huggingfaceService.ts
│       │   ├── socketService.ts
│       │   └── queueService.ts
│       ├── config/          # Configuration
│       │   ├── supabase.ts
│       │   └── storage.ts
│       ├── workers/         # Background workers
│       │   └── aiWorker.ts
│       ├── utils/           # Server utilities
│       └── types/           # Server-specific types
│
├── extension/
│   ├── package.json         # Extension-specific dependencies
│   ├── tsconfig.json        # Extension TypeScript config
│   ├── vite.config.ts       # CRXJS Vite configuration
│   ├── public/              # Extension assets (icons, etc.)
│   └── src/
│       ├── manifest.ts      # Chrome extension manifest
│       ├── background/      # Service worker scripts
│       │   ├── index.ts     # Main background script
│       │   ├── sync.ts      # Sync service
│       │   ├── storage.ts   # Storage management
│       │   └── notifications.ts
│       ├── content/         # Content scripts
│       │   ├── index.ts     # Content script entry
│       │   └── styles.css   # Content script styles
│       ├── popup/           # Extension popup
│       │   ├── index.html
│       │   ├── index.ts
│       │   └── styles.css
│       ├── options/         # Options page
│       │   ├── index.html
│       │   ├── index.ts
│       │   └── styles.css
│       └── types/           # Extension-specific types
│           └── index.ts
│
└── shared/
    ├── package.json         # Shared package config
    ├── tsconfig.json        # Shared TypeScript config
    └── src/
        ├── index.ts         # Package entry point
        ├── types/           # Shared TypeScript types
        │   └── index.ts
        └── utils/           # Shared utilities
            ├── constants.ts
            ├── validation.ts
            ├── wcagCompliance.ts
            └── helpers.ts
```

## 🔧 Key Development Commands

### Workspace Commands
```bash
# Install dependencies for all workspaces
npm install

# Run a command in a specific workspace
npm run <script> --workspace=<workspace-name>

# Examples:
npm run dev --workspace=client
npm run build --workspace=server
npm run lint --workspace=extension
```

### Development Commands
```bash
# Start all services (client, server, extension dev)
npm run dev

# Start individual services
npm run dev:client     # React app on port 3000
npm run dev:server     # Express server on port 3001
npm run dev:extension  # Extension development mode

# Build everything for production
npm run build

# Build individual packages
npm run build:client
npm run build:server
npm run build:extension

# Code quality
npm run lint           # Lint all packages
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format all code
npm run typecheck      # Type check all packages

# Testing
npm run test           # Run all tests
npm run test:client    # Client tests only
npm run test:server    # Server tests only
npm run test:extension # Extension tests only
```

### Extension-Specific Commands
```bash
cd extension

# Development with hot reloading
npm run dev

# Production build for Chrome Web Store
npm run build

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run lint:fix
```

## 🔍 Code Standards

### TypeScript Guidelines
- Always use strict mode with comprehensive type coverage
- Prefer `interface` over `type` for object shapes
- Use proper return types for functions
- Avoid `any` - use proper typing or `unknown`
- Use generics for reusable code
- Document complex types with JSDoc comments

### React Guidelines
- Use functional components with hooks
- Implement proper TypeScript for props with documentation
- Use React.FC sparingly, prefer explicit return types
- Handle loading, error, and success states consistently
- Use proper key props in lists
- Implement proper accessibility attributes
- Follow the glassmorphism design system

### Extension Guidelines
- Use Manifest V3 best practices
- Implement proper content security policies
- Handle permissions gracefully
- Use modern web APIs (async/await, modules)
- Implement proper error boundaries
- Follow Chrome extension security guidelines

### AI Integration Guidelines
- Always implement fallback chains for AI services
- Include confidence scores for AI-generated content
- Handle rate limiting and API failures gracefully
- Validate AI outputs before displaying to users
- Implement proper caching for expensive operations
- Follow WCAG guidelines for AI-generated content

### Database Guidelines
- Use Row-Level Security (RLS) for all tables
- Implement proper data validation at database level
- Use database functions for complex operations
- Handle migrations with proper versioning
- Implement proper indexes for performance
- Follow PostgreSQL best practices

## 🎨 Design System Standards

### Typography
- **Primary**: SF Pro Text, SF Pro Display
- **Code**: SF Mono, Monaco, Cascadia Code
- **Rounded**: SF Compact Rounded for playful elements
- **Fallbacks**: System fonts with proper stacking

### Color System
- **Orange Theme**: WCAG AAA compliant orange palette
- **Backgrounds**: AMOLED black with glassmorphism overlays
- **Contrast Ratios**: Verified AA/AAA compliance
- **Dark Mode**: Default with light mode option

### Glassmorphism Components
- **Backdrop Blur**: Use `backdrop-blur-md` consistently
- **Transparency**: 10-20% opacity for glass surfaces
- **Borders**: Subtle borders with gradient overlays
- **Shadows**: Soft, elevated shadows for depth

## 🐛 Debugging

### Client Debugging
- Use browser dev tools with React Developer Tools
- Monitor network tab for API calls
- Check Web Speech API permissions and status
- Debug Supabase real-time subscriptions
- Test glassmorphism performance on various devices

### Server Debugging
- Check server console logs with structured logging
- Use `tsx --inspect` for Node.js debugging
- Monitor AI service API calls and responses
- Check Supabase database logs and queries
- Verify environment variables and configurations

### Extension Debugging
- Use Chrome Developer Tools for extensions
- Check background script console in `chrome://extensions/`
- Monitor content script injection and messaging
- Test permission grants and API access
- Verify manifest configuration and CSP

### Common Issues

1. **AI Service Failures**:
   - Check API keys and rate limits
   - Verify fallback chain configuration
   - Monitor confidence scores and error rates

2. **Extension Loading Issues**:
   - Verify manifest.json configuration
   - Check content security policy settings
   - Ensure proper permission declarations

3. **Database Connection Problems**:
   - Verify Supabase URL and keys
   - Check Row-Level Security policies
   - Monitor database connection pool

4. **Typography Issues**:
   - Ensure Apple fonts are properly loaded
   - Check font fallback chain
   - Verify font licensing for distribution

## 🧪 Testing Strategy

### Current Testing Setup
- **Unit Tests**: Jest for utilities and pure functions
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: API endpoint testing with Supertest
- **Extension Tests**: Chrome extension testing framework
- **AI Tests**: Mock AI services for consistent testing

### Testing Best Practices
- Test AI fallback chains with mocked services
- Verify accessibility compliance in all components
- Test extension functionality across Chrome versions
- Validate WCAG compliance with automated tools
- Test offline functionality and sync resolution

## 🚀 Deployment Considerations

### Build Process
```bash
# Build all packages for production
npm run build

# Verify builds
npm run start  # Should start production server
```

### Environment Setup
- Set NODE_ENV=production
- Configure proper JWT secrets and API keys
- Set correct CORS origins for production domains
- Configure Supabase production instance
- Set up proper logging and monitoring

### Performance Optimization
- Client build includes tree shaking and code splitting
- Server uses Express.js with compression middleware
- Extension uses CRXJS optimizations
- AI services implement proper caching strategies
- Database queries use proper indexing

### Security Checklist
- Verify all API keys are properly secured
- Enable HTTPS/TLS for all communications
- Configure proper CORS policies
- Implement rate limiting on all endpoints
- Verify extension CSP and permissions
- Enable Supabase Row-Level Security

## 🤝 Contributing Guidelines

1. **Branch Naming**:
   - `feature/description` - New features
   - `fix/description` - Bug fixes
   - `refactor/description` - Code refactoring
   - `docs/description` - Documentation updates

2. **Commit Messages**:
   - Use conventional commits format
   - Include scope when relevant (client, server, extension)
   - Be descriptive but concise

3. **Pull Requests**:
   - Include description of changes and reasoning
   - Add tests for new functionality
   - Ensure all checks pass (lint, typecheck, tests)
   - Update documentation as needed
   - Request review from maintainers

4. **Code Review Checklist**:
   - Verify TypeScript types and documentation
   - Check error handling and edge cases
   - Test functionality manually
   - Review performance impact
   - Validate accessibility compliance
   - Ensure security best practices

## 📊 Development Phases

### Phase 4 (Complete): Integration & Launch Preparation
- ✅ Apple System Fonts implementation
- ✅ OpenAI GPT-4o integration
- ✅ HuggingFace Whisper transcription
- ✅ WCAG AAA compliance
- ✅ Chrome Extension with CRXJS
- ✅ Extension-to-server sync
- ✅ Production-ready architecture

### Phase 5 (Planning): Advanced AI Intelligence
- 🚧 Enhanced thought pattern analysis
- 🚧 Predictive suggestion engine
- 🚧 Knowledge graph generation
- 🚧 Advanced voice intelligence
- 🚧 Cross-platform mobile apps

For detailed phase information, see [MVP.md](./MVP.md).

## 🔗 Related Documentation

- [API Documentation](./API.md) - Complete REST API reference
- [Extension Guide](./EXTENSION.md) - Chrome extension development
- [Design System](./DESIGN.md) - UI components and styling
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [MVP Phases](./MVP.md) - Development roadmap and progress