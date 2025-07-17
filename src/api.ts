import { env } from './env'
import { type LifelogsResponse, LifelogsResponseSchema } from './schemas'

const BASE_URL = 'https://api.limitless.ai'

/**
 * Client for interacting with the Limitless AI API.
 */
export class LimitlessApiClient {
  private readonly apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? env.LIMITLESS_API_KEY
  }

  private async request(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<unknown> {
    const url = new URL(`${BASE_URL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      )
    }

    return response.json()
  }

  /**
   * Fetches lifelogs from the Limitless AI API.
   *
   * @param params - Optional parameters for filtering the lifelogs.
   * @returns {Promise<LifelogsResponse>} A promise that resolves to the lifelogs response.
   * @throws {Error} If the API request fails or the response is invalid.
   */
  async getLifelogs(params?: {
    timezone?: string
    date?: string
    start?: string
    end?: string
    cursor?: string
    direction?: 'asc' | 'desc'
    includeMarkdown?: boolean
    includeHeadings?: boolean
    limit?: number
    isStarred?: boolean
  }): Promise<LifelogsResponse> {
    const queryParams: Record<string, string> = {}

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = String(value)
        }
      })
    }

    const rawResponse = await this.request('/v1/lifelogs', queryParams)
    return LifelogsResponseSchema.parse(rawResponse)
  }
}
