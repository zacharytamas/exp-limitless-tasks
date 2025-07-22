import { expect, test } from 'bun:test'
import { ConfigProvider, Effect } from 'effect'

import { LifelogDatabase } from '../database'
import { createMockLifelog, createMockLifelogsResponse, mockLimitlessAIApi } from '../test-utils'
import { LimitlessAIApi } from './api'
import { LifelogsService } from './lifelogs'
import { LifelogProcessor } from './processor'

const config = ConfigProvider.fromMap(
  new Map([
    ['DATABASE_PATH', ':memory:'],
    ['LIMITLESS_API_KEY', 'test-api-key'],
  ]),
)

test('LifelogProcessor - should process new lifelogs', async () => {
  const mockLifelogs = [
    createMockLifelog({ id: 'lifelog-1', title: 'First Lifelog' }),
    createMockLifelog({ id: 'lifelog-2', title: 'Second Lifelog' }),
  ]

  const mockResponse = createMockLifelogsResponse(mockLifelogs)
  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(mockResponse)

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor
        const result = yield* Effect.promise(() => processor.processAllLifelogs())

        expect(result.fetched).toBe(2)
        expect(result.processed).toBe(2)
        expect(result.skipped).toBe(0)
        expect(result.failed).toBe(0)
        expect(result.newLifelogs).toHaveLength(2)
        expect(result.errors).toHaveLength(0)

        // Verify lifelogs were marked as processed
        const stats = processor.getStats()
        expect(stats.totalProcessed).toBe(2)
        expect(stats.lastProcessedTime).not.toBeNull()
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})

test('LifelogProcessor - should skip already processed lifelogs', async () => {
  const lifelog1 = createMockLifelog({ id: 'lifelog-1', title: 'First Lifelog' })
  const lifelog2 = createMockLifelog({ id: 'lifelog-2', title: 'Second Lifelog' })
  const mockLifelogs = [lifelog1, lifelog2]
  const mockClient = mockLimitlessAIApi()

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor

        // First run - process both lifelogs
        const firstResponse = createMockLifelogsResponse(mockLifelogs)
        mockClient.addResponse(firstResponse)

        const firstResult = yield* Effect.promise(() => processor.processAllLifelogs())
        expect(firstResult.processed).toBe(2)
        expect(firstResult.skipped).toBe(0)

        // Second run - same lifelogs should be skipped
        mockClient.reset()
        const secondResponse = createMockLifelogsResponse(mockLifelogs)
        mockClient.addResponse(secondResponse)

        const secondResult = yield* Effect.promise(() => processor.processAllLifelogs())
        expect(secondResult.fetched).toBe(2)
        expect(secondResult.processed).toBe(0)
        expect(secondResult.skipped).toBe(2)
        expect(secondResult.newLifelogs).toHaveLength(0)

        // Total processed count should remain 2
        const stats = processor.getStats()
        expect(stats.totalProcessed).toBe(2)
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})

test('LifelogProcessor - should handle mixed new and processed lifelogs', async () => {
  const lifelog1 = createMockLifelog({ id: 'mixed-1', title: 'Already Processed' })
  const lifelog2 = createMockLifelog({ id: 'mixed-2', title: 'New Lifelog' })
  const mockClient = mockLimitlessAIApi()

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor

        // First run - process lifelog1
        const firstResponse = createMockLifelogsResponse([lifelog1])
        mockClient.addResponse(firstResponse)
        yield* Effect.promise(() => processor.processAllLifelogs())

        // Second run - lifelog1 (processed) + lifelog2 (new)
        mockClient.reset()
        const secondResponse = createMockLifelogsResponse([lifelog1, lifelog2])
        mockClient.addResponse(secondResponse)

        const result = yield* Effect.promise(() => processor.processAllLifelogs())
        expect(result.fetched).toBe(2)
        expect(result.processed).toBe(1)
        expect(result.skipped).toBe(1)
        expect(result.newLifelogs).toHaveLength(1)
        expect(result.newLifelogs[0]?.id).toBe('mixed-2')

        const stats = processor.getStats()
        expect(stats.totalProcessed).toBe(2)
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})

