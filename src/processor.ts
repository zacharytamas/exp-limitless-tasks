import type { LimitlessApiClient } from './api'
import { LifelogDatabase } from './database'
import { LifelogService } from './lifelogs'
import type { Lifelog } from './schemas'

export class LifelogProcessor {
  private service: LifelogService
  private database: LifelogDatabase

  constructor(client: LimitlessApiClient, dbPath?: string) {
    this.service = new LifelogService(client)
    this.database = new LifelogDatabase(dbPath)
  }

  async processStarredLifelogs(): Promise<{
    fetched: number
    processed: number
    skipped: number
    newLifelogs: Lifelog[]
  }> {
    console.log('Fetching starred lifelogs...')
    const allStarredLifelogs = await this.service.fetchStarredLifelogs()

    console.log(`Found ${allStarredLifelogs.length} starred lifelogs`)

    const newLifelogs: Lifelog[] = []
    let processed = 0
    let skipped = 0

    for (const lifelog of allStarredLifelogs) {
      if (this.database.isProcessed(lifelog.id)) {
        console.log(`Skipping already processed lifelog: ${lifelog.title}`)
        skipped++
        continue
      }

      console.log(`Processing new lifelog: ${lifelog.title}`)

      await this.processLifelog(lifelog)

      this.database.markAsProcessed(lifelog)
      newLifelogs.push(lifelog)
      processed++
    }

    return {
      fetched: allStarredLifelogs.length,
      processed,
      skipped,
      newLifelogs,
    }
  }

  private async processLifelog(lifelog: Lifelog): Promise<void> {
    console.log(`Processing lifelog "${lifelog.title}" (${lifelog.id})`)
    console.log(`  Start: ${lifelog.startTime}`)
    console.log(`  End: ${lifelog.endTime}`)
    console.log(`  Content nodes: ${lifelog.contents.length}`)

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
