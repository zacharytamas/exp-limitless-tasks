import { Config } from 'effect'

export default {
  databasePath: Config.string('DATABASE_PATH').pipe(Config.withDefault('lifelogs.db')),
  limitlessApiKey: Config.redacted('LIMITLESS_API_KEY'),
  limitlessApiBaseUrl: Config.string('LIMITLESS_API_BASE_URL').pipe(
    Config.withDefault('https://api.limitless.ai'),
  ),
}
