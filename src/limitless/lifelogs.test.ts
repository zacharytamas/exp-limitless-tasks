import { expect, test } from 'bun:test'
import { Effect } from 'effect'
import { createMockLifelog, createMockLifelogsResponse, mockLimitlessAIApi } from '../test-utils'
import { LimitlessAIApi } from './api'
import { LifelogsService } from './lifelogs'

test('LifelogService - should fetch single page of lifelogs', async () => {
  const mockLifelogs = [
    createMockLifelog({ id: 'lifelog-1', title: 'First Lifelog' }),
    createMockLifelog({ id: 'lifelog-2', title: 'Second Lifelog' }),
  ]

  const mockClient = mockLimitlessAIApi()
  const mockResponse = createMockLifelogsResponse(mockLifelogs)
  mockClient.addResponse(mockResponse)

  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* LifelogsService
      const result = yield* Effect.promise(() => service.fetchLifelogsPage())

      expect(result.lifelogs).toHaveLength(2)
      expect(result.lifelogs[0]?.id).toBe('lifelog-1')
      expect(result.lifelogs[1]?.id).toBe('lifelog-2')
      expect(result.count).toBe(2)
      expect(result.nextCursor).toBeUndefined()

      // Verify API was called with correct parameters
      const callHistory = mockClient.getCallHistory()
      expect(callHistory).toHaveLength(1)
      expect(callHistory[0]?.params).toEqual({
        cursor: undefined,
        includeMarkdown: true,
        includeHeadings: true,
      })
    }).pipe(
      Effect.provide(LifelogsService.DefaultWithoutDependencies),
      Effect.provideService(LimitlessAIApi, mockClient.mock),
    ),
  )
})

test('LifelogService - should fetch single page with cursor', async () => {
  const mockLifelogs = [createMockLifelog({ id: 'lifelog-3' })]
  const mockResponse = createMockLifelogsResponse(mockLifelogs, 'next-cursor-123')
  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(mockResponse)

  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* LifelogsService
      const result = yield* Effect.promise(() => service.fetchLifelogsPage('cursor-123'))

      expect(result.lifelogs).toHaveLength(1)
      expect(result.nextCursor).toBe('next-cursor-123')

      const callHistory = mockClient.getCallHistory()
      expect(callHistory[0]?.params?.cursor).toBe('cursor-123')
    }).pipe(
      Effect.provide(LifelogsService.DefaultWithoutDependencies),
      Effect.provideService(LimitlessAIApi, mockClient.mock),
    ),
  )
})

test('LifelogService - should fetch all lifelogs with pagination', async () => {
  // First page
  const page1Lifelogs = [
    createMockLifelog({ id: 'lifelog-1', title: 'Page 1 - Lifelog 1' }),
    createMockLifelog({ id: 'lifelog-2', title: 'Page 1 - Lifelog 2' }),
  ]
  const page1Response = createMockLifelogsResponse(page1Lifelogs, 'cursor-page-2')

  // Second page
  const page2Lifelogs = [createMockLifelog({ id: 'lifelog-3', title: 'Page 2 - Lifelog 1' })]
  const page2Response = createMockLifelogsResponse(page2Lifelogs, 'cursor-page-3')

  // Third page (final)
  const page3Lifelogs = [createMockLifelog({ id: 'lifelog-4', title: 'Page 3 - Lifelog 1' })]
  const page3Response = createMockLifelogsResponse(page3Lifelogs) // No next cursor

  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(page1Response)
  mockClient.addResponse(page2Response)
  mockClient.addResponse(page3Response)

  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* LifelogsService
      const allLifelogs = yield* Effect.promise(() => service.fetchLifelogs())

      expect(allLifelogs).toHaveLength(4)
      expect(allLifelogs[0]?.id).toBe('lifelog-1')
      expect(allLifelogs[1]?.id).toBe('lifelog-2')
      expect(allLifelogs[2]?.id).toBe('lifelog-3')
      expect(allLifelogs[3]?.id).toBe('lifelog-4')

      // Verify pagination calls
      const callHistory = mockClient.getCallHistory()
      expect(callHistory).toHaveLength(3)

      // First call should have no cursor
      expect(callHistory[0]?.params?.cursor).toBeUndefined()

      // Second call should use cursor from first response
      expect(callHistory[1]?.params?.cursor).toBe('cursor-page-2')

      // Third call should use cursor from second response
      expect(callHistory[2]?.params?.cursor).toBe('cursor-page-3')
    }).pipe(
      Effect.provide(LifelogsService.DefaultWithoutDependencies),
      Effect.provideService(LimitlessAIApi, mockClient.mock),
    ),
  )
})

test('LifelogService - should handle empty results', async () => {
  const emptyResponse = createMockLifelogsResponse([])
  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(emptyResponse)

  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* LifelogsService
      const result = yield* Effect.promise(() => service.fetchLifelogsPage())

      expect(result.lifelogs).toHaveLength(0)
      expect(result.count).toBe(0)
      expect(result.nextCursor).toBeUndefined()
    }).pipe(
      Effect.provide(LifelogsService.DefaultWithoutDependencies),
      Effect.provideService(LimitlessAIApi, mockClient.mock),
    ),
  )
})

test('LifelogService - should handle single page with no pagination', async () => {
  const mockLifelogs = [createMockLifelog({ id: 'single-lifelog' })]
  const mockResponse = createMockLifelogsResponse(mockLifelogs) // No next cursor
  const mockClient = mockLimitlessAIApi()
  mockClient.addResponse(mockResponse)

  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* LifelogsService
      const allLifelogs = yield* Effect.promise(() => service.fetchLifelogs())

      expect(allLifelogs).toHaveLength(1)
      expect(allLifelogs[0]?.id).toBe('single-lifelog')
      expect(mockClient.getCallCount()).toBe(1)
    }).pipe(
      Effect.provide(LifelogsService.DefaultWithoutDependencies),
      Effect.provideService(LimitlessAIApi, mockClient.mock),
    ),
  )
})

test('LifelogService - should propagate API errors', async () => {
  // Don't add any responses, so mock client will throw error

  const mockClient = mockLimitlessAIApi()

  expect(
    Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* LifelogsService
        yield* Effect.promise(() => service.fetchLifelogsPage())
      }).pipe(
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
      ),
    ),
  ).rejects.toThrow('Mock client: No more responses configured')

  expect(
    Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* LifelogsService
        yield* Effect.promise(() => service.fetchLifelogs())
      }).pipe(
        Effect.provide(LifelogsService.DefaultWithoutDependencies),
        Effect.provideService(LimitlessAIApi, mockClient.mock),
      ),
    ),
  ).rejects.toThrow('Mock client: No more responses configured')
})
