import { Effect, Redacted } from 'effect'

import env from '../env'
import { LimitlessApiError, ValidationError } from './errors'
import { LifelogsResponseSchema } from './schemas'

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

export class LimitlessAIApiConfig extends Effect.Service<LimitlessAIApiConfig>()(
  'limitless/Config',
  {
    effect: Effect.gen(function* () {
      const apiKey = yield* env.limitlessApiKey
      const baseUrl = yield* env.limitlessApiBaseUrl
      return { apiKey, baseUrl }
    }),
  },
) {}

export class LimitlessAIApi extends Effect.Service<LimitlessAIApi>()('limitless/ApiClient', {
  effect: Effect.gen(function* () {
    const config = yield* LimitlessAIApiConfig

    async function request(endpoint: string, params?: Record<string, string>): Promise<unknown> {
      const url = new URL(`${config.baseUrl}${endpoint}`)

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value)
        })
      }

      const response = await fetch(url.toString(), {
        headers: { 'X-API-Key': Redacted.value(config.apiKey), 'Content-Type': 'application/json' },
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

    return {
      async getLifelogs(params?: GetLifelogsParams) {
        const queryParams: Record<string, string> = {}

        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams[key] = String(value)
            }
          })
        }

        try {
          const rawResponse = await request('/v1/lifelogs', queryParams)
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
      },
    } as const
  }),
  dependencies: [LimitlessAIApiConfig.Default],
}) {}
