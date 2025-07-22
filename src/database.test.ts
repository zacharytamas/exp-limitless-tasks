import { expect, test } from 'bun:test'
import { ConfigProvider, Effect } from 'effect'
import { LifelogDatabase } from './database'
import { createMockLifelog } from './test-utils'

const config = ConfigProvider.fromMap(new Map([['DATABASE_PATH', ':memory:']]))

test('LifelogDatabase - should initialize with empty database', async () => {
  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const db = yield* LifelogDatabase

        expect(db.getProcessedCount()).toBe(0)
        expect(db.getLastProcessedTime()).toBeNull()
      }).pipe(Effect.provide(LifelogDatabase.Default)),
      config,
    ),
  )
})

test('LifelogDatabase - should mark lifelog as processed', async () => {
  const lifelog = createMockLifelog({ id: 'test-lifelog-1', title: 'Test Lifelog 1' })

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const db = yield* LifelogDatabase

        expect(db.isProcessed(lifelog.id)).toBe(false)
        db.markAsProcessed(lifelog)
        expect(db.isProcessed(lifelog.id)).toBe(true)
        expect(db.getProcessedCount()).toBe(1)
        expect(db.getLastProcessedTime()).not.toBeNull()
      }).pipe(Effect.provide(LifelogDatabase.Default)),
      config,
    ),
  )
})

test('LifelogDatabase - should handle multiple lifelogs', async () => {
  const lifelog1 = createMockLifelog({ id: 'test-1', title: 'Test 1' })
  const lifelog2 = createMockLifelog({ id: 'test-2', title: 'Test 2' })
  const lifelog3 = createMockLifelog({ id: 'test-3', title: 'Test 3' })

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const db = yield* LifelogDatabase

        // Mark first two as processed
        db.markAsProcessed(lifelog1)
        db.markAsProcessed(lifelog2)

        expect(db.isProcessed(lifelog1.id)).toBe(true)
        expect(db.isProcessed(lifelog2.id)).toBe(true)
        expect(db.isProcessed(lifelog3.id)).toBe(false)
        expect(db.getProcessedCount()).toBe(2)
      }).pipe(Effect.provide(LifelogDatabase.Default)),
      config,
    ),
  )
})

test('LifelogDatabase - should prevent duplicate processing', async () => {
  const lifelog = createMockLifelog({ id: 'duplicate-test', title: 'Duplicate Test' })

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const db = yield* LifelogDatabase

        db.markAsProcessed(lifelog)
        expect(db.getProcessedCount()).toBe(1)

        // Attempting to mark the same lifelog again should not increase count
        // Note: This will actually throw an error due to PRIMARY KEY constraint
        expect(() => db.markAsProcessed(lifelog)).toThrow()
        expect(db.getProcessedCount()).toBe(1)
      }).pipe(Effect.provide(LifelogDatabase.Default)),
      config,
    ),
  )
})

test('LifelogDatabase - should track processing timestamps', async () => {
  const lifelog1 = createMockLifelog({ id: 'time-test-1' })
  const lifelog2 = createMockLifelog({ id: 'time-test-2' })

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const db = yield* LifelogDatabase

        db.markAsProcessed(lifelog1)
        const firstProcessedTime = db.getLastProcessedTime()

        // Small delay to ensure different timestamps
        yield* Effect.sleep(10)

        db.markAsProcessed(lifelog2)
        const secondProcessedTime = db.getLastProcessedTime()

        expect(firstProcessedTime).not.toBeNull()
        expect(secondProcessedTime).not.toBeNull()
        // biome-ignore lint/style/noNonNullAssertion: The assertions on the lines above prove that they are not null.
        expect(secondProcessedTime! >= firstProcessedTime!).toBe(true)
      }).pipe(Effect.provide(LifelogDatabase.Default)),
      config,
    ),
  )
})

test('LifelogDatabase - should handle database closure', async () => {
  const lifelog = createMockLifelog({ id: 'close-test' })

  await Effect.runPromise(
    Effect.withConfigProvider(
      Effect.gen(function* () {
        const db = yield* LifelogDatabase

        db.markAsProcessed(lifelog)
        expect(db.isProcessed(lifelog.id)).toBe(true)

        db.close()

        // After closing, operations should fail
        expect(() => db.isProcessed(lifelog.id)).toThrow()
      }).pipe(Effect.provide(LifelogDatabase.Default)),
      config,
    ),
  )
})
