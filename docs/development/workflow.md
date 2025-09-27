# Development Workflow

This document outlines the day-to-day development workflow for the Cathcr project, including best practices, code organization, and collaboration guidelines.

## Daily Development Workflow

### 1. Start Development Session

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Start development servers
npm run dev
```

### 2. Feature Development Cycle

#### Create Feature Branch
```bash
git checkout -b feature/description-of-feature
```

#### Make Changes
1. **Plan Your Changes**: Review MVP.md for current phase priorities
2. **Update Types First**: Add any new types to `shared/src/types/`
3. **Implement Backend**: Add server logic in `server/src/services/`
4. **Build Frontend**: Create components in `client/src/components/`
5. **Test Integration**: Verify end-to-end functionality

#### Quality Checks
```bash
# Type check all packages
npm run typecheck

# Lint and format code
npm run lint
npm run format

# Build to verify no errors
npm run build
```

### 3. End Development Session

```bash
# Commit changes
git add .
git commit -m "feat: add feature description"

# Push to remote
git push origin feature/description-of-feature
```

## Code Organization Patterns

### Monorepo Structure Workflow

```
cathcr/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Common types and utilities
└── docs/            # Documentation
```

#### Working with Shared Package

**When to update shared:**
- Adding new TypeScript interfaces
- Creating utility functions used by multiple packages
- Defining constants used across client and server

**Workflow:**
```bash
# 1. Make changes to shared/src/
# 2. Build shared package
npm run build:shared

# 3. Changes automatically available to client and server
# 4. Import in client or server
import { ThoughtType } from '@cathcr/shared';
```

#### Cross-Package Dependencies

```typescript
// In client/src/components/ThoughtCard.tsx
import { Thought, Category } from '@cathcr/shared';

// In server/src/services/aiService.ts
import { ThoughtProcessingQueue } from '@cathcr/shared';
```

### Component Development Workflow

#### 1. Planning Phase
- Check existing components in `client/src/components/`
- Review design system in `client/src/components/glass/`
- Plan component props and state

#### 2. Component Creation
```typescript
// client/src/components/ThoughtCard.tsx
import React from 'react';
import { Thought } from '@cathcr/shared';
import { GlassCard } from './glass/GlassCard';

interface ThoughtCardProps {
  thought: Thought;
  onEdit?: (thought: Thought) => void;
  onDelete?: (id: string) => void;
}

export const ThoughtCard: React.FC<ThoughtCardProps> = ({
  thought,
  onEdit,
  onDelete
}) => {
  return (
    <GlassCard className="p-4">
      {/* Component implementation */}
    </GlassCard>
  );
};
```

#### 3. Integration
- Add to parent components
- Update routing if needed
- Add to component exports

### API Development Workflow

#### 1. Define Types First
```typescript
// shared/src/types/api.ts
export interface CreateThoughtRequest {
  content: string;
  category?: string;
  tags?: string[];
}

export interface CreateThoughtResponse {
  thought: Thought;
  processingStatus: ProcessingStatus;
}
```

#### 2. Implement Server Endpoint
```typescript
// server/src/routes/thoughts.ts
import { CreateThoughtRequest, CreateThoughtResponse } from '@cathcr/shared';

router.post('/thoughts', async (req: Request, res: Response) => {
  const { content, category, tags }: CreateThoughtRequest = req.body;

  // Implementation
  const response: CreateThoughtResponse = {
    thought: newThought,
    processingStatus: queueStatus
  };

  res.json(response);
});
```

#### 3. Create Client Service
```typescript
// client/src/services/thoughtsApi.ts
import { CreateThoughtRequest, CreateThoughtResponse } from '@cathcr/shared';

