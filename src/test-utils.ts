import type { LimitlessApiClient } from './limitless/api'
import type { Lifelog, LifelogsResponse } from './limitless/schemas'

export class MockLimitlessApiClient implements Pick<LimitlessApiClient, 'getLifelogs'> {
  private responses: LifelogsResponse[] = []
  private currentResponseIndex = 0
  private callHistory: Array<{
    params?: Parameters<LimitlessApiClient['getLifelogs']>[0]
    timestamp: number
  }> = []

  constructor(responses: LifelogsResponse[] = []) {
    this.responses = responses
  }

  async getLifelogs(
    params?: Parameters<LimitlessApiClient['getLifelogs']>[0],
  ): Promise<LifelogsResponse> {
    this.callHistory.push({
      params,
      timestamp: Date.now(),
    })

    if (this.currentResponseIndex >= this.responses.length) {
      throw new Error('Mock client: No more responses configured')
    }

    const response = this.responses[this.currentResponseIndex]!
    this.currentResponseIndex++

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10))

    return response
  }

  // Test utilities
  getCallHistory() {
    return [...this.callHistory]
  }

  getCallCount() {
    return this.callHistory.length
  }

  reset() {
    this.currentResponseIndex = 0
    this.callHistory = []
    this.responses = []
  }

  addResponse(response: LifelogsResponse) {
    this.responses.push(response)
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
