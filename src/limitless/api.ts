import { env } from '../env'
import { LimitlessApiError, ValidationError } from './errors'
import { type LifelogsResponse, LifelogsResponseSchema } from './schemas'

const BASE_URL = 'https://api.limitless.ai'

export interface GetLifelogsParams {
  /** Timezone for date filtering */
  timezone?: string
  /** Specific date to filter by (YYYY-MM-DD format) */
  date?: string
  /** Start date/time for filtering */
  start?: string
  /** End date/time for filtering */
  end?: string
  /** Pagination cursor for fetching next page */
  cursor?: string
  /** Sort direction for results */
  direction?: 'asc' | 'desc'
  /** Whether to include markdown content in response */
  includeMarkdown?: boolean
  /** Whether to include headings in response */
  includeHeadings?: boolean
  /** Maximum number of items per request */
  limit?: number
  /** Filter by starred status */
  isStarred?: boolean
}

/**
 * Client for interacting with the Limitless AI API.
 */
export class LimitlessApiClient {
  private readonly apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? env.LIMITLESS_API_KEY
  }

  private async request(endpoint: string, params?: Record<string, string>): Promise<unknown> {
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
      const responseText = await response.text()
      throw new LimitlessApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        responseText,
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
  async getLifelogs(params?: GetLifelogsParams): Promise<LifelogsResponse> {
    const queryParams: Record<string, string> = {}

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = String(value)
        }
      })
    }

    try {
      const rawResponse = await this.request('/v1/lifelogs', queryParams)
      return LifelogsResponseSchema.parse(rawResponse)
    } catch (error) {
      if (error instanceof LimitlessApiError) {
        throw error
      }
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('API response validation failed', error)
      }
      throw error
    }
  }
}
