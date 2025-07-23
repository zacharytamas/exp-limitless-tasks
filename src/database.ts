import { Database } from 'bun:sqlite'
import { Effect } from 'effect'

import env from './env'
import { DatabaseError } from './limitless/errors'
import type { Lifelog } from './limitless/schemas'

export class SqliteDatabase extends Effect.Service<SqliteDatabase>()('sys/Database', {
  effect: Effect.gen(function* () {
    return { db: new Database(yield* env.databasePath) } as const
  }),
}) {}

export class LifelogDatabase extends Effect.Service<LifelogDatabase>()('app/Database', {
  effect: Effect.gen(function* () {
    const { db } = yield* SqliteDatabase

    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS processed_lifelogs (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL
        )
      `)

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_processed_lifelogs_processed_at
        ON processed_lifelogs(processed_at)
      `)

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_processed_lifelogs_updated_at
        ON processed_lifelogs(updated_at)
      `)
    } catch (e: unknown) {
      yield* Effect.fail(new DatabaseError({ cause: e instanceof Error ? e : undefined }))
    }

    return {
      isProcessed(lifelogId: string) {
        try {
          const stmt = db.prepare('SELECT 1 FROM processed_lifelogs WHERE id = ?')
          return stmt.get(lifelogId) !== null
        } catch (error) {
          throw new DatabaseError({
            cause: error instanceof Error ? error : undefined,
            message: `Failed to check if lifelog ${lifelogId} is processed`,
          })
        }
      },

      markAsProcessed(lifelog: Lifelog): void {
        try {
          const stmt = db.prepare(`
            INSERT INTO processed_lifelogs (id, title, updated_at, start_time, end_time)
            VALUES (?, ?, ?, ?, ?)
          `)

          stmt.run(lifelog.id, lifelog.title, lifelog.updatedAt, lifelog.startTime, lifelog.endTime)
        } catch (error) {
          throw new DatabaseError({
            cause: error instanceof Error ? error : undefined,
            message: `Failed to mark lifelog ${lifelog.id} as processed`,
          })
        }
      },

      getProcessedCount(): number {
        const stmt = db.prepare('SELECT COUNT(*) as count FROM processed_lifelogs')
        const result = stmt.get() as { count: number }
        return result.count
      },

      getLastProcessedTime(): string | null {
        const stmt = db.prepare(`
          SELECT processed_at
          FROM processed_lifelogs
          ORDER BY processed_at DESC
          LIMIT 1
        `)
        const result = stmt.get() as { processed_at: string } | null
        return result?.processed_at || null
      },

      close(): void {
        db.close()
      },
    } as const
  }),
  dependencies: [SqliteDatabase.Default],
}) {}
