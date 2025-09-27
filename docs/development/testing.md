# Testing Strategy

This document outlines the comprehensive testing approach for the Cathcr platform, covering unit tests, integration tests, end-to-end tests, and quality assurance practices.

## Testing Philosophy

### Testing Pyramid
Cathcr follows the testing pyramid approach:

```
      /\
     /  \    E2E Tests (Few)
    /____\   - Critical user journeys
   /      \  - Cross-browser testing
  /        \
 /__________\ Integration Tests (Some)
/            \- API endpoints
/              \- Component integration
/______________\- Database operations

                Unit Tests (Many)
                - Individual functions
                - Component logic
                - Business logic
```

### Core Principles

1. **Fast Feedback**: Tests should run quickly in development
2. **Reliable**: Tests should be deterministic and not flaky
3. **Maintainable**: Tests should be easy to understand and update
4. **Comprehensive**: Cover critical paths and edge cases
5. **Isolated**: Tests should not depend on external services when possible

## Testing Stack

### Frontend Testing
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking
- **Playwright** - End-to-end testing
- **@testing-library/jest-dom** - Additional DOM matchers

### Backend Testing
- **Jest** - Test runner and assertion library
- **Supertest** - HTTP assertion library
- **Test Containers** - Database testing with Docker
- **Nock** - HTTP mocking for external APIs

### AI/ML Testing
- **OpenAI Mock Server** - Mock OpenAI API responses
- **Test Fixtures** - Predefined AI response samples
- **Confidence Testing** - Validate AI processing quality

## Unit Testing

### Frontend Unit Tests

#### Component Testing
```typescript
// client/src/components/__tests__/ThoughtCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThoughtCard } from '../ThoughtCard';
import type { Thought } from '@cathcr/shared';

const mockThought: Thought = {
  id: '1',
  content: 'Test thought content',
  category: 'ideas',
  tags: ['test', 'example'],
  created_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1'
};

describe('ThoughtCard', () => {
  it('renders thought content', () => {
    render(<ThoughtCard thought={mockThought} />);

    expect(screen.getByText('Test thought content')).toBeInTheDocument();
    expect(screen.getByText('ideas')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<ThoughtCard thought={mockThought} onEdit={mockOnEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(mockOnEdit).toHaveBeenCalledWith(mockThought);
  });

  it('applies glassmorphism styling', () => {
    const { container } = render(<ThoughtCard thought={mockThought} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('backdrop-blur-md', 'bg-white/10');
  });
});
```

#### Hook Testing
```typescript
// client/src/hooks/__tests__/useThoughts.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThoughts } from '../useThoughts';
import { thoughtsApi } from '../../services/thoughtsApi';

jest.mock('../../services/thoughtsApi');
const mockThoughtsApi = thoughtsApi as jest.Mocked<typeof thoughtsApi>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useThoughts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockThoughtsApi.getAll.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useThoughts(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns thoughts data on successful fetch', async () => {
    const mockThoughts = [mockThought];
    mockThoughtsApi.getAll.mockResolvedValue(mockThoughts);

    const { result } = renderHook(() => useThoughts(), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockThoughts);
    });
  });
});
```

### Backend Unit Tests

#### Service Testing
```typescript
// server/src/services/__tests__/thoughtService.test.ts
import { ThoughtService } from '../thoughtService';
import { AIService } from '../aiService';
import { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');
jest.mock('../aiService');

describe('ThoughtService', () => {
  let thoughtService: ThoughtService;
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockAIService: jest.Mocked<AIService>;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn()
    } as any;

    mockAIService = {
      categorizeThought: jest.fn(),
      extractEntities: jest.fn()
    } as any;

    thoughtService = new ThoughtService(mockSupabase, mockAIService);
  });

  describe('create', () => {
    it('creates thought and queues AI processing', async () => {
      const thoughtData = {
        content: 'Test thought',
        userId: 'user-123'
      };

      const mockThought = {
        id: 'thought-123',
        ...thoughtData,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockThought,
        error: null
      });

      const result = await thoughtService.create(thoughtData);

      expect(mockSupabase.from).toHaveBeenCalledWith('thoughts');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        content: thoughtData.content,
        user_id: thoughtData.userId
      });
      expect(result).toEqual(mockThought);
    });

    it('throws error when database insert fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      });

      await expect(thoughtService.create({
        content: 'Test',
        userId: 'user-123'
      })).rejects.toThrow('Insert failed');
    });
  });
});
```

#### Utility Function Testing
```typescript
// shared/src/utils/__tests__/validation.test.ts
import { validateThought, ValidationError } from '../validation';

describe('validateThought', () => {
  const validThought = {
    content: 'Valid thought content',
    category: 'ideas',
    tags: ['tag1', 'tag2']
  };

  it('validates correct thought data', () => {
    expect(() => validateThought(validThought)).not.toThrow();
  });

  it('throws error for empty content', () => {
    const invalid = { ...validThought, content: '' };

    expect(() => validateThought(invalid))
      .toThrow(ValidationError);
  });

  it('throws error for content too long', () => {
    const invalid = {
      ...validThought,
      content: 'a'.repeat(10001)
    };

    expect(() => validateThought(invalid))
      .toThrow('Content too long');
  });

  it('throws error for too many tags', () => {
    const invalid = {
      ...validThought,
      tags: Array(11).fill('tag')
    };

    expect(() => validateThought(invalid))
      .toThrow('Too many tags');
  });
});
```

## Integration Testing

### API Integration Tests
```typescript
// server/src/__tests__/integration/thoughts.test.ts
import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestUser, generateAuthToken } from '../helpers/auth';

describe('Thoughts API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    const user = await createTestUser();
    userId = user.id;
    authToken = generateAuthToken(user);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /api/thoughts', () => {
    it('creates a new thought', async () => {
      const thoughtData = {
        content: 'Integration test thought',
        category: 'ideas'
      };

      const response = await request(app)
        .post('/api/thoughts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(thoughtData)
        .expect(201);

      expect(response.body).toMatchObject({
        thought: {
          content: thoughtData.content,
          category: thoughtData.category,
          user_id: userId
        }
      });
    });

    it('returns 401 without authentication', async () => {
      await request(app)
        .post('/api/thoughts')
        .send({ content: 'Test' })
        .expect(401);
    });

    it('validates request data', async () => {
      const response = await request(app)
        .post('/api/thoughts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.error).toContain('Content cannot be empty');
    });
  });

  describe('GET /api/thoughts', () => {
    it('returns user thoughts', async () => {
      // Create test thoughts
      await request(app)
        .post('/api/thoughts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Thought 1' });

      await request(app)
        .post('/api/thoughts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Thought 2' });

      const response = await request(app)
        .get('/api/thoughts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.thoughts).toHaveLength(2);
      expect(response.body.thoughts[0]).toHaveProperty('content');
      expect(response.body.thoughts[0]).toHaveProperty('created_at');
    });
  });
});
```

### Database Integration Tests
```typescript
// server/src/__tests__/integration/database.test.ts
import { supabase } from '../../config/supabase';
import { thoughtsRepository } from '../../repositories/thoughtsRepository';

describe('Database Integration', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const { data: user } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    testUserId = user.user!.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase
      .from('thoughts')
      .delete()
      .eq('user_id', testUserId);
  });

  it('creates and retrieves thoughts', async () => {
    const thoughtData = {
      content: 'Database test thought',
      user_id: testUserId,
      category: 'ideas'
    };

    // Create thought
    const created = await thoughtsRepository.create(thoughtData);
    expect(created).toHaveProperty('id');
    expect(created.content).toBe(thoughtData.content);

    // Retrieve thought
    const retrieved = await thoughtsRepository.findById(created.id);
    expect(retrieved).toMatchObject(thoughtData);
  });

  it('enforces row level security', async () => {
    const otherUserId = 'other-user-id';

    // Create thought for other user
    const { data } = await supabase
      .from('thoughts')
      .insert({
        content: 'Other user thought',
        user_id: otherUserId
      })
      .select()
      .single();

    // Try to access with different user context
    const thoughts = await thoughtsRepository.findByUser(testUserId);

    // Should not include other user's thoughts
    expect(thoughts.find(t => t.user_id === otherUserId)).toBeUndefined();
  });
});
```

## AI/ML Testing

### OpenAI Integration Tests
```typescript
// server/src/services/__tests__/aiService.integration.test.ts
import { AIService } from '../aiService';
import nock from 'nock';

describe('AIService Integration', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('categorizeThought', () => {
    it('processes thought and returns category', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              category: 'ideas',
              confidence: 0.85,
              reasoning: 'Creative thought about innovation'
            })
          }
        }]
      };

      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .reply(200, mockResponse);

      const result = await aiService.categorizeThought(
        'I have an idea for a new app feature'
      );

      expect(result).toEqual({
        category: 'ideas',
        confidence: 0.85,
        reasoning: 'Creative thought about innovation'
      });
    });

    it('handles API errors gracefully', async () => {
      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .reply(500, { error: 'Internal server error' });

      const result = await aiService.categorizeThought('Test thought');

      // Should return fallback categorization
      expect(result.category).toBe('notes');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('transcribeAudio', () => {
    it('transcribes audio using Whisper API', async () => {
      const mockResponse = {
        text: 'This is the transcribed text'
      };

      nock('https://api.openai.com')
        .post('/v1/audio/transcriptions')
        .reply(200, mockResponse);

      const audioBuffer = Buffer.from('fake audio data');
      const result = await aiService.transcribeAudio(audioBuffer);

      expect(result.text).toBe('This is the transcribed text');
    });
  });
});
```

### AI Quality Testing
```typescript
// server/src/services/__tests__/aiQuality.test.ts
import { AIService } from '../aiService';
import { testCases } from '../__fixtures__/aiTestCases';

describe('AI Quality Tests', () => {
  let aiService: AIService;

  beforeAll(() => {
    aiService = new AIService();
  });

  describe('categorization accuracy', () => {
    test.each(testCases.categorization)(
      'should categorize "$input" as "$expectedCategory"',
      async ({ input, expectedCategory, minConfidence }) => {
        const result = await aiService.categorizeThought(input);

        expect(result.category).toBe(expectedCategory);
        expect(result.confidence).toBeGreaterThanOrEqual(minConfidence);
      }
    );
  });

  describe('entity extraction', () => {
    test.each(testCases.entities)(
      'should extract entities from "$input"',
      async ({ input, expectedEntities }) => {
        const result = await aiService.extractEntities(input);

        expectedEntities.forEach(entity => {
          expect(result.entities).toContainEqual(
            expect.objectContaining(entity)
          );
        });
      }
    );
  });
});
```

## End-to-End Testing

### Playwright E2E Tests
```typescript
// e2e/tests/thoughtCapture.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Thought Capture Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'testpassword123');
    await page.click('[data-testid=login-button]');

    await expect(page.locator('[data-testid=dashboard]')).toBeVisible();
  });

  test('captures thought via global shortcut', async ({ page }) => {
    // Trigger global shortcut
    await page.keyboard.press('Control+Shift+KeyC');

    // Verify capture modal opens
    await expect(page.locator('[data-testid=capture-modal]')).toBeVisible();

    // Enter thought content
    await page.fill('[data-testid=thought-input]', 'Test thought content');

    // Save thought
    await page.click('[data-testid=save-button]');

    // Verify thought appears in dashboard
    await expect(page.locator('[data-testid=thought-card]')).toContainText(
      'Test thought content'
    );
  });

  test('voice recording and transcription', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    await page.keyboard.press('Control+Shift+KeyC');
    await expect(page.locator('[data-testid=capture-modal]')).toBeVisible();

    // Start voice recording
    await page.click('[data-testid=voice-record-button]');

    // Verify recording state
    await expect(page.locator('[data-testid=recording-indicator]')).toBeVisible();

    // Simulate audio input (mock Web Speech API)
    await page.evaluate(() => {
      window.speechRecognition.mockTranscription('This is a voice note');
    });

    // Stop recording
    await page.click('[data-testid=voice-record-button]');

    // Verify transcription appears
    await expect(page.locator('[data-testid=thought-input]')).toHaveValue(
      'This is a voice note'
    );
  });

  test('AI categorization feedback', async ({ page }) => {
    await page.keyboard.press('Control+Shift+KeyC');

    await page.fill('[data-testid=thought-input]', 'Remember to buy groceries tomorrow');
    await page.click('[data-testid=save-button]');

    // Wait for AI processing
    await expect(page.locator('[data-testid=processing-indicator]')).toBeVisible();

    // Verify category assignment
    await expect(page.locator('[data-testid=thought-card]')).toContainText('reminders');

    // Verify reminder date is set
    await expect(page.locator('[data-testid=reminder-date]')).toBeVisible();
  });
});
```

