import { expect, test } from 'bun:test'
import { DatabaseError, LimitlessApiError, ProcessingError, ValidationError } from './errors'

test('LimitlessApiError - should create error with status code and response', () => {
  const error = new LimitlessApiError(
    'API request failed: 401 Unauthorized',
    401,
    '{"error": "Invalid API key"}',
  )

  expect(error.name).toBe('LimitlessApiError')
  expect(error.message).toBe('API request failed: 401 Unauthorized')
  expect(error.statusCode).toBe(401)
  expect(error.response).toBe('{"error": "Invalid API key"}')
  expect(error instanceof Error).toBe(true)
})

test('LimitlessApiError - should work without optional parameters', () => {
  const error = new LimitlessApiError('Generic API error')

  expect(error.name).toBe('LimitlessApiError')
  expect(error.message).toBe('Generic API error')
  expect(error.statusCode).toBeUndefined()
  expect(error.response).toBeUndefined()
})

test('ValidationError - should create error with validation details', () => {
  const validationDetails = {
    field: 'email',
    expected: 'string',
    received: 'number',
  }

  const error = new ValidationError('Validation failed for email field', validationDetails)

  expect(error.name).toBe('ValidationError')
  expect(error.message).toBe('Validation failed for email field')
  expect(error.validationDetails).toEqual(validationDetails)
  expect(error instanceof Error).toBe(true)
})

test('ValidationError - should work without validation details', () => {
  const error = new ValidationError('Generic validation error')

  expect(error.name).toBe('ValidationError')
  expect(error.message).toBe('Generic validation error')
  expect(error.validationDetails).toBeUndefined()
})

test('DatabaseError - should create error with cause', () => {
  const causeError = new Error('SQLite constraint violation')
  const error = new DatabaseError('Failed to insert record', causeError)

  expect(error.name).toBe('DatabaseError')
  expect(error.message).toBe('Failed to insert record')
  expect(error.cause).toBe(causeError)
  expect(error instanceof Error).toBe(true)
})

test('DatabaseError - should work without cause', () => {
  const error = new DatabaseError('Database connection failed')

  expect(error.name).toBe('DatabaseError')
  expect(error.message).toBe('Database connection failed')
  expect(error.cause).toBeUndefined()
})

test('ProcessingError - should create error with lifelog ID and cause', () => {
  const causeError = new Error('Network timeout')
  const error = new ProcessingError('Failed to process lifelog', 'lifelog-123', causeError)

  expect(error.name).toBe('ProcessingError')
  expect(error.message).toBe('Failed to process lifelog')
  expect(error.lifelogId).toBe('lifelog-123')
  expect(error.cause).toBe(causeError)
  expect(error instanceof Error).toBe(true)
})

test('ProcessingError - should work with minimal parameters', () => {
  const error = new ProcessingError('Generic processing error')

  expect(error.name).toBe('ProcessingError')
  expect(error.message).toBe('Generic processing error')
  expect(error.lifelogId).toBeUndefined()
  expect(error.cause).toBeUndefined()
})

test('Error inheritance - should maintain Error prototype chain', () => {
  const apiError = new LimitlessApiError('API error')
  const validationError = new ValidationError('Validation error')
  const dbError = new DatabaseError('DB error')
  const processingError = new ProcessingError('Processing error')

  // All should be instances of Error
  expect(apiError instanceof Error).toBe(true)
  expect(validationError instanceof Error).toBe(true)
  expect(dbError instanceof Error).toBe(true)
  expect(processingError instanceof Error).toBe(true)

  // Should have correct stack traces
  expect(apiError.stack).toBeDefined()
  expect(validationError.stack).toBeDefined()
  expect(dbError.stack).toBeDefined()
  expect(processingError.stack).toBeDefined()
})

test('Error serialization - should be JSON serializable', () => {
  const error = new LimitlessApiError('API error', 500, 'Internal server error')

  // Should be able to serialize key properties
  const serialized = {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    response: error.response,
  }

  expect(JSON.stringify(serialized)).toBeDefined()
  expect(JSON.parse(JSON.stringify(serialized))).toEqual({
    name: 'LimitlessApiError',
    message: 'API error',
    statusCode: 500,
    response: 'Internal server error',
  })
})

test('Error chaining - should properly chain errors', () => {
  const rootCause = new Error('Root cause error')
  const dbError = new DatabaseError('Database operation failed', rootCause)
  const processingError = new ProcessingError(
    'Processing failed due to database error',
    'lifelog-456',
    dbError,
  )

  expect(processingError.cause).toBe(dbError)
  expect(processingError.cause?.cause).toBe(rootCause)
  expect(processingError.lifelogId).toBe('lifelog-456')
})

test('Error matching - should work with instanceof checks', () => {
  const errors = [
    new LimitlessApiError('API error'),
    new ValidationError('Validation error'),
    new DatabaseError('DB error'),
    new ProcessingError('Processing error'),
  ]

  expect(errors[0] instanceof LimitlessApiError).toBe(true)
  expect(errors[0] instanceof ValidationError).toBe(false)

  expect(errors[1] instanceof ValidationError).toBe(true)
  expect(errors[1] instanceof DatabaseError).toBe(false)

  expect(errors[2] instanceof DatabaseError).toBe(true)
  expect(errors[2] instanceof ProcessingError).toBe(false)

  expect(errors[3] instanceof ProcessingError).toBe(true)
  expect(errors[3] instanceof LimitlessApiError).toBe(false)
})
