import { expect, test } from 'bun:test'
import {
  ContentNodeSchema,
  LifelogSchema,
  LifelogsResponseSchema,
  MetaLifelogsSchema,
} from './schemas'

test('ContentNodeSchema - should validate valid content node', () => {
  const validContentNode = {
    type: 'paragraph',
    content: 'This is a test paragraph.',
    startTime: '2025-01-01T10:00:00Z',
    endTime: '2025-01-01T10:00:05Z',
    startOffsetMs: 0,
    endOffsetMs: 5000,
    children: [],
  }

  const result = ContentNodeSchema.safeParse(validContentNode)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.type).toBe('paragraph')
    expect(result.data.content).toBe('This is a test paragraph.')
    expect(result.data.children).toHaveLength(0)
  }
})

test('ContentNodeSchema - should validate content node with speaker info', () => {
  const contentNodeWithSpeaker = {
    type: 'blockquote',
    content: 'User said something important.',
    startTime: '2025-01-01T10:00:00Z',
    endTime: '2025-01-01T10:00:05Z',
    startOffsetMs: 0,
    endOffsetMs: 5000,
    children: [],
    speakerName: 'John Doe',
    speakerIdentifier: 'user' as const,
  }

  const result = ContentNodeSchema.safeParse(contentNodeWithSpeaker)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.speakerName).toBe('John Doe')
    expect(result.data.speakerIdentifier).toBe('user')
  }
})

test('ContentNodeSchema - should validate nested content nodes', () => {
  const nestedContentNode = {
    type: 'heading1',
    content: 'Main Heading',
    startTime: '2025-01-01T10:00:00Z',
    endTime: '2025-01-01T10:00:10Z',
    startOffsetMs: 0,
    endOffsetMs: 10000,
    children: [
      {
        type: 'paragraph',
        content: 'Nested paragraph',
        startTime: '2025-01-01T10:00:05Z',
        endTime: '2025-01-01T10:00:10Z',
        startOffsetMs: 5000,
        endOffsetMs: 10000,
        children: [],
      },
    ],
  }

  const result = ContentNodeSchema.safeParse(nestedContentNode)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.children).toHaveLength(1)
    expect(result.data.children?.[0]?.type).toBe('paragraph')
  }
})

test('ContentNodeSchema - should reject invalid content node', () => {
  const invalidContentNode = {
    type: 'paragraph',
    content: 'Valid content',
    // Missing required fields
    startOffsetMs: 'invalid', // Should be number
    children: 'not an array', // Should be array
  }

  const result = ContentNodeSchema.safeParse(invalidContentNode)
  expect(result.success).toBe(false)
})

test('LifelogSchema - should validate valid lifelog', () => {
  const validLifelog = {
    id: 'lifelog-123',
    title: 'Test Lifelog',
    markdown: '# Test\n\nThis is a test lifelog.',
    contents: [
      {
        type: 'heading1',
        content: 'Test',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T10:00:05Z',
        startOffsetMs: 0,
        endOffsetMs: 5000,
        children: [],
      },
    ],
    startTime: '2025-01-01T10:00:00Z',
    endTime: '2025-01-01T10:05:00Z',
    isStarred: true,
    updatedAt: '2025-01-01T10:05:00Z',
  }

  const result = LifelogSchema.safeParse(validLifelog)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.id).toBe('lifelog-123')
    expect(result.data.isStarred).toBe(true)
    expect(result.data.contents).toHaveLength(1)
  }
})

test('LifelogSchema - should handle null markdown', () => {
  const lifelogWithNullMarkdown = {
    id: 'lifelog-456',
    title: 'No Markdown Lifelog',
    markdown: null,
    contents: [],
    startTime: '2025-01-01T10:00:00Z',
    endTime: '2025-01-01T10:05:00Z',
    isStarred: false,
    updatedAt: '2025-01-01T10:05:00Z',
  }

  const result = LifelogSchema.safeParse(lifelogWithNullMarkdown)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.markdown).toBeNull()
  }
})

test('MetaLifelogsSchema - should validate with nextCursor', () => {
  const metaWithCursor = {
    nextCursor: 'cursor-123',
    count: 5,
  }

  const result = MetaLifelogsSchema.safeParse(metaWithCursor)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.nextCursor).toBe('cursor-123')
    expect(result.data.count).toBe(5)
  }
})

test('MetaLifelogsSchema - should validate without nextCursor', () => {
  const metaWithoutCursor = {
    count: 3,
  }

  const result = MetaLifelogsSchema.safeParse(metaWithoutCursor)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.nextCursor).toBeUndefined()
    expect(result.data.count).toBe(3)
  }
})

test('LifelogsResponseSchema - should validate complete API response', () => {
  const completeResponse = {
    data: {
      lifelogs: [
        {
          id: 'lifelog-1',
          title: 'First Lifelog',
          markdown: '# First\n\nContent here.',
          contents: [
            {
              type: 'heading1',
              content: 'First',
              startTime: '2025-01-01T10:00:00Z',
              endTime: '2025-01-01T10:00:05Z',
              startOffsetMs: 0,
              endOffsetMs: 5000,
              children: [],
            },
          ],
          startTime: '2025-01-01T10:00:00Z',
          endTime: '2025-01-01T10:05:00Z',
          isStarred: true,
          updatedAt: '2025-01-01T10:05:00Z',
        },
      ],
    },
    meta: {
      lifelogs: {
        nextCursor: 'next-page-cursor',
        count: 1,
      },
    },
  }

  const result = LifelogsResponseSchema.safeParse(completeResponse)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.data.lifelogs).toHaveLength(1)
    expect(result.data.meta.lifelogs.count).toBe(1)
    expect(result.data.meta.lifelogs.nextCursor).toBe('next-page-cursor')
  }
})

test('LifelogsResponseSchema - should validate empty response', () => {
  const emptyResponse = {
    data: {
      lifelogs: [],
    },
    meta: {
      lifelogs: {
        count: 0,
      },
    },
  }

  const result = LifelogsResponseSchema.safeParse(emptyResponse)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.data.lifelogs).toHaveLength(0)
    expect(result.data.meta.lifelogs.count).toBe(0)
    expect(result.data.meta.lifelogs.nextCursor).toBeUndefined()
  }
})

test('LifelogsResponseSchema - should reject malformed response', () => {
  const malformedResponse = {
    data: {
      // Missing lifelogs array
    },
    meta: {
      lifelogs: {
        count: 'not a number', // Should be number
      },
    },
  }

  const result = LifelogsResponseSchema.safeParse(malformedResponse)
  expect(result.success).toBe(false)
})

test('Schema validation - should provide detailed error information', () => {
  const invalidLifelog = {
    id: 123, // Should be string
    title: null, // Should be string
    isStarred: 'yes', // Should be boolean
    contents: 'not an array', // Should be array
  }

  const result = LifelogSchema.safeParse(invalidLifelog)
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.length).toBeGreaterThan(0)
    // Check that we get meaningful error messages
    const errorMessages = result.error.issues.map((issue) => issue.message)
    expect(errorMessages.some((msg) => msg.includes('string'))).toBe(true)
  }
})
