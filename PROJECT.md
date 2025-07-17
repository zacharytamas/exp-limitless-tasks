# Limitless AI Starred Lifelogs Processor

## Project Overview

This project is an experimental script that fetches starred transcriptions ("lifelogs") from the Limitless AI API and processes them for future analysis. The system is designed to run periodically but currently operates as a one-time execution script.

## Current Status: Phase 1 Complete ✅

### What We've Built

A complete TypeScript application using Bun runtime that:

1. **Fetches starred lifelogs** from Limitless AI API with automatic pagination
2. **Validates API responses** using Zod schemas for runtime safety
3. **Deduplicates processing** using SQLite database persistence
4. **Handles errors gracefully** with custom error types and comprehensive logging
5. **Provides comprehensive test coverage**

### Architecture

```
src/
├── index.ts              # Main entry point with CLI interface
├── env.ts                # Environment variable validation (Zod)
├── api.ts                # Limitless API client with X-API-Key auth
├── schemas.ts            # Zod schemas for API response validation
├── lifelogs.ts           # Service for fetching starred lifelogs
├── database.ts           # SQLite database for processed lifelog tracking
├── processor.ts          # Main orchestration logic with deduplication
├── errors.ts             # Custom error classes for different failure types
├── test-utils.ts         # Mock utilities for testing
└── *.test.ts             # Comprehensive test suite (44 tests)
```

### Key Features

- **Dependency Injection**: All components accept their dependencies, enabling easy testing and flexibility
- **In-Memory Testing**: Uses `:memory:` SQLite databases for fast, isolated tests
- **Automatic Pagination**: Handles Limitless API pagination transparently
- **Zod Validation**: Runtime validation catches API changes early (our "canary" system)
- **Error Handling**: Custom error types with proper inheritance and chaining
- **Performance Monitoring**: Tracks processing statistics and timing

## Technical Decisions

### Why Bun?

- Built-in SQLite support (`bun:sqlite`)
- Fast test runner with built-in assertions
- TypeScript support out of the box
- Modern JavaScript runtime optimized for development

### Why SQLite?

- Simple deployment (single file database)
- ACID transactions for reliable deduplication
- Built-in to Bun runtime so it's easy to use and manage
- Perfect for proof-of-concept scale

### Why Zod?

- Runtime validation catches API changes
- TypeScript integration for compile-time safety
- Clear error messages for debugging
- Acts as our "canary" for beta API changes

## Current Functionality

### Main Workflow

1. **Environment Validation**: Ensures `LIMITLESS_API_KEY` is present
2. **API Authentication**: Uses X-API-Key header (not Bearer token)
3. **Fetch Starred Lifelogs**: Retrieves all starred lifelogs with pagination
4. **Deduplication Check**: Skips already processed lifelogs using SQLite
5. **Processing Placeholder**: Currently logs lifelog metadata (ready for content analysis)
6. **Database Persistence**: Marks processed lifelogs to prevent reprocessing
7. **Statistics Reporting**: Shows processing results and database stats

### Usage

```bash
export LIMITLESS_API_KEY="your_api_key_here"
bun src/index.ts
```

### Testing

```bash
bun test                    # Run all tests
bun test src/database.test.ts  # Run specific test file
```

## Next Phase Opportunities

### Phase 2: Content Analysis

The current `processLifelog()` function is a placeholder. Future implementation should:

1. **Extract User Speech**: Filter content nodes where `speakerIdentifier === "user"`
2. **Pattern Recognition**: Identify actionable statements like:
   - Health tracking: "I drank 12oz of water"
   - Shopping lists: "We need more toothpaste for the boys"
   - Task creation: "Remind me to call John tomorrow"
3. **Action Classification**: Categorize different types of user statements
4. **Data Extraction**: Parse quantities, dates, and entities from speech

### Phase 3: Automation

- **Periodic Execution**: Run on schedule (probably cron on my personal machine)
- **Action Integration**: Connect to external systems (calendars, shopping lists, health apps)

### Phase 4: Intelligence

- **Context Awareness**: Understand relationships between lifelogs
- **Trend Analysis**: Identify patterns in user behavior
- **Smart Suggestions**: Proactive recommendations based on speech patterns
- **Natural Language Processing**: More sophisticated content understanding

## API Integration Details

### Limitless AI API

- **Base URL**: `https://api.limitless.ai`
- **Authentication**: `X-API-Key` header
- **Endpoint**: `GET /v1/lifelogs?isStarred=true`
- **Pagination**: Uses cursor-based pagination with `nextCursor`
- **Response Validation**: All responses validated with Zod schemas

### Key API Quirks Discovered

- `nextCursor` is `undefined` (not `null`) when no more pages
- OpenAPI spec incorrectly shows `nullable` instead of `optional`
- Beta API status means responses could change without notice

## File Structure Rationale

- **Separation of Concerns**: Each file has a single responsibility
- **Testability**: All dependencies injected, easy to mock
- **Type Safety**: Zod schemas provide runtime validation
- **Error Handling**: Custom error types with proper inheritance
- **Configuration**: Environment variables validated with Zod

This architecture supports both the current proof-of-concept and future scaling needs while maintaining code quality and test coverage.
