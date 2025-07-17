# Development Guide

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) runtime installed
- Limitless AI API key
- Basic TypeScript knowledge

### Setup
```bash
# Clone and install dependencies
git clone <repository>
cd exp-limitless-tasks
bun install

# Set up environment
export LIMITLESS_API_KEY="your_api_key_here"

# Run the application
bun src/index.ts

# Run tests
bun test
```

## Development Workflow

### 1. Test-Driven Development
Always write tests before implementing features:

```bash
# Create test file
touch src/new-feature.test.ts

# Write failing tests
# Implement feature
# Verify tests pass
bun test src/new-feature.test.ts
```

### 2. Code Quality Checks
```bash
# Run all tests
bun test

# Check TypeScript compilation
bun run tsc --noEmit

# Run specific test file
bun test src/database.test.ts
```

### 3. Adding New Features

#### Example: Adding a new API endpoint
1. **Update schemas** (`src/schemas.ts`)
   ```typescript
   export const NewEndpointSchema = z.object({
     // Define expected response structure
   });
   ```

2. **Add API client method** (`src/api.ts`)
   ```typescript
   async getNewEndpoint(): Promise<NewEndpointResponse> {
     const rawResponse = await this.request("/v1/new-endpoint");
     return NewEndpointSchema.parse(rawResponse);
   }
   ```

3. **Write tests** (`src/api.test.ts`)
   ```typescript
   test("should fetch new endpoint data", async () => {
     // Test implementation
   });
   ```

4. **Update service layer** if needed
5. **Update processor** if needed

## Testing Guidelines

### Test Structure
```typescript
import { test, expect, beforeEach } from "bun:test";

let component: ComponentClass;

beforeEach(() => {
  // Fresh instance for each test
  component = new ComponentClass();
});

test("should do something specific", () => {
  // Arrange
  const input = createTestInput();
  
  // Act
  const result = component.doSomething(input);
  
  // Assert
  expect(result).toBe(expectedValue);
});
```

### Mock Usage
```typescript
// Use MockLimitlessApiClient for API tests
const mockClient = new MockLimitlessApiClient();
mockClient.addResponse(createMockLifelogsResponse([]));

// Use in-memory database for database tests
const db = new LifelogDatabase(":memory:");
```

### Test Categories

1. **Unit Tests** - Test individual functions/methods
2. **Integration Tests** - Test component interactions
3. **Schema Tests** - Test Zod validation
4. **Error Tests** - Test error handling

## Code Style Guidelines

### TypeScript Best Practices
- Use strict mode (enabled in `tsconfig.json`)
- Prefer `const` over `let`
- Use type annotations for function parameters and return types
- Avoid `any` type - use proper typing

### Error Handling
```typescript
// Good: Specific error types
throw new LimitlessApiError("API request failed", 401, responseText);

// Bad: Generic errors
throw new Error("Something went wrong");
```

### Async/Await
```typescript
// Good: Proper error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof LimitlessApiError) {
    // Handle API errors specifically
  }
  throw error;
}
```

## Database Development

### Schema Changes
When modifying the database schema:

1. **Update the schema** in `src/database.ts`
2. **Consider migration strategy** for existing databases
3. **Update tests** to reflect schema changes
4. **Test with both new and existing databases**

### Testing with SQLite
```typescript
// Always use in-memory databases for tests
const db = new LifelogDatabase(":memory:");

// Clean up after tests
afterEach(() => {
  db.close();
});
```

## API Integration

### Adding New Endpoints
1. **Check OpenAPI spec** for endpoint details
2. **Create Zod schema** for response validation
3. **Add method to API client**
4. **Write comprehensive tests**
5. **Update service layer** if needed

### Handling API Changes
The Zod schemas act as our "canary" system:
- API changes will cause validation errors
- Update schemas when API changes are confirmed
- Consider backward compatibility

## Error Handling Patterns

### Custom Error Creation
```typescript
// Create specific error types for different failure modes
export class NewFeatureError extends Error {
  constructor(message: string, public context?: unknown) {
    super(message);
    this.name = "NewFeatureError";
  }
}
```

### Error Propagation
```typescript
// Low-level: Throw specific errors
throw new DatabaseError("Failed to insert record", sqliteError);

// High-level: Catch and add context
try {
  await lowLevelOperation();
} catch (error) {
  throw new ProcessingError("Processing failed", lifelogId, error);
}
```

## Performance Considerations

### Database Queries
- Use indexes for frequently queried columns
- Consider query performance for large datasets
- Use transactions for multiple related operations

### Memory Usage
- Current implementation loads all lifelogs into memory
- Consider streaming for large datasets
- Monitor memory usage during development

### API Rate Limiting
- Implement retry logic for rate-limited requests
- Consider caching frequently accessed data
- Monitor API usage patterns

## Debugging Tips

### Common Issues

1. **Environment Variables**
   ```bash
   # Check if API key is set
   echo $LIMITLESS_API_KEY
   
   # Verify environment validation
   bun -e "import { env } from './src/env'; console.log('API key length:', env.LIMITLESS_API_KEY.length)"
   ```

2. **Database Issues**
   ```bash
   # Check database file
   ls -la *.db
   
   # Use SQLite CLI to inspect
   sqlite3 lifelogs.db ".tables"
   sqlite3 lifelogs.db "SELECT COUNT(*) FROM processed_lifelogs;"
   ```

3. **API Issues**
   ```bash
   # Test API connectivity
   curl -H "X-API-Key: $LIMITLESS_API_KEY" \
        "https://api.limitless.ai/v1/lifelogs?isStarred=true&limit=1"
   ```

### Logging
Add temporary logging for debugging:
```typescript
console.log("Debug:", { variable, context });
```

Remove debug logging before committing.

## Git Workflow

### Commit Messages
Use descriptive commit messages:
```bash
git commit -m "Add pagination support to lifelog fetching

- Implement cursor-based pagination in LifelogService
- Add tests for multi-page scenarios
- Update API client to handle nextCursor parameter"
```

### Branch Strategy
- `main` - Production-ready code
- Feature branches for new development
- Test everything before merging

## Documentation Updates

When adding features, update:
- `PROJECT.md` - High-level project status
- `ARCHITECTURE.md` - Technical details
- `DEVELOPMENT.md` - Development procedures
- Code comments for complex logic
- Test descriptions

## Deployment Preparation

### Pre-deployment Checklist
- [ ] All tests passing (`bun test`)
- [ ] TypeScript compilation clean
- [ ] Environment variables documented
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Documentation updated

### Environment Setup
```bash
# Production environment variables
export LIMITLESS_API_KEY="production_key"
export NODE_ENV="production"

# Optional: Database path
export DATABASE_PATH="/path/to/production.db"
```

## Troubleshooting

### Test Failures
1. Check if environment variables are set
2. Verify mock data matches expected schemas
3. Ensure database cleanup between tests
4. Check for async/await issues

### API Issues
1. Verify API key is valid
2. Check API endpoint availability
3. Validate request parameters
4. Review response schema changes

### Database Issues
1. Check file permissions
2. Verify SQLite installation
3. Test with in-memory database
4. Review schema migrations

## Future Development

### Planned Features
- Content analysis implementation
- Periodic execution scheduling
- Web dashboard
- Action integration

### Technical Improvements
- Structured logging
- Configuration management
- Performance monitoring
- Error reporting

### Scaling Considerations
- Database optimization
- API rate limiting
- Memory management
- Concurrent processing