import { Data } from 'effect'
import type { ZodError } from 'zod'

export class LimitlessApiError extends Data.TaggedError('LimitlessApiError')<{
  status?: number
  statusText?: string
}> {}

export class ValidationErrorEffect extends Data.TaggedError('ValidationError')<{
  zodError?: ZodError
}> {}

export class ValidationError extends Error {
  constructor(
    message: string,
    public validationDetails?: unknown,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  cause?: Error
  message?: string
}> {}

export class ProcessingError extends Data.TaggedError('ProcessingError')<{
  lifelogId?: string
  cause?: Error
  message: string
}> {}
