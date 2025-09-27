# Development Setup Guide

This guide will help you set up a complete development environment for Cathcr, including all dependencies, configuration, and tools needed for development.

## Prerequisites

### Required Software

**Node.js and npm**
- Node.js >= 18.0.0 (LTS recommended)
- npm >= 9.0.0 (comes with Node.js)

Check your versions:
```bash
node --version
npm --version
```

**Git**
- Git >= 2.20.0
- Configure with your username and email:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Code Editor**
- VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
  - ESLint

### External Service Accounts

**Supabase Account**
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

**OpenAI Account**
1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key from API keys section
3. Ensure you have credits for GPT-4o-mini and Whisper usage

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cathcr
```

### 2. Install Dependencies

Install all workspace dependencies:
```bash
npm install
```

This will install dependencies for all three packages (client, server, shared) automatically.

### 3. Environment Configuration

#### Server Environment Variables

Copy the server environment template:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORGANIZATION=your-org-id (optional)

# Development Settings
NODE_ENV=development
PORT=3001

# Security
JWT_SECRET=your-development-jwt-secret-min-32-chars
CORS_ORIGIN=http://localhost:3000
```

#### Client Environment Variables

Copy the client environment template:
```bash
cp client/.env.example client/.env
```

Edit `client/.env` with your configuration:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OAuth Configuration (optional)
VITE_REDIRECT_URL=http://localhost:3000

# Development Settings
VITE_NODE_ENV=development
```

### 4. Database Setup

#### Supabase Project Configuration

1. **Create Supabase Project**:
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project creation (2-3 minutes)

2. **Run Database Schema**:
   - Go to Supabase dashboard → SQL Editor
   - Copy contents from `server/supabase-schema.sql`
   - Execute the SQL to create tables and policies

3. **Configure Authentication**:
   - Go to Authentication → Settings
   - Enable email authentication
   - Configure OAuth providers (optional):
     - Google OAuth
     - GitHub OAuth
   - Set site URL to `http://localhost:3000`

4. **Enable Real-time**:
   - Go to Database → Replication
   - Enable real-time for `thoughts` and `processing_queue` tables

#### Database Schema Verification

Verify your database setup:
```sql
-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

Expected tables:
- `users`
- `thoughts`
- `categories`
- `processing_queue`
- `ai_processing_logs`
- `tags`
- `user_settings`

### 5. Development Tools Setup

#### TypeScript Configuration

Verify TypeScript is properly configured:
```bash
npm run typecheck
```

#### ESLint and Prettier

Verify code quality tools:
```bash
npm run lint
npm run format
```

#### Git Hooks (Optional)

Set up pre-commit hooks:
```bash
# Install husky for git hooks
npm install --save-dev husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run typecheck"
```

## Development Workflow

### 1. Start Development Servers

Start both client and server:
```bash
npm run dev
```

This will start:
- **Client**: http://localhost:3000 (Vite dev server)
- **Server**: http://localhost:3001 (Express server with tsx)

Or start individually:
```bash
# Client only
npm run dev:client

# Server only
npm run dev:server
```

### 2. Verify Setup

#### Check Server Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

#### Check Client Access
- Navigate to http://localhost:3000
- You should see the Cathcr login/welcome screen
- Check browser console for any errors

#### Test Authentication
1. Create a test account
2. Verify email verification (check Supabase Auth logs)
3. Test login/logout functionality

#### Test AI Integration
1. Create a test thought
2. Check server logs for AI processing
3. Verify OpenAI API calls in server console

### 3. Development Commands Reference

```bash
# Install dependencies
npm install

# Development
npm run dev              # Start both client and server
npm run dev:client       # Start client only
npm run dev:server       # Start server only

# Building
npm run build            # Build all packages
npm run build:client     # Build client only
npm run build:server     # Build server only
npm run build:shared     # Build shared package only

# Code Quality
npm run lint             # Run ESLint on all packages
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking

# Testing
npm run test             # Run tests (when implemented)

# Workspace Management
npm run clean            # Clean all build artifacts and node_modules
```

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### VS Code Extensions

Recommended extensions (create `.vscode/extensions.json`):
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000 or 3001
npx kill-port 3000
npx kill-port 3001

# Or find and kill manually
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

#### Module Resolution Errors
```bash
# Clear node_modules and reinstall
npm run clean
npm install

# Verify shared package builds
npm run build:shared
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npm run typecheck

# Rebuild shared package
npm run build:shared
```

#### Supabase Connection Issues
1. Verify environment variables in `.env` files
2. Check Supabase project URL and keys
3. Confirm database schema is properly set up
4. Check network connectivity to Supabase

#### OpenAI API Issues
1. Verify API key is correct and has credits
2. Check OpenAI API status
3. Review rate limits and usage
4. Confirm organization ID (if using)

### Development Tips

#### Hot Reload
- Client: Vite provides instant hot reload
- Server: tsx provides fast restart on changes
- Shared: Auto-rebuilds when dependencies change

#### Debugging
- **Client**: Use browser dev tools and React DevTools
- **Server**: Use VS Code debugger or console.log
- **Database**: Use Supabase dashboard for query testing

#### Performance
- Enable React Strict Mode for development
- Use React DevTools Profiler for performance analysis
- Monitor bundle size with Vite's build analyzer

### Next Steps

After completing setup:
1. Read [Development Workflow](./workflow.md) for day-to-day development practices
2. Review [Code Style Guide](./code-style.md) for coding standards
3. Check [Testing Strategy](./testing.md) for testing approaches
4. Explore [Monorepo Guide](./monorepo.md) for workspace management

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Git configured
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] OpenAI API key set up
- [ ] Development servers started (`npm run dev`)
- [ ] Health checks passed
- [ ] Test authentication working
- [ ] AI processing functional

Once all items are checked, you're ready for development!