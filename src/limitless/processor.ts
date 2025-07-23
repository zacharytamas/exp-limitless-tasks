import { Effect } from 'effect'

import { LifelogDatabase } from '../database'
import { ProcessingError } from './errors'
import { LifelogsService } from './lifelogs'
import type { Lifelog } from './schemas'

export class LifelogProcessor extends Effect.Service<LifelogProcessor>()(
  'limitless/LifelogProcessor',
  {
    effect: Effect.gen(function* () {
      const db = yield* LifelogDatabase
      const lifelogs = yield* LifelogsService

      const processLifelog = (_lifelog: Lifelog) =>
        Effect.gen(function* () {
          // TODO: Find the content nodes that are relevant to the user's request.
          // TODO: Determine initial supported actions:
          //       - "I drank 12oz of water
          //       - "We need more toothpaste for the boys"

          // TEMP: Simulate processing time
          yield* Effect.sleep(0)
        })

      return {
        processAllLifelogs() {
          return Effect.gen(function* () {
            console.log('Fetching all lifelogs...')

            const allLifelogs: Lifelog[] = yield* lifelogs.fetchLifelogs()

            console.log(`Found ${allLifelogs.length} lifelogs`)

            const newLifelogs: Lifelog[] = []
            const errors: ProcessingError[] = []
            let processed = 0
            let skipped = 0
            let failed = 0

            for (const lifelog of allLifelogs) {
              try {
                if (db.isProcessed(lifelog.id)) {
                  console.log(`Skipping already processed lifelog: ${lifelog.title}`)
                  skipped++
                  continue
                }

                yield* processLifelog(lifelog)
                db.markAsProcessed(lifelog)
                newLifelogs.push(lifelog)
                processed++
              } catch (error) {
                console.error(`Failed to process lifelog ${lifelog.id}: ${error}`)
                const processingError = new ProcessingError({
                  message: `Failed to process lifelog: ${lifelog.title}`,
                  lifelogId: lifelog.id,
                  cause: error as Error,
                })
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
          })
        },
        getStats: (): {
          totalProcessed: number
          lastProcessedTime: string | null
        } => ({
          totalProcessed: db.getProcessedCount(),
          lastProcessedTime: db.getLastProcessedTime(),
        }),

        close(): void {
          db.close()
        },
      } as const
    }),
    dependencies: [LifelogDatabase.Default, LifelogsService.Default],
  },
) {}
