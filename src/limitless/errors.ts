import { Data } from 'effect'
import type { ZodError } from 'zod'

export class LimitlessApiError extends Data.TaggedError('LimitlessApiError')<{
  status?: number
  statusText?: string
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  message: string
  zodError?: ZodError
}> {}

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  cause?: Error
  message?: string
}> {}

export class ProcessingError extends Data.TaggedError('ProcessingError')<{
  lifelogId?: string
  cause?: Error
  message: string
}> {}
