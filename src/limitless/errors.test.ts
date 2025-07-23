import { expect, test } from 'bun:test'
import { ZodError } from 'zod'
import { DatabaseError, LimitlessApiError, ProcessingError, ValidationError } from './errors'

test('ValidationError - should create error with validation details', () => {
  const zodError = new ZodError([])

  const error = new ValidationError({
    message: 'Validation failed for email field',
    zodError,
  })

  expect(error._tag).toBe('ValidationError')
  expect(error.message).toBe('Validation failed for email field')
  expect(error.zodError).toEqual(zodError)
  expect(error instanceof Error).toBe(true)
})

test('ValidationError - should work without validation details', () => {
  const error = new ValidationError({ message: 'Generic validation error' })

  expect(error._tag).toBe('ValidationError')
  expect(error.message).toBe('Generic validation error')
  expect(error.zodError).toBeUndefined()
})

test('DatabaseError - should create error with cause', () => {
  const causeError = new Error('SQLite constraint violation')
  const error = new DatabaseError({ message: 'Failed to insert record', cause: causeError })

  expect(error.name).toBe('DatabaseError')
  expect(error.message).toBe('Failed to insert record')
  expect(error.cause).toBe(causeError)
  expect(error instanceof Error).toBe(true)
})

test('DatabaseError - should work without cause', () => {
  const error = new DatabaseError({ message: 'Database connection failed' })

  expect(error.name).toBe('DatabaseError')
  expect(error.message).toBe('Database connection failed')
  expect(error.cause).toBeUndefined()
})

test('ProcessingError - should create error with lifelog ID and cause', () => {
  const causeError = new Error('Network timeout')
  const error = new ProcessingError({
    message: 'Failed to process lifelog',
    lifelogId: 'lifelog-123',
    cause: causeError,
  })

  expect(error.name).toBe('ProcessingError')
  expect(error.message).toBe('Failed to process lifelog')
  expect(error.lifelogId).toBe('lifelog-123')
  expect(error.cause).toBe(causeError)
  expect(error instanceof Error).toBe(true)
})

test('ProcessingError - should work with minimal parameters', () => {
  const error = new ProcessingError({ message: 'Generic processing error' })

  expect(error.name).toBe('ProcessingError')
  expect(error.message).toBe('Generic processing error')
  expect(error.lifelogId).toBeUndefined()
  expect(error.cause).toBeUndefined()
})

test('Error inheritance - should maintain Error prototype chain', () => {
  const apiError = new LimitlessApiError({})
  const validationError = new ValidationError({ message: 'Validation error' })
  const dbError = new DatabaseError({ message: 'DB error' })
  const processingError = new ProcessingError({ message: 'Processing error' })

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
  const error = new LimitlessApiError({ status: 500, statusText: 'Internal server error' })

  // Should be able to serialize key properties
  const serialized = {
    name: error._tag,
    statusCode: error.status,
    response: error.statusText,
  }

  expect(JSON.stringify(serialized)).toBeDefined()
  expect(JSON.parse(JSON.stringify(serialized))).toEqual({
    name: 'LimitlessApiError',
    statusCode: 500,
    response: 'Internal server error',
  })
})

test('Error chaining - should properly chain errors', () => {
  const rootCause = new Error('Root cause error')
  const dbError = new DatabaseError({ message: 'Database operation failed', cause: rootCause })
  const processingError = new ProcessingError({
    message: 'Processing failed due to database error',
    lifelogId: 'lifelog-456',
    cause: dbError,
  })

  expect(processingError.cause).toBe(dbError)
  expect(processingError.cause?.cause).toBe(rootCause)
  expect(processingError.lifelogId).toBe('lifelog-456')
})

test('Error matching - should work with instanceof checks', () => {
  const errors = [
    new LimitlessApiError({}),
    new ValidationError({ message: 'Validation error' }),
    new DatabaseError({ message: 'DB error' }),
    new ProcessingError({ message: 'Processing error' }),
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