export const thoughtsApi = {
  create: async (data: CreateThoughtRequest): Promise<CreateThoughtResponse> => {
    const response = await fetch('/api/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

## Feature Development Guidelines

### Adding New Features

#### 1. Reference MVP Phases
Always check `MVP.md` to understand:
- Current development phase
- Feature priorities
- Implementation requirements

#### 2. Design System Integration
- Use existing glassmorphism components
- Follow SF Pro Compact Rounded typography
- Maintain AMOLED black backgrounds
- Implement proper animations with Framer Motion

#### 3. AI Integration Features
```typescript
// Example: Adding new AI processing type
// 1. Add to shared types
export interface SentimentAnalysisTask extends ProcessingTask {
  type: 'sentiment_analysis';
  result?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
}

// 2. Update server AI service
// server/src/services/aiService.ts
export const analyzeSentiment = async (content: string) => {
  // OpenAI API call implementation
};

// 3. Add UI components
// client/src/components/SentimentIndicator.tsx
```

### State Management Workflow

#### Client State (Zustand)
```typescript
// client/src/stores/uiStore.ts
interface UIState {
  isModalOpen: boolean;
  currentTheme: 'dark' | 'light';
  actions: {
    openModal: () => void;
    closeModal: () => void;
    toggleTheme: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  currentTheme: 'dark',
  actions: {
    openModal: () => set({ isModalOpen: true }),
    closeModal: () => set({ isModalOpen: false }),
    toggleTheme: () => set((state) => ({
      currentTheme: state.currentTheme === 'dark' ? 'light' : 'dark'
    }))
  }
}));
```

#### Server State (React Query)
```typescript
// client/src/hooks/useThoughts.ts
export const useThoughts = () => {
  return useQuery({
    queryKey: ['thoughts'],
    queryFn: () => thoughtsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};

export const useCreateThought = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: thoughtsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    }
  });
};
```

## Testing Workflow

### Manual Testing Checklist

For each feature:
- [ ] Functionality works as expected
- [ ] UI renders correctly on all screen sizes
- [ ] Animations are smooth (60fps)
- [ ] Error states are handled gracefully
- [ ] Loading states provide good UX
- [ ] Accessibility requirements met

### Integration Testing
```bash
# Test client-server integration
curl -X POST http://localhost:3001/api/thoughts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Test thought"}'

# Test AI processing
# Check server logs for OpenAI API calls
# Verify database updates
```

### Performance Testing
- Use React DevTools Profiler
- Monitor bundle size changes
- Test on slower devices/networks
- Verify animation performance

## Code Review Process

### Self-Review Checklist

Before creating PR:
- [ ] Code follows project style guide
- [ ] Types are properly defined
- [ ] Error handling is implemented
- [ ] Comments explain complex logic
- [ ] No hardcoded values
- [ ] Performance considerations addressed

### Review Guidelines

When reviewing PRs:
1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it readable and maintainable?
3. **Architecture**: Does it fit the existing patterns?
4. **Performance**: Are there any performance implications?
5. **Security**: Are there any security concerns?

## Git Workflow

### Branch Naming Convention
```
feature/description    # New features
fix/description       # Bug fixes
refactor/description  # Code refactoring
docs/description      # Documentation updates
chore/description     # Maintenance tasks
```

### Commit Message Format
```
type(scope): description

feat(client): add voice recording visualization
fix(server): resolve AI processing queue deadlock
docs(setup): update environment configuration guide
refactor(shared): simplify type definitions
```

### Merge Strategy
1. Create feature branch from `main`
2. Make commits with clear messages
3. Create pull request
4. Code review and approval
5. Squash and merge to `main`

## Debugging Workflow

### Client-Side Debugging

#### React DevTools
```bash
# Install React DevTools browser extension
# Use components and profiler tabs
```

#### Console Debugging
```typescript
// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// Group logging
console.group('AI Processing');
console.log('Input:', input);
console.log('Output:', output);
console.groupEnd();
```

#### Network Debugging
- Use browser Network tab
- Monitor API calls and responses
- Check WebSocket connections

### Server-Side Debugging

#### Console Logging
```typescript
// Structured logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
};
```

#### Database Debugging
```sql
-- Use Supabase dashboard SQL editor
SELECT * FROM thoughts WHERE user_id = 'user-id' ORDER BY created_at DESC;

-- Check processing queue
SELECT * FROM processing_queue WHERE status = 'pending';
```

## Performance Optimization Workflow

### Client Performance
1. **Bundle Analysis**:
   ```bash
   npm run build:client
   # Analyze bundle size and dependencies
   ```

2. **Code Splitting**:
   ```typescript
   // Lazy load components
   const ThoughtsDashboard = React.lazy(() => import('./components/ThoughtsDashboard'));
   ```

3. **Memoization**:
   ```typescript
   // Memoize expensive calculations
   const processedThoughts = useMemo(() => {
     return thoughts.filter(t => t.category === selectedCategory);
   }, [thoughts, selectedCategory]);
   ```

### Server Performance
1. **Monitor Response Times**:
   ```typescript
   // Add timing middleware
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       console.log(`${req.method} ${req.path} - ${Date.now() - start}ms`);
     });
     next();
   });
   ```

2. **Database Optimization**:
   - Use proper indexes
   - Optimize query patterns
   - Monitor slow queries

## Deployment Workflow

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Performance benchmarks met

### Build Process
```bash
# Clean build
npm run clean
npm install

# Type check
npm run typecheck

# Build all packages
npm run build

# Verify build
npm run start
```

This workflow ensures consistent, high-quality development practices across the Cathcr project while maintaining the premium user experience and robust architecture.