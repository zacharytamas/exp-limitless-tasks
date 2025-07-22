import { Data } from 'effect'

export class LimitlessApiErrorEffect extends Data.TaggedError('LimitlessApiError')<{
  status: number
  statusText: string
}> {}

export class LimitlessApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: string,
  ) {
    super(message)
    this.name = 'LimitlessApiError'
  }
}

export class ValidationErrorEffect extends Data.TaggedError('ValidationError') {}

export class ValidationError extends Error {
  constructor(
    message: string,
    public validationDetails?: unknown,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseErrorEffect extends Data.TaggedError('DatabaseError')<{ cause?: Error }> {}

export class DatabaseError extends Error {
  public override cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'DatabaseError'
    this.cause = cause
  }
}

export class ProcessingErrorEffect extends Data.TaggedError('ProcessingError') {}

export class ProcessingError extends Error {
  public lifelogId?: string
  public override cause?: Error

  constructor(message: string, lifelogId?: string, cause?: Error) {
    super(message)
    this.name = 'ProcessingError'
    this.lifelogId = lifelogId
    this.cause = cause
  }
}