test('LifelogProcessor - should handle pagination', async () => {
  // Page 1
  const page1Lifelogs = [
    createMockLifelog({ id: 'lifelog-1', title: 'Page 1 - Lifelog 1' }),
    createMockLifelog({ id: 'lifelog-2', title: 'Page 1 - Lifelog 2' }),
  ]
  const page1Response = createMockLifelogsResponse(page1Lifelogs, 'cursor-page-2')

  // Page 2
  const page2Lifelogs = [createMockLifelog({ id: 'lifelog-3', title: 'Page 2 - Lifelog 1' })]
  const page2Response = createMockLifelogsResponse(page2Lifelogs)

  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(page1Response)
  mockClient.addResponse(page2Response)

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor
        const result = yield* Effect.promise(() => processor.processAllLifelogs())

        expect(result.fetched).toBe(3)
        expect(result.processed).toBe(3)
        expect(result.skipped).toBe(0)
        expect(result.newLifelogs).toHaveLength(3)

        // Verify all API calls were made
        expect(mockClient.getCallCount()).toBe(2)
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})

test('LifelogProcessor - should handle empty results', async () => {
  const emptyResponse = createMockLifelogsResponse([])
  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(emptyResponse)

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor
        const result = yield* Effect.promise(() => processor.processAllLifelogs())

        expect(result.fetched).toBe(0)
        expect(result.processed).toBe(0)
        expect(result.skipped).toBe(0)
        expect(result.failed).toBe(0)
        expect(result.newLifelogs).toHaveLength(0)
        expect(result.errors).toHaveLength(0)

        const stats = processor.getStats()
        expect(stats.totalProcessed).toBe(0)
        expect(stats.lastProcessedTime).toBeNull()
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})

test('LifelogProcessor - should handle API errors gracefully', async () => {
  // Don't add any responses, so mock client will throw error

  const mockClient = mockLimitlessAIApi()

  expect(
    Effect.runPromise(
      Effect.withConfigProvider(
        Effect.gen(function* () {
          const processor = yield* LifelogProcessor
          yield* Effect.promise(() => processor.processAllLifelogs())
        }).pipe(
          Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
          Effect.provide(LifelogsService.DefaultWithoutDependencies),
          Effect.provideService(LimitlessAIApi, mockClient.mock),
          Effect.provide(LifelogDatabase.Default),
        ),
        config,
      ),
    ),
  ).rejects.toThrow('Mock client: No more responses configured')
})

test('LifelogProcessor - should provide accurate statistics', async () => {
  const mockClient = mockLimitlessAIApi()

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor

        // Initial stats
        let stats = processor.getStats()
        expect(stats.totalProcessed).toBe(0)
        expect(stats.lastProcessedTime).toBeNull()

        // Process some lifelogs
        const mockLifelogs = [
          createMockLifelog({ id: 'stats-1' }),
          createMockLifelog({ id: 'stats-2' }),
          createMockLifelog({ id: 'stats-3' }),
        ]

        const mockResponse = createMockLifelogsResponse(mockLifelogs)
        mockClient.addResponse(mockResponse)

        yield* Effect.promise(() => processor.processAllLifelogs())

        // Updated stats
        stats = processor.getStats()
        expect(stats.totalProcessed).toBe(3)
        expect(stats.lastProcessedTime).not.toBeNull()
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})

test('LifelogProcessor - should close database properly', async () => {
  const mockClient = mockLimitlessAIApi()

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const processor = yield* LifelogProcessor

        // Should not throw when closing
        expect(() => processor.close()).not.toThrow()

        // After closing, operations should fail
        expect(() => processor.getStats()).toThrow()
      }).pipe(
        Effect.provide(LifelogProcessor.DefaultWithoutDependencies),
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
        Effect.provide(LifelogDatabase.Default),
      ),
      config,
    ),
  )
})
