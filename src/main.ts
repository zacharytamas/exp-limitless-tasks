import { LimitlessApiClient } from './limitless/api'
import { ProcessingError } from './limitless/errors'
import { LifelogProcessor } from './limitless/processor'

async function main() {
  console.log('🚀 Starting Limitless AI lifelog processor...')

  const client = new LimitlessApiClient()
  const processor = new LifelogProcessor(client)

  try {
    const startTime = Date.now()
    const result = await processor.processAllLifelogs()
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\n📊 Processing Results:')
    console.log(`  Fetched: ${result.fetched} lifelogs`)
    console.log(`  Processed: ${result.processed} new lifelogs`)
    console.log(`  Skipped: ${result.skipped} already processed`)
    console.log(`  Failed: ${result.failed} processing errors`)
    console.log(`  Duration: ${duration}s`)

    if (result.errors.length > 0) {
      console.log('\n❌ Processing Errors:')
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`)
        if (error.lifelogId) {
          console.log(`     Lifelog ID: ${error.lifelogId}`)
        }
      })
    }

    if (result.processed > 0) {
      console.log('\n✅ Successfully processed new lifelogs:')
      result.newLifelogs.forEach((lifelog, index) => {
        console.log(`  ${index + 1}. "${lifelog.title}" (${lifelog.id})`)
      })
    }

    const stats = processor.getStats()
    console.log('\n📈 Database Stats:')
    console.log(`  Total processed: ${stats.totalProcessed} lifelogs`)
    console.log(`  Last processed: ${stats.lastProcessedTime || 'Never'}`)
  } catch (error) {
    console.error('\n💥 Fatal Error:')
    if (error instanceof ProcessingError) {
      console.error(`  ${error.message}`)
      if (error.cause) {
        console.error(`  Cause: ${error.cause.message}`)
      }
    } else {
      console.error(`  ${error}`)
    }
    process.exit(1)
  } finally {
    processor.close()
  }

  console.log('\n🎉 Processing complete!')
}

// Only run if this file was executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
