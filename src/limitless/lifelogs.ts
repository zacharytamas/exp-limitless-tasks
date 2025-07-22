import type { GetLifelogsParams, LimitlessApiClient } from './api'
import type { Lifelog } from './schemas'

export interface FetchLifelogsOptions extends GetLifelogsParams {
  /** Maximum number of API requests to make (default: 20) */
  maxRequests?: number
}

export class LifelogService {
  private client: LimitlessApiClient

  constructor(client: LimitlessApiClient) {
    this.client = client
  }

  async fetchLifelogs(options: FetchLifelogsOptions = {}): Promise<Lifelog[]> {
    const {
      maxRequests = 1,
      limit = 100,
      includeMarkdown = true,
      includeHeadings = true,
      direction = 'desc',
      ...apiParams
    } = options

    const allLifelogs: Lifelog[] = []
    let cursor: string | undefined
    let requestCount = 0

    do {
      if (requestCount >= maxRequests) {
        break
      }

      const response = await this.client.getLifelogs({
        ...apiParams,
        cursor: cursor || undefined,
        includeMarkdown,
        includeHeadings,
        direction,
        limit,
      })

      allLifelogs.push(...response.data.lifelogs)
      cursor = response.meta.lifelogs.nextCursor
      requestCount++
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
