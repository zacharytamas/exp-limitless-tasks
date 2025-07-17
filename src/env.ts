import { z } from 'zod'

/**
 * Environment variables we support or require for the application to function properly.
 */
const envSchema = z.object({
  LIMITLESS_API_KEY: z.string().min(1, 'LIMITLESS_API_KEY is required'),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
