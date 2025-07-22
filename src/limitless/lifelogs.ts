import type { GetLifelogsParams, LimitlessApiClient } from './api'
import type { Lifelog } from './schemas'

export interface FetchLifelogsOptions extends Omit<GetLifelogsParams, 'limit'> {
  /** Maximum number of total items to fetch (default: 10) */
  limit?: number
}

export class LifelogService {
  private client: LimitlessApiClient

  constructor(client: LimitlessApiClient) {
    this.client = client
  }

  async fetchLifelogs(options: FetchLifelogsOptions = {}): Promise<Lifelog[]> {
    const {
      limit = 10,
      includeMarkdown = true,
      includeHeadings = true,
      direction = 'desc',
      ...apiParams
    } = options

    const allLifelogs: Lifelog[] = []
    let cursor: string | undefined

    do {
      // Cap per-request limit at 10 (API maximum)
      const remainingItems = limit - allLifelogs.length
      const perRequestLimit = Math.min(10, remainingItems)

      if (perRequestLimit <= 0) {
        break
      }

      const response = await this.client.getLifelogs({
        ...apiParams,
        cursor: cursor || undefined,
        includeMarkdown,
        includeHeadings,
        direction,
        limit: perRequestLimit,
      })

      allLifelogs.push(...response.data.lifelogs)
      cursor = response.meta.lifelogs.nextCursor

      // Stop if we've reached our limit
      if (allLifelogs.length >= limit) {
        break
      }
    } while (cursor)

    return allLifelogs.slice(0, limit)
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
