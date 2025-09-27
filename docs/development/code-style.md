# Code Style Guide

This document establishes coding standards and conventions for the Cathcr project to ensure consistency, maintainability, and readability across all packages.

## General Principles

### Code Philosophy
- **Clarity over Cleverness**: Write code that is easy to understand
- **Consistency**: Follow established patterns throughout the codebase
- **Type Safety**: Leverage TypeScript's type system fully
- **Performance**: Consider performance implications of code choices
- **Maintainability**: Write code that is easy to modify and extend

### File Organization
- Group related functionality together
- Use clear, descriptive file and folder names
- Follow established directory structure
- Keep files focused on a single responsibility

## TypeScript Standards

### Type Definitions

#### Interface vs Type
Prefer `interface` for object shapes, `type` for unions and computed types:

```typescript
// ✅ Good - Interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good - Type for unions
type Status = 'pending' | 'processing' | 'completed' | 'failed';

// ✅ Good - Type for computed types
type UserKeys = keyof User;
type PartialUser = Partial<User>;
```

#### Strict Typing
Always provide explicit types, avoid `any`:

```typescript
// ❌ Bad
const processData = (data: any) => {
  return data.map((item: any) => item.value);
};

// ✅ Good
interface DataItem {
  value: string;
  id: number;
}

const processData = (data: DataItem[]): string[] => {
  return data.map((item) => item.value);
};
```

#### Generic Constraints
Use generic constraints for reusable, type-safe code:

```typescript
// ✅ Good - Generic with constraints
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function apiCall<T extends Record<string, unknown>>(
  endpoint: string
): Promise<ApiResponse<T>> {
  // Implementation
}
```

#### Utility Types
Leverage TypeScript utility types:

```typescript
// ✅ Good - Using utility types
interface CreateUserRequest extends Pick<User, 'name' | 'email'> {
  password: string;
}

interface UpdateUserRequest extends Partial<Pick<User, 'name' | 'email'>> {}

type UserResponse = Omit<User, 'password'>;
```

### Function Definitions

#### Function Signatures
Be explicit about parameter and return types:

```typescript
// ✅ Good - Explicit types
const calculateTotal = (
  items: CartItem[],
  taxRate: number = 0.08
): number => {
  return items.reduce((total, item) => total + item.price, 0) * (1 + taxRate);
};

// ✅ Good - Async functions
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};
```

#### Error Handling
Use proper error types and handling:

```typescript
// ✅ Good - Custom error types
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Good - Error handling with types
const validateUser = (user: unknown): User => {
  if (!user || typeof user !== 'object') {
    throw new ValidationError('Invalid user object', 'user');
  }

  // Validation logic...
  return user as User;
};
```

## React/Frontend Standards

### Component Structure

#### Functional Components
Use functional components with TypeScript:

```typescript
// ✅ Good - Functional component with proper types
interface ThoughtCardProps {
  thought: Thought;
  onEdit?: (thought: Thought) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const ThoughtCard: React.FC<ThoughtCardProps> = ({
  thought,
  onEdit,
  onDelete,
  className = ''
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(thought);
  }, [thought, onEdit]);

  return (
    <div className={`thought-card ${className}`}>
      {/* Component content */}
    </div>
  );
};
```

#### Props Interface
Define props interfaces above components:

```typescript
// ✅ Good - Props interface with documentation
interface ButtonProps {
  /** Button variant styling */
  variant: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Button content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}
```

#### Hooks Usage
Follow hooks best practices:

```typescript
// ✅ Good - Custom hook with proper types
interface UseThoughtsReturn {
  thoughts: Thought[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

const useThoughts = (): UseThoughtsReturn => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await thoughtsApi.getAll();
      setThoughts(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { thoughts, loading, error, refetch };
};
```

### State Management

#### Zustand Stores
Structure Zustand stores with actions:

```typescript
// ✅ Good - Zustand store structure
interface UIState {
  // State properties
  isModalOpen: boolean;
  currentView: 'dashboard' | 'search' | 'settings';
  theme: 'dark' | 'light';

  // Actions grouped together
  actions: {
    openModal: () => void;
    closeModal: () => void;
    setView: (view: UIState['currentView']) => void;
    toggleTheme: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isModalOpen: false,
  currentView: 'dashboard',
  theme: 'dark',

  // Actions
  actions: {
    openModal: () => set({ isModalOpen: true }),
    closeModal: () => set({ isModalOpen: false }),
    setView: (currentView) => set({ currentView }),
    toggleTheme: () => set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark'
    }))
  }
}));
```

#### React Query
Structure queries and mutations:

```typescript
// ✅ Good - Query hooks with proper types
export const useThoughts = (filters?: ThoughtFilters) => {
  return useQuery({
    queryKey: ['thoughts', filters],
    queryFn: () => thoughtsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
};

export const useCreateThought = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateThoughtRequest) => thoughtsApi.create(data),
    onSuccess: (newThought) => {
      // Optimistic update
      queryClient.setQueryData(['thoughts'], (old: Thought[] = []) => [
        newThought,
        ...old
      ]);
    },
    onError: (error) => {
      console.error('Failed to create thought:', error);
    }
  });
};
```

## Node.js/Backend Standards

### API Route Structure

#### Express Routes
Organize routes with proper error handling:

```typescript
// ✅ Good - Route with validation and error handling
router.post('/thoughts',
  authenticate,
  validate(createThoughtSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { content, category, tags }: CreateThoughtRequest = req.body;
      const userId = req.user.id;

      const thought = await thoughtService.create({
        content,
        category,
        tags,
        userId
      });

      res.status(201).json({
        thought,
        message: 'Thought created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);
```

#### Service Layer
Separate business logic into services:

```typescript
// ✅ Good - Service with proper error handling
export class ThoughtService {
  constructor(
    private supabase: SupabaseClient,
    private aiService: AIService
  ) {}

  async create(data: CreateThoughtData): Promise<Thought> {
    const thought = await this.supabase
      .from('thoughts')
      .insert({
        content: data.content,
        category: data.category,
        tags: data.tags,
        user_id: data.userId
      })
      .select()
      .single();

    if (!thought) {
      throw new Error('Failed to create thought');
    }

    // Queue AI processing
    await this.queueAIProcessing(thought.id);

    return thought;
  }

  private async queueAIProcessing(thoughtId: string): Promise<void> {
    // Implementation
  }
}
```

### Database Operations

#### Supabase Queries
Use proper error handling and types:

```typescript
// ✅ Good - Database operations with error handling
export const thoughtsRepository = {
  async findByUser(userId: string): Promise<Thought[]> {
    const { data, error } = await supabase
      .from('thoughts')
      .select(`
        *,
        categories:category_id(name, color),
        tags:thought_tags(tag:tags(name))
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to fetch thoughts: ${error.message}`);
    }

    return data || [];
  },

  async update(id: string, updates: Partial<Thought>): Promise<Thought> {
    const { data, error } = await supabase
      .from('thoughts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to update thought: ${error.message}`);
    }

    return data;
  }
};
```

## Styling Standards

### Tailwind CSS Classes

#### Class Organization
Organize classes in a consistent order:

```typescript
// ✅ Good - Tailwind class organization
const buttonClasses = cn(
  // Layout
  'flex items-center justify-center',
  // Spacing
  'px-4 py-2 gap-2',
  // Typography
  'text-sm font-medium',
  // Colors
  'bg-blue-500 text-white',
  // Effects
  'rounded-lg shadow-md',
  // States
  'hover:bg-blue-600 focus:ring-2 focus:ring-blue-500',
  // Transitions
  'transition-all duration-200',
  // Custom classes
  className
);
```

#### Responsive Design
Use mobile-first responsive classes:

```typescript
// ✅ Good - Mobile-first responsive design
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
  xl:grid-cols-4
