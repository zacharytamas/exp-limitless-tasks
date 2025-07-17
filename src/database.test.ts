import { beforeEach, expect, test } from 'bun:test'
import { LifelogDatabase } from './database'
import { createMockLifelog } from './test-utils'

let db: LifelogDatabase

beforeEach(() => {
  // Create fresh in-memory database for each test
  db = new LifelogDatabase(':memory:')
})

test('LifelogDatabase - should initialize with empty database', () => {
  expect(db.getProcessedCount()).toBe(0)
  expect(db.getLastProcessedTime()).toBeNull()
})

test('LifelogDatabase - should mark lifelog as processed', () => {
  const lifelog = createMockLifelog({
    id: 'test-lifelog-1',
    title: 'Test Lifelog 1',
  })

  expect(db.isProcessed(lifelog.id)).toBe(false)

  db.markAsProcessed(lifelog)

  expect(db.isProcessed(lifelog.id)).toBe(true)
  expect(db.getProcessedCount()).toBe(1)
  expect(db.getLastProcessedTime()).not.toBeNull()
})

test('LifelogDatabase - should handle multiple lifelogs', () => {
  const lifelog1 = createMockLifelog({ id: 'test-1', title: 'Test 1' })
  const lifelog2 = createMockLifelog({ id: 'test-2', title: 'Test 2' })
  const lifelog3 = createMockLifelog({ id: 'test-3', title: 'Test 3' })

  // Mark first two as processed
  db.markAsProcessed(lifelog1)
  db.markAsProcessed(lifelog2)

  expect(db.isProcessed(lifelog1.id)).toBe(true)
  expect(db.isProcessed(lifelog2.id)).toBe(true)
  expect(db.isProcessed(lifelog3.id)).toBe(false)
  expect(db.getProcessedCount()).toBe(2)
})

test('LifelogDatabase - should prevent duplicate processing', () => {
  const lifelog = createMockLifelog({
    id: 'duplicate-test',
    title: 'Duplicate Test',
  })

  db.markAsProcessed(lifelog)
  expect(db.getProcessedCount()).toBe(1)

  // Attempting to mark the same lifelog again should not increase count
  // Note: This will actually throw an error due to PRIMARY KEY constraint
  expect(() => db.markAsProcessed(lifelog)).toThrow()
  expect(db.getProcessedCount()).toBe(1)
})

test('LifelogDatabase - should track processing timestamps', async () => {
  const lifelog1 = createMockLifelog({ id: 'time-test-1' })
  const lifelog2 = createMockLifelog({ id: 'time-test-2' })

  db.markAsProcessed(lifelog1)
  const firstProcessedTime = db.getLastProcessedTime()

  // Small delay to ensure different timestamps
  await new Promise((resolve) => setTimeout(resolve, 10))

  db.markAsProcessed(lifelog2)
  const secondProcessedTime = db.getLastProcessedTime()

  expect(firstProcessedTime).not.toBeNull()
  expect(secondProcessedTime).not.toBeNull()
  // biome-ignore lint/style/noNonNullAssertion: The assertions on the lines above prove that they are not null.
  expect(secondProcessedTime! >= firstProcessedTime!).toBe(true)
})

test('LifelogDatabase - should handle database closure', () => {
  const lifelog = createMockLifelog({ id: 'close-test' })

  db.markAsProcessed(lifelog)
  expect(db.isProcessed(lifelog.id)).toBe(true)

  db.close()

  // After closing, operations should fail
  expect(() => db.isProcessed(lifelog.id)).toThrow()
})
