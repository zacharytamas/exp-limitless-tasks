import { LifelogDatabase } from '../database'
import type { LimitlessApiClient } from './api'
import { LimitlessApiError, ProcessingError, ValidationError } from './errors'
import { LifelogService } from './lifelogs'
import type { Lifelog } from './schemas'

export class LifelogProcessor {
  private service: LifelogService
  private database: LifelogDatabase

  constructor(client: LimitlessApiClient, dbPath?: string) {
    this.service = new LifelogService(client)
    this.database = new LifelogDatabase(dbPath)
  }

  async processAllLifelogs(): Promise<{
    fetched: number
    processed: number
    skipped: number
    failed: number
    newLifelogs: Lifelog[]
    errors: ProcessingError[]
  }> {
    console.log('Fetching all lifelogs...')

    let allLifelogs: Lifelog[]
    try {
      allLifelogs = await this.service.fetchLifelogs()
    } catch (error) {
      if (error instanceof LimitlessApiError) {
        throw new ProcessingError('Failed to fetch starred lifelogs from API', undefined, error)
      }
      if (error instanceof ValidationError) {
        throw new ProcessingError('API response validation failed', undefined, error)
      }
      throw error
    }

    console.log(`Found ${allLifelogs.length} lifelogs`)

    const newLifelogs: Lifelog[] = []
    const errors: ProcessingError[] = []
    let processed = 0
    let skipped = 0
    let failed = 0

    for (const lifelog of allLifelogs) {
      try {
        if (this.database.isProcessed(lifelog.id)) {
          console.log(`Skipping already processed lifelog: ${lifelog.title}`)
          skipped++
          continue
        }

        await this.processLifelog(lifelog)
        this.database.markAsProcessed(lifelog)
        newLifelogs.push(lifelog)
        processed++
      } catch (error) {
        console.error(`Failed to process lifelog ${lifelog.id}: ${error}`)
        const processingError = new ProcessingError(
          `Failed to process lifelog: ${lifelog.title}`,
          lifelog.id,
          error as Error,
        )
        errors.push(processingError)
        failed++
      }
    }

    return {
      fetched: allLifelogs.length,
      processed,
      skipped,
      failed,
      newLifelogs,
      errors,
    }
  }

  private async processLifelog(lifelog: Lifelog): Promise<void> {
    // TODO: Find the content nodes that are relevant to the user's request.
    // TODO: Determine initial supported actions:
    //       - "I drank 12oz of water
    //       - "We need more toothpaste for the boys"

    // TEMP: Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  getStats(): {
    totalProcessed: number
    lastProcessedTime: string | null
  } {
    return {
      totalProcessed: this.database.getProcessedCount(),
      lastProcessedTime: this.database.getLastProcessedTime(),
    }
  }

  close(): void {
    this.database.close()
  }
}