">
```

### Glassmorphism Components

#### Glass Effect Utilities
Use consistent glass effect patterns:

```typescript
// ✅ Good - Glass effect component
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  blur = 'md'
}) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  return (
    <div className={cn(
      'bg-white/10 border border-white/20',
      'rounded-2xl',
      blurClasses[blur],
      'shadow-xl',
      className
    )}>
      {children}
    </div>
  );
};
```

## Documentation Standards

### Code Comments

#### Comment Style
Use JSDoc for functions and classes:

```typescript
/**
 * Processes user thoughts using AI categorization
 *
 * @param content - The thought content to process
 * @param userId - The ID of the user who created the thought
 * @param options - Processing options
 * @returns Promise resolving to categorized thought data
 *
 * @throws {AIProcessingError} When AI processing fails
 * @throws {ValidationError} When input validation fails
 *
 * @example
 * ```typescript
 * const result = await processThought(
 *   "Remember to buy groceries tomorrow",
 *   "user-123",
 *   { enableReminders: true }
 * );
 * ```
 */
async function processThought(
  content: string,
  userId: string,
  options: ProcessingOptions = {}
): Promise<ProcessedThought> {
  // Implementation
}
```

#### Inline Comments
Use inline comments sparingly for complex logic:

```typescript
// ✅ Good - Explaining complex logic
const processAIResponse = (response: OpenAIResponse) => {
  // Extract confidence score from response metadata
  // OpenAI returns confidence as a float between 0-1
  const confidence = response.choices[0]?.logprobs?.top_logprobs?.[0]?.token || 0;

  // Convert to percentage and ensure minimum threshold
  return Math.max(confidence * 100, 10);
};
```

### README Files
Each package should have a clear README:

```markdown
# Package Name

Brief description of the package purpose and functionality.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`typescript
import { Component } from './Component';
\`\`\`

## API Reference

### Functions

#### `functionName(param: Type): ReturnType`

Description of the function.

**Parameters:**
- `param` - Parameter description

**Returns:**
- Return value description
```

## Performance Standards

### Code Optimization

#### React Performance
Optimize renders and state updates:

```typescript
// ✅ Good - Memoized components
const ThoughtCard = React.memo<ThoughtCardProps>(({ thought, onEdit }) => {
  const handleClick = useCallback(() => {
    onEdit?.(thought);
  }, [thought, onEdit]);

  return (
    <div onClick={handleClick}>
      {thought.content}
    </div>
  );
});

// ✅ Good - Memoized expensive calculations
const ProcessedThoughts = ({ thoughts, filters }: Props) => {
  const filteredThoughts = useMemo(() => {
    return thoughts.filter(thought =>
      filters.category ? thought.category === filters.category : true
    );
  }, [thoughts, filters.category]);

  return <ThoughtsList thoughts={filteredThoughts} />;
};
```

#### Bundle Optimization
Use dynamic imports for code splitting:

```typescript
// ✅ Good - Lazy loading
const ThoughtsDashboard = React.lazy(() =>
  import('./components/ThoughtsDashboard')
);

const AdminPanel = React.lazy(() =>
  import('./components/AdminPanel').then(module => ({
    default: module.AdminPanel
  }))
);
```

## Testing Standards

### Test Structure
Organize tests with clear descriptions:

```typescript
// ✅ Good - Test structure
describe('ThoughtService', () => {
  describe('create', () => {
    it('should create a thought with valid data', async () => {
      // Arrange
      const thoughtData = {
        content: 'Test thought',
        userId: 'user-123'
      };

      // Act
      const result = await thoughtService.create(thoughtData);

      // Assert
      expect(result).toMatchObject({
        content: 'Test thought',
        user_id: 'user-123'
      });
    });

    it('should throw ValidationError for invalid data', async () => {
      // Arrange
      const invalidData = { content: '' };

      // Act & Assert
      await expect(thoughtService.create(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

This code style guide ensures consistency and quality across the Cathcr codebase while maintaining the premium user experience and robust architecture.