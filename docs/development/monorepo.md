# Monorepo Management Guide

This guide covers working with Cathcr's monorepo structure using npm workspaces, including dependency management, development workflows, and best practices.

## Monorepo Structure

### Workspace Overview

```
cathcr/
├── package.json              # Root workspace configuration
├── client/                   # Frontend React application
│   ├── package.json
│   └── src/
├── server/                   # Backend Node.js application
│   ├── package.json
│   └── src/
├── shared/                   # Shared types and utilities
│   ├── package.json
│   └── src/
└── docs/                     # Documentation (not a workspace)
```

### Workspace Configuration

#### Root package.json
```json
{
  "name": "cathcr",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "npm run dev --workspace=client",
    "dev:server": "npm run dev --workspace=server",
    "build": "npm run build:shared && npm run build:client && npm run build:server",
    "build:client": "npm run build --workspace=client",
    "build:server": "npm run build --workspace=server",
    "build:shared": "npm run build --workspace=shared"
  }
}
```

## Workspace Dependencies

### Dependency Types

#### Internal Dependencies
Workspaces can depend on each other using workspace protocol:

```json
// client/package.json
{
  "dependencies": {
    "@cathcr/shared": "workspace:*"
  }
}

// server/package.json
{
  "dependencies": {
    "@cathcr/shared": "workspace:*"
  }
}
```

#### External Dependencies
Each workspace manages its own external dependencies:

```json
// client/package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^4.0.0"
  }
}

// server/package.json
{
  "dependencies": {
    "express": "^4.18.0",
    "@supabase/supabase-js": "^2.0.0",
    "openai": "^4.0.0"
  }
}
```

### Dependency Management Commands

#### Installing Dependencies

```bash
# Install dependencies for all workspaces
npm install

# Install dependency for specific workspace
npm install react --workspace=client
npm install express --workspace=server

# Install dev dependency for specific workspace
npm install -D @types/node --workspace=server

# Install dependency for root workspace
npm install -D concurrently
```

#### Managing Shared Dependencies

```bash
# Add shared dependency to multiple workspaces
npm install lodash --workspace=client --workspace=server

# Update shared package across workspaces
npm run build:shared

# Check which workspaces use a dependency
npm ls react --workspaces
```

## Working with Shared Package

### Shared Package Structure

```
shared/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main export file
│   ├── types/
│   │   ├── index.ts          # Type definitions
│   │   ├── api.ts            # API types
│   │   ├── database.ts       # Database types
│   │   └── ui.ts             # UI component types
│   ├── utils/
│   │   ├── index.ts          # Utility functions
│   │   ├── validation.ts     # Validation utilities
│   │   └── constants.ts      # Shared constants
│   └── schemas/
│       ├── index.ts          # Validation schemas
│       └── thought.ts        # Thought-related schemas
└── dist/                     # Build output
```

### Building Shared Package

#### TypeScript Configuration
```json
// shared/tsconfig.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "references": []
}
```

#### Build Script
```json
// shared/package.json
{
  "name": "@cathcr/shared",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rimraf dist"
  }
}
```

### Using Shared Package

#### Importing Types
```typescript
// client/src/components/ThoughtCard.tsx
import type { Thought, Category } from '@cathcr/shared';

interface ThoughtCardProps {
  thought: Thought;
  category?: Category;
}
```

#### Importing Utilities
```typescript
// server/src/routes/thoughts.ts
import { validateThought, ThoughtSchema } from '@cathcr/shared';

router.post('/thoughts', (req, res) => {
  const validatedData = validateThought(req.body);
  // ...
});
```

#### Importing Constants
```typescript
// client/src/services/api.ts
import { API_ENDPOINTS, HTTP_STATUS } from '@cathcr/shared';

const fetchThoughts = async () => {
  const response = await fetch(API_ENDPOINTS.THOUGHTS);
  if (response.status === HTTP_STATUS.OK) {
    return response.json();
  }
};
```

## Development Workflows

### Starting Development

#### Full Development Environment
```bash
# Start all services
npm run dev

# This runs concurrently:
# - Client dev server (Vite) on port 3000
# - Server dev server (tsx) on port 3001
# - Shared package watcher (TypeScript)
```

#### Individual Services
```bash
# Start only client
npm run dev:client

# Start only server
npm run dev:server

# Build shared package and watch for changes
npm run dev --workspace=shared
```

### Making Changes Across Workspaces

#### Workflow Example: Adding New Feature

1. **Define Types in Shared Package**:
```typescript
// shared/src/types/reminder.ts
export interface Reminder {
  id: string;
  thought_id: string;
  reminder_date: string;
  completed: boolean;
  created_at: string;
}

export interface CreateReminderRequest {
  thought_id: string;
  reminder_date: string;
}
```

2. **Build Shared Package**:
```bash
npm run build:shared
```

3. **Implement Server Logic**:
```typescript
// server/src/routes/reminders.ts
import { CreateReminderRequest, Reminder } from '@cathcr/shared';

router.post('/reminders', async (req: Request, res: Response) => {
  const data: CreateReminderRequest = req.body;
  // Implementation...
});
```

4. **Create Client Components**:
```typescript
// client/src/components/ReminderCard.tsx
import { Reminder } from '@cathcr/shared';

interface ReminderCardProps {
  reminder: Reminder;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ reminder }) => {
  // Implementation...
};
```

### Hot Reloading and Watch Mode

#### Automatic Recompilation
```bash
# Shared package auto-rebuilds on changes
npm run dev --workspace=shared

# Client hot-reloads when shared package changes
npm run dev:client

# Server restarts when shared package changes
npm run dev:server
```

