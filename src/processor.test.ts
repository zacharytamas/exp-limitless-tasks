import { beforeEach, expect, test } from 'bun:test'
import { LifelogProcessor } from './processor'
import {
  createMockLifelog,
  createMockLifelogsResponse,
  MockLimitlessApiClient,
} from './test-utils'

let mockClient: MockLimitlessApiClient
let processor: LifelogProcessor

beforeEach(() => {
  mockClient = new MockLimitlessApiClient()
  // Use in-memory database for each test
  processor = new LifelogProcessor(mockClient as any, ':memory:')
})

test('LifelogProcessor - should process new lifelogs', async () => {
  const mockLifelogs = [
    createMockLifelog({ id: 'lifelog-1', title: 'First Lifelog' }),
    createMockLifelog({ id: 'lifelog-2', title: 'Second Lifelog' }),
  ]

  const mockResponse = createMockLifelogsResponse(mockLifelogs)
  mockClient.addResponse(mockResponse)

  const result = await processor.processAllLifelogs()

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
})

test('LifelogProcessor - should skip already processed lifelogs', async () => {
  const lifelog1 = createMockLifelog({
    id: 'lifelog-1',
    title: 'First Lifelog',
  })
  const lifelog2 = createMockLifelog({
    id: 'lifelog-2',
    title: 'Second Lifelog',
  })
  const mockLifelogs = [lifelog1, lifelog2]

  // First run - process both lifelogs
  const firstResponse = createMockLifelogsResponse(mockLifelogs)
  mockClient.addResponse(firstResponse)

  const firstResult = await processor.processAllLifelogs()
  expect(firstResult.processed).toBe(2)
  expect(firstResult.skipped).toBe(0)

  // Second run - same lifelogs should be skipped
  mockClient.reset()
  const secondResponse = createMockLifelogsResponse(mockLifelogs)
  mockClient.addResponse(secondResponse)

  const secondResult = await processor.processAllLifelogs()
  expect(secondResult.fetched).toBe(2)
  expect(secondResult.processed).toBe(0)
  expect(secondResult.skipped).toBe(2)
  expect(secondResult.newLifelogs).toHaveLength(0)

  // Total processed count should remain 2
  const stats = processor.getStats()
  expect(stats.totalProcessed).toBe(2)
})

test('LifelogProcessor - should handle mixed new and processed lifelogs', async () => {
  const lifelog1 = createMockLifelog({
    id: 'mixed-1',
    title: 'Already Processed',
  })
  const lifelog2 = createMockLifelog({ id: 'mixed-2', title: 'New Lifelog' })

  // First run - process lifelog1
  const firstResponse = createMockLifelogsResponse([lifelog1])
  mockClient.addResponse(firstResponse)
  await processor.processAllLifelogs()

  // Second run - lifelog1 (processed) + lifelog2 (new)
  mockClient.reset()
  const secondResponse = createMockLifelogsResponse([lifelog1, lifelog2])
  mockClient.addResponse(secondResponse)

  const result = await processor.processAllLifelogs()
  expect(result.fetched).toBe(2)
  expect(result.processed).toBe(1)
  expect(result.skipped).toBe(1)
  expect(result.newLifelogs).toHaveLength(1)
  expect(result.newLifelogs[0]?.id).toBe('mixed-2')

  const stats = processor.getStats()
  expect(stats.totalProcessed).toBe(2)
})

test('LifelogProcessor - should handle pagination', async () => {
  // Page 1
  const page1Lifelogs = [
    createMockLifelog({ id: 'lifelog-1', title: 'Page 1 - Lifelog 1' }),
    createMockLifelog({ id: 'lifelog-2', title: 'Page 1 - Lifelog 2' }),
  ]
  const page1Response = createMockLifelogsResponse(
    page1Lifelogs,
    'cursor-page-2',
  )

  // Page 2
  const page2Lifelogs = [
    createMockLifelog({ id: 'lifelog-3', title: 'Page 2 - Lifelog 1' }),
  ]
  const page2Response = createMockLifelogsResponse(page2Lifelogs)

  mockClient.addResponse(page1Response)
  mockClient.addResponse(page2Response)

  const result = await processor.processAllLifelogs()

  expect(result.fetched).toBe(3)
  expect(result.processed).toBe(3)
  expect(result.skipped).toBe(0)
  expect(result.newLifelogs).toHaveLength(3)

  // Verify all API calls were made
  expect(mockClient.getCallCount()).toBe(2)
})

test('LifelogProcessor - should handle empty results', async () => {
  const emptyResponse = createMockLifelogsResponse([])
  mockClient.addResponse(emptyResponse)

  const result = await processor.processAllLifelogs()

  expect(result.fetched).toBe(0)
  expect(result.processed).toBe(0)
  expect(result.skipped).toBe(0)
  expect(result.failed).toBe(0)
  expect(result.newLifelogs).toHaveLength(0)
  expect(result.errors).toHaveLength(0)

  const stats = processor.getStats()
  expect(stats.totalProcessed).toBe(0)
  expect(stats.lastProcessedTime).toBeNull()
})

test('LifelogProcessor - should handle API errors gracefully', async () => {
  // Don't add any responses, so mock client will throw error

  expect(processor.processAllLifelogs()).rejects.toThrow(
    'Mock client: No more responses configured',
  )
})

test('LifelogProcessor - should provide accurate statistics', async () => {
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

  await processor.processAllLifelogs()

  // Updated stats
  stats = processor.getStats()
  expect(stats.totalProcessed).toBe(3)
  expect(stats.lastProcessedTime).not.toBeNull()
})

test('LifelogProcessor - should close database properly', () => {
  // Should not throw when closing
  expect(() => processor.close()).not.toThrow()

  // After closing, operations should fail
  expect(() => processor.getStats()).toThrow()
})
