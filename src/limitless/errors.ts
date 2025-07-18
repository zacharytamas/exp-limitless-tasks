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

export class ValidationError extends Error {
  constructor(
    message: string,
    public validationDetails?: unknown,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  public override cause?: Error

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = 'DatabaseError'
    this.cause = cause
  }
}

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
