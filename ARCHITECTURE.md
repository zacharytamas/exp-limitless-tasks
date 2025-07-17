# Technical Architecture

## System Design

### Data Flow

1. **Initialization**
   - `env.ts` validates `LIMITLESS_API_KEY` environment variable
   - `LifelogProcessor` creates `LifelogService` and `LifelogDatabase` instances
   - `LifelogService` receives configured `LimitlessApiClient`

2. **Processing Loop**

   ```typescript
   async processStarredLifelogs() {
     // 1. Fetch all starred lifelogs (with pagination)
     const lifelogs = await this.service.fetchStarredLifelogs()

     // 2. For each lifelog:
     for (const lifelog of lifelogs) {
       // 3. Check if already processed
       if (this.database.isProcessed(lifelog.id)) {
         continue // Skip
       }

       // 4. Process lifelog content (placeholder)
       await this.processLifelog(lifelog)

       // 5. Mark as processed in database
       this.database.markAsProcessed(lifelog)
     }
   }
   ```

3. **API Integration**
   - `LimitlessApiClient` handles HTTP requests with `X-API-Key` authentication
   - Automatic pagination using cursor-based navigation
   - Zod schema validation on all responses
   - Custom error types for different failure modes

4. **Database Persistence**
   - SQLite database tracks processed lifelogs by ID
   - Prevents duplicate processing across script runs
   - Stores metadata: title, timestamps, processing time

## Class Responsibilities

### `LimitlessApiClient`

- **Purpose**: HTTP client for Limitless AI API
- **Key Methods**: `getLifelogs(params)`
- **Features**:
  - X-API-Key authentication
  - Configurable API key (constructor parameter)
  - Zod response validation
  - Custom error handling

### `LifelogService`

- **Purpose**: High-level lifelog operations
- **Key Methods**:
  - `fetchStarredLifelogs()` - Get all starred lifelogs with pagination
  - `fetchStarredLifelogsPage(cursor?)` - Get single page
- **Features**:
  - Automatic pagination handling
  - Dependency injection (accepts API client)

### `LifelogDatabase`

- **Purpose**: SQLite persistence for processed lifelog tracking
- **Key Methods**:
  - `isProcessed(id)` - Check if lifelog already processed
  - `markAsProcessed(lifelog)` - Record processed lifelog
  - `getProcessedCount()` - Statistics
  - `getLastProcessedTime()` - Statistics
- **Features**:
  - In-memory support (`:memory:`) for testing
  - Automatic schema initialization
  - Performance indexes

### `LifelogProcessor`

- **Purpose**: Main orchestration logic
- **Key Methods**: `processStarredLifelogs()`
- **Features**:
  - Deduplication logic
  - Statistics tracking
  - Error handling
  - Resource cleanup

## Error Handling Strategy

### Custom Error Hierarchy

```typescript
Error
├── LimitlessApiError      // HTTP/API failures
├── ValidationError        // Zod schema failures
├── DatabaseError         // SQLite operation failures
└── ProcessingError       // High-level processing failures
```

### Error Propagation

- **API Level**: `LimitlessApiError` for HTTP failures, `ValidationError` for schema mismatches
- **Service Level**: Propagates API errors, adds context
- **Processor Level**: Catches all errors, provides user-friendly messages
- **Main Script**: Final error handling with exit codes

## Testing Architecture

### Test Structure

```
src/
├── test-utils.ts          # Mock utilities and helpers
├── *.test.ts             # Test files (one per source file)
└── [component].test.ts   # Component-specific tests
```

### Testing Strategy

1. **Unit Tests** - Individual components with mocked dependencies
   - `database.test.ts` - SQLite operations with in-memory DB
   - `api.test.ts` - HTTP client with mock responses
   - `lifelogs.test.ts` - Service logic with mock API client

2. **Integration Tests** - Full workflow testing
   - `processor.test.ts` - End-to-end processing with mocks

3. **Schema Tests** - Validation logic
   - `schemas.test.ts` - Zod schema validation with various inputs

4. **Error Tests** - Error handling
   - `errors.test.ts` - Custom error class behavior

### Mock Strategy

- `MockLimitlessApiClient` - Controllable API responses
- In-memory SQLite (`:memory:`) - Fast, isolated database tests
- Zod schema validation - Ensures mocks match real API

## Configuration Management

### Environment Variables

```typescript
// env.ts - Zod validation
const envSchema = z.object({
  LIMITLESS_API_KEY: z.string().min(1, "LIMITLESS_API_KEY is required"),
});

export const env = envSchema.parse(process.env);
```

### Design Principles

- **Fail Fast**: Invalid configuration stops execution immediately
- **Type Safety**: Zod provides runtime validation + TypeScript types
- **Single Source**: All environment handling in one file

## Database Schema

### `processed_lifelogs` Table

```sql
CREATE TABLE processed_lifelogs (
  id TEXT PRIMARY KEY,           -- Lifelog ID from API
  title TEXT NOT NULL,           -- Lifelog title for debugging
  processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL,  -- From API response
  start_time DATETIME NOT NULL,  -- Lifelog start time
  end_time DATETIME NOT NULL     -- Lifelog end time
);

-- Performance indexes
CREATE INDEX idx_processed_lifelogs_processed_at ON processed_lifelogs(processed_at);
CREATE INDEX idx_processed_lifelogs_updated_at ON processed_lifelogs(updated_at);
```

### Design Rationale

- **Primary Key**: Lifelog ID ensures no duplicates
- **Metadata Only**: Content not stored (can be re-fetched if needed)
- **Timestamps**: Support for analytics and debugging
- **Indexes**: Fast queries for statistics

## API Integration Details

### Authentication

- **Method**: `X-API-Key` header (not Bearer token)
- **Configuration**: Environment variable or constructor parameter
- **Validation**: Zod schema ensures key is present

### Pagination Handling

```typescript
async fetchStarredLifelogs(): Promise<Lifelog[]> {
  const allLifelogs: Lifelog[] = [];
  let cursor: string | undefined;

  do {
    const response = await this.client.getLifelogs({
      isStarred: true,
      cursor,
      includeMarkdown: true,
      includeHeadings: true,
    });

    allLifelogs.push(...response.data.lifelogs);
    cursor = response.meta.lifelogs.nextCursor;
  } while (cursor);

  return allLifelogs;
}
```

### Response Validation

- All API responses validated with Zod schemas
- Schema mismatches throw `ValidationError`
- Acts as early warning system for API changes

## Security Considerations

### Current Implementation

- API key stored in environment variable
- No secrets logged or committed to repository
- SQLite database contains no sensitive content (metadata only)

## Deployment Architecture

### Current (Development)

```bash
# Local execution
export LIMITLESS_API_KEY="key"
bun src/index.ts
```

## Monitoring & Observability

### Current Logging

- Console output with processing statistics
- Error messages with context
- Performance timing
