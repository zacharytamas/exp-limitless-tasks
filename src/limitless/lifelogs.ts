import type { LimitlessApiClient } from './api'
import type { Lifelog } from './schemas'

export class LifelogService {
  private client: LimitlessApiClient

  constructor(client: LimitlessApiClient) {
    this.client = client
  }

  async fetchAllLifelogs(): Promise<Lifelog[]> {
    const allLifelogs: Lifelog[] = []
    let cursor: string | undefined

    do {
      const response = await this.client.getLifelogs({
        cursor: cursor || undefined,
        includeMarkdown: true,
        includeHeadings: true,
      })

      allLifelogs.push(...response.data.lifelogs)
      cursor = response.meta.lifelogs.nextCursor
    } while (cursor)

    return allLifelogs
  }

  async fetchLifelogsPage(cursor?: string): Promise<{
    lifelogs: Lifelog[]
    nextCursor?: string
    count: number
  }> {
    const response = await this.client.getLifelogs({
      cursor,
      includeMarkdown: true,
      includeHeadings: true,
    })

    return {
      lifelogs: response.data.lifelogs,
      nextCursor: response.meta.lifelogs.nextCursor,
      count: response.meta.lifelogs.count,
    }
  }
}