### Cross-browser Testing
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    }
  ]
});
```

## Performance Testing

### Load Testing
```typescript
// performance/loadTest.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Steady state
    { duration: '2m', target: 0 }    // Ramp down
  ]
};

export default function() {
  // Login
  const loginResponse = http.post('http://localhost:3001/api/auth/login', {
    email: 'test@example.com',
    password: 'testpassword123'
  });

  check(loginResponse, {
    'login successful': (r) => r.status === 200
  });

  const token = loginResponse.json('token');

  // Create thought
  const thoughtResponse = http.post(
    'http://localhost:3001/api/thoughts',
    JSON.stringify({
      content: `Load test thought ${Math.random()}`
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  check(thoughtResponse, {
    'thought created': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500
  });

  sleep(1);
}
```

### Frontend Performance Testing
```typescript
// client/src/__tests__/performance/renderPerformance.test.tsx
import { render } from '@testing-library/react';
import { ThoughtsList } from '../../components/ThoughtsList';
import { generateMockThoughts } from '../helpers/mockData';

describe('Render Performance', () => {
  it('renders large thought list efficiently', () => {
    const largeThoughtList = generateMockThoughts(1000);

    const startTime = performance.now();
    render(<ThoughtsList thoughts={largeThoughtList} />);
    const endTime = performance.now();

    const renderTime = endTime - startTime;

    // Should render 1000 thoughts in under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles frequent updates without performance degradation', () => {
    const { rerender } = render(<ThoughtsList thoughts={[]} />);

    const startTime = performance.now();

    // Simulate 100 rapid updates
    for (let i = 0; i < 100; i++) {
      const thoughts = generateMockThoughts(i + 1);
      rerender(<ThoughtsList thoughts={thoughts} />);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should handle 100 updates in under 500ms
    expect(totalTime).toBeLessThan(500);
  });
});
```

## Test Data Management

### Test Fixtures
```typescript
// tests/fixtures/thoughts.ts
export const thoughtFixtures = {
  basic: {
    id: 'thought-1',
    content: 'Basic thought for testing',
    category: 'ideas',
    tags: ['test'],
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z'
  },

  reminder: {
    id: 'thought-2',
    content: 'Remember to call mom tomorrow',
    category: 'reminders',
    is_reminder: true,
    reminder_date: '2024-01-02T10:00:00Z',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z'
  },

  longContent: {
    id: 'thought-3',
    content: 'a'.repeat(5000),
    category: 'notes',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z'
  }
};
```

### Database Seeding
```typescript
// tests/helpers/seed.ts
export const seedTestData = async () => {
  const testUser = await createTestUser();

  const thoughts = await Promise.all([
    thoughtsRepository.create({
      ...thoughtFixtures.basic,
      user_id: testUser.id
    }),
    thoughtsRepository.create({
      ...thoughtFixtures.reminder,
      user_id: testUser.id
    })
  ]);

  return { testUser, thoughts };
};
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run type check
      run: npm run typecheck

    - name: Run linting
      run: npm run lint

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration
      env:
        SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

This comprehensive testing strategy ensures the reliability, performance, and quality of the Cathcr platform across all components and user interactions.