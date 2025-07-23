import { Effect } from 'effect'

import { type GetLifelogsParams, LimitlessAIApi } from './api'
import type { Lifelog } from './schemas'

export class LifelogsService extends Effect.Service<LifelogsService>()(
  'limitless/LifelogsService',
  {
    effect: Effect.gen(function* () {
      const api = yield* LimitlessAIApi

      return {
        fetchLifelogsPage(cursor?: string) {
          return Effect.gen(function* () {
            const response = yield* api.getLifelogs({
              cursor,
              includeHeadings: true,
              includeMarkdown: true,
            })

            return {
              lifelogs: response.data.lifelogs,
              nextCursor: response.meta.lifelogs.nextCursor,
              count: response.meta.lifelogs.count,
            }
          })
        },

        fetchLifelogs(options: FetchLifelogsOptions = {}) {
          return Effect.gen(function* () {
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

              const response = yield* api.getLifelogs({
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
          })
        },
      } as const
    }),
    dependencies: [LimitlessAIApi.Default],
  },
) {}

export interface FetchLifelogsOptions extends Omit<GetLifelogsParams, 'limit'> {
  /** Maximum number of total items to fetch (default: 10) */
  limit?: number
}
