import { Database } from 'bun:sqlite'
import { DatabaseError } from './limitless/errors'
import type { Lifelog } from './limitless/schemas'

export class LifelogDatabase {
  private db: Database

  constructor(dbPath: string = 'lifelogs.db') {
    try {
      this.db = new Database(dbPath)
      this.initializeSchema()
    } catch (error) {
      throw new DatabaseError(`Failed to initialize database at ${dbPath}`, error as Error)
    }
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_lifelogs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_processed_lifelogs_processed_at
      ON processed_lifelogs(processed_at)
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_processed_lifelogs_updated_at
      ON processed_lifelogs(updated_at)
    `)
  }

  isProcessed(lifelogId: string): boolean {
    try {
      const stmt = this.db.prepare('SELECT 1 FROM processed_lifelogs WHERE id = ?')
      return stmt.get(lifelogId) !== null
    } catch (error) {
      throw new DatabaseError(
        `Failed to check if lifelog ${lifelogId} is processed`,
        error as Error,
      )
    }
  }

  markAsProcessed(lifelog: Lifelog): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO processed_lifelogs (id, title, updated_at, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `)

      stmt.run(lifelog.id, lifelog.title, lifelog.updatedAt, lifelog.startTime, lifelog.endTime)
    } catch (error) {
      throw new DatabaseError(`Failed to mark lifelog ${lifelog.id} as processed`, error as Error)
    }
  }

  getProcessedCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM processed_lifelogs')
    const result = stmt.get() as { count: number }
    return result.count
  }

  getLastProcessedTime(): string | null {
    const stmt = this.db.prepare(`
      SELECT processed_at
      FROM processed_lifelogs
      ORDER BY processed_at DESC
      LIMIT 1
    `)
    const result = stmt.get() as { processed_at: string } | null
    return result?.processed_at || null
  }

  close(): void {
    this.db.close()
  }
}
