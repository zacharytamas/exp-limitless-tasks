import { Effect } from 'effect'
import { UnknownException } from 'effect/Cause'

import { type GetLifelogsParams, LimitlessAIApi } from './limitless/api'
import type { Lifelog, LifelogsResponse } from './limitless/schemas'

export const mockLimitlessAIApi = () => {
  let callHistory: Array<{
    params?: GetLifelogsParams
    timestamp: number
  }> = []
  let responses: LifelogsResponse[] = []
  let currentResponseIndex = 0

  const mock = new LimitlessAIApi({
    getLifelogs(params?: GetLifelogsParams) {
      return Effect.gen(function* () {
        callHistory.push({ params, timestamp: Date.now() })

        const response = responses[currentResponseIndex]
        if (!response) {
          return yield* Effect.fail(
            new UnknownException(undefined, 'Mock client: No more responses configured'),
          )
        }
        currentResponseIndex++

        // Simulate network delay
        yield* Effect.sleep(0)

        return yield* Effect.succeed(response)
      })
    },
  })

  return {
    mock,
    getCallHistory() {
      return [...callHistory]
    },

    getCallCount() {
      return callHistory.length
    },

    reset() {
      currentResponseIndex = 0
      callHistory = []
      responses = []
    },

    addResponse(response: LifelogsResponse) {
      responses.push(response)
    },
  }
}

export function createMockLifelog(overrides: Partial<Lifelog> = {}): Lifelog {
  return {
    id: `lifelog-${Math.random().toString(36).substring(2, 11)}`,
    title: 'Test Lifelog',
    markdown: '# Test Content\n\nThis is a test lifelog.',
    contents: [
      {
        type: 'heading1',
        content: 'Test Content',
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T10:00:05Z',
        startOffsetMs: 0,
        endOffsetMs: 5000,
        children: [],
      },
      {
        type: 'paragraph',
        content: 'This is a test lifelog.',
        startTime: '2025-01-01T10:00:05Z',
        endTime: '2025-01-01T10:00:10Z',
        startOffsetMs: 5000,
        endOffsetMs: 10000,
        children: [],
      },
    ],
    startTime: '2025-01-01T10:00:00Z',
    endTime: '2025-01-01T10:05:00Z',
    isStarred: true,
    updatedAt: '2025-01-01T10:05:00Z',
    ...overrides,
  }
}

export function createMockLifelogsResponse(
  lifelogs: Lifelog[],
  nextCursor?: string,
): LifelogsResponse {
  return {
    data: {
      lifelogs,
    },
    meta: {
      lifelogs: {
        ...(nextCursor && { nextCursor }),
        count: lifelogs.length,
      },
    },
  }
}
