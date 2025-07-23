import { Effect, Redacted } from 'effect'
import { ZodError } from 'zod'

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

    const request = (endpoint: string, params?: Record<string, string>) =>
      Effect.gen(function* () {
        const url = new URL(`${config.baseUrl}${endpoint}`)

        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value)
          })
        }

        const response = yield* Effect.promise(() =>
          fetch(url.toString(), {
            headers: {
              'X-API-Key': Redacted.value(config.apiKey),
              'Content-Type': 'application/json',
            },
          }),
        )

        if (!response.ok) {
          return yield* Effect.promise(() =>
            response
              .text()
              .then((statusText) =>
                Effect.fail(new LimitlessApiError({ status: response.status, statusText })),
              ),
          )
        }

        return yield* Effect.tryPromise(() => response.json())
      })

    return {
      getLifelogs(params?: GetLifelogsParams) {
        return Effect.gen(function* () {
          const queryParams: Record<string, string> = {}

          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined) {
                queryParams[key] = String(value)
              }
            })
          }

          const rawResponse = yield* request('/v1/lifelogs', queryParams)

          return yield* Effect.try({
            try: () => LifelogsResponseSchema.parse(rawResponse),
            catch: (error) =>
              new ValidationError({
                zodError: error instanceof ZodError ? error : undefined,
              }),
          })
        })
      },
    } as const
  }),
  dependencies: [LimitlessAIApiConfig.Default],
}) {}