#### TypeScript Project References
```json
// tsconfig.json (root)
{
  "references": [
    { "path": "./shared" },
    { "path": "./client" },
    { "path": "./server" }
  ]
}

// client/tsconfig.json
{
  "references": [
    { "path": "../shared" }
  ]
}
```

## Build and Deployment

### Build Order

The build process must respect dependency order:

```bash
# 1. Build shared package first
npm run build:shared

# 2. Build client and server (can be parallel)
npm run build:client & npm run build:server

# Or use the combined build command
npm run build
```

#### Build Script Implementation
```json
// package.json (root)
{
  "scripts": {
    "build": "npm run build:shared && concurrently \"npm run build:client\" \"npm run build:server\"",
    "build:shared": "npm run build --workspace=shared",
    "build:client": "npm run build --workspace=client",
    "build:server": "npm run build --workspace=server"
  }
}
```

### Production Builds

#### Optimized Build Configuration
```bash
# Clean builds for production
npm run clean
npm ci --production=false
npm run build

# Verify builds
npm run start
```

#### Package Size Analysis
```bash
# Analyze client bundle size
npm run build:client
npm run analyze --workspace=client

# Check server bundle size
npm run build:server
du -sh server/dist
```

## Dependency Resolution

### Hoisting Behavior

npm workspaces automatically hoists compatible dependencies:

```
node_modules/
├── react/                    # Hoisted to root
├── express/                  # Hoisted to root
├── typescript/               # Hoisted to root
└── @types/
    └── node/                 # Hoisted to root

client/node_modules/          # Workspace-specific dependencies
server/node_modules/          # Workspace-specific dependencies
shared/node_modules/          # Workspace-specific dependencies
```

### Version Conflicts

#### Resolving Version Conflicts
```json
// package.json (root)
{
  "overrides": {
    "typescript": "^5.0.0"
  }
}
```

#### Checking Dependency Trees
```bash
# View dependency tree for all workspaces
npm ls --workspaces

# View dependency tree for specific workspace
npm ls --workspace=client

# Find duplicate dependencies
npm dedupe
```

## Testing Across Workspaces

### Running Tests

```bash
# Run tests for all workspaces
npm run test --workspaces

# Run tests for specific workspace
npm run test --workspace=client

# Run integration tests across workspaces
npm run test:integration
```

### Test Dependencies

#### Shared Test Utilities
```typescript
// shared/src/test-utils/index.ts
export { mockThought } from './mockData';
export { setupTestEnvironment } from './setup';
export { createTestUser } from './auth';
```

#### Using in Tests
```typescript
// client/src/__tests__/ThoughtCard.test.tsx
import { mockThought } from '@cathcr/shared/test-utils';

test('renders thought card', () => {
  render(<ThoughtCard thought={mockThought} />);
});
```

## Scripts and Automation

### Workspace Scripts

#### Parallel Execution
```json
{
  "scripts": {
    "lint": "npm run lint --workspaces",
    "typecheck": "npm run typecheck --workspaces",
    "format": "prettier --write . --ignore-path .gitignore"
  }
}
```

#### Sequential Execution
```json
{
  "scripts": {
    "build": "npm run build:shared && npm run build:client && npm run build:server",
    "deploy": "npm run build && npm run test && npm run deploy:production"
  }
}
```

### Custom Scripts

#### Workspace Management
```bash
#!/bin/bash
# scripts/workspace-status.sh

echo "=== Workspace Status ==="
for workspace in client server shared; do
  echo "--- $workspace ---"
  npm run typecheck --workspace=$workspace
  npm run lint --workspace=$workspace
  echo ""
done
```

#### Dependency Updates
```bash
#!/bin/bash
# scripts/update-deps.sh

echo "Updating dependencies..."
npm update --workspaces
npm audit fix --workspaces
npm run build
npm run test
```

## Troubleshooting

### Common Issues

#### Module Resolution
```bash
# Clear all node_modules and reinstall
npm run clean
rm -rf node_modules
npm install
```

#### TypeScript Issues
```bash
# Rebuild shared package
npm run build:shared

# Clear TypeScript cache
npx tsc --build --clean
npm run typecheck
```

#### Circular Dependencies
```bash
# Analyze dependency graph
npm ls --depth=0 --workspaces

# Check for circular references
madge --circular client/src server/src
```

### Performance Optimization

#### Build Performance
```bash
# Use TypeScript incremental builds
npm run build:shared -- --incremental

# Parallel builds where possible
npm run build:client & npm run build:server
```

#### Development Performance
```bash
# Use workspace-specific commands when possible
npm run dev --workspace=client  # Instead of npm run dev

# Selective TypeScript compilation
npm run typecheck --workspace=shared  # Check only changed workspace
```

## Best Practices

### Workspace Organization

1. **Clear Separation**: Keep workspace responsibilities clear
2. **Minimal Dependencies**: Only include necessary dependencies
3. **Consistent Structure**: Follow same patterns across workspaces
4. **Documentation**: Document workspace-specific setup and usage

### Dependency Management

1. **Version Alignment**: Keep shared dependencies in sync
2. **Regular Updates**: Update dependencies regularly and test
3. **Security Audits**: Run `npm audit` regularly
4. **Bundle Analysis**: Monitor bundle sizes and dependencies

### Development Workflow

1. **Incremental Development**: Make small, focused changes
2. **Test Early**: Run tests frequently during development
3. **Build Verification**: Verify builds work before committing
4. **Documentation**: Keep documentation updated with changes

This monorepo management approach ensures efficient development while maintaining clear separation of concerns and consistent dependency management across the Cathcr platform.