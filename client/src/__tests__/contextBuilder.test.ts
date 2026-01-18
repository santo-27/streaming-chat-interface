import { buildContext } from '../utils/contextBuilder'
import type { Conversation, Message } from '../types'


function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content: 'test message',
    status: 'complete',
    format: 'text',
    timestamp: Date.now(),
    ...overrides,
  }
}

function createConversation(messages: Message[], summary?: { text: string; messageCountAtUpdate: number }): Conversation {
  return {
    id: 'conv-1',
    title: 'Test Conversation',
    messages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    summary,
  }
}

describe('buildContext', () => {
  it('returns empty relevantMessages for empty conversation', () => {
    const conversation = createConversation([])
    const context = buildContext(conversation)

    expect(context.relevantMessages).toEqual([])
    expect(context.meta.totalMessageCount).toBe(0)
  })

  it('returns last N messages by default (6)', () => {
    const messages = Array.from({ length: 10 }, (_, i) =>
      createMessage({ content: `Message ${i}` })
    )
    const conversation = createConversation(messages)
    const context = buildContext(conversation)

    expect(context.relevantMessages).toHaveLength(6)
    expect(context.relevantMessages[0].content).toBe('Message 4')
    expect(context.relevantMessages[5].content).toBe('Message 9')
  })

  it('respects custom recentMessageCount', () => {
    const messages = Array.from({ length: 10 }, (_, i) =>
      createMessage({ content: `Message ${i}` })
    )
    const conversation = createConversation(messages)
    const context = buildContext(conversation, 3)

    expect(context.relevantMessages).toHaveLength(3)
    expect(context.relevantMessages[0].content).toBe('Message 7')
  })

  it('filters out error messages', () => {
    const messages = [
      createMessage({ content: 'User message', role: 'user' }),
      createMessage({ content: 'Assistant response', role: 'assistant' }),
      createMessage({ content: 'Error occurred', role: 'assistant', isError: true }),
      createMessage({ content: 'Follow up', role: 'user' }),
    ]
    const conversation = createConversation(messages)
    const context = buildContext(conversation)

    expect(context.relevantMessages).toHaveLength(3)
    expect(context.relevantMessages.map(m => m.content)).not.toContain('Error occurred')
    expect(context.meta.totalMessageCount).toBe(3)
  })

  it('includes summary text when available', () => {
    const conversation = createConversation(
      [createMessage()],
      { text: 'Previous conversation about testing', messageCountAtUpdate: 5 }
    )
    const context = buildContext(conversation)

    expect(context.summary).toBe('Previous conversation about testing')
  })

  it('returns null summary when not available', () => {
    const conversation = createConversation([createMessage()])
    const context = buildContext(conversation)

    expect(context.summary).toBeNull()
  })

  it('includes correct meta information', () => {
    const messages = [
      createMessage({ role: 'user' }),
      createMessage({ role: 'assistant' }),
    ]
    const conversation = createConversation(
      messages,
      { text: 'Summary', messageCountAtUpdate: 10 }
    )
    const context = buildContext(conversation)

    expect(context.meta).toEqual({
      totalMessageCount: 2,
      conversationId: 'conv-1',
      lastSummaryAt: 10,
    })
  })

  it('maps message roles correctly', () => {
    const messages = [
      createMessage({ role: 'user', content: 'User msg' }),
      createMessage({ role: 'assistant', content: 'Assistant msg' }),
    ]
    const conversation = createConversation(messages)
    const context = buildContext(conversation)

    expect(context.relevantMessages[0]).toEqual({ role: 'user', content: 'User msg' })
    expect(context.relevantMessages[1]).toEqual({ role: 'assistant', content: 'Assistant msg' })
  })

  it('handles conversation with fewer messages than limit', () => {
    const messages = [
      createMessage({ content: 'Only message' }),
    ]
    const conversation = createConversation(messages)
    const context = buildContext(conversation)

    expect(context.relevantMessages).toHaveLength(1)
    expect(context.relevantMessages[0].content).toBe('Only message')
  })

  it('excludes only error messages from count', () => {
    const messages = [
      createMessage({ role: 'user' }),
      createMessage({ role: 'assistant', isError: true }),
      createMessage({ role: 'assistant', isError: true }),
      createMessage({ role: 'user' }),
    ]
    const conversation = createConversation(messages)
    const context = buildContext(conversation)

    expect(context.meta.totalMessageCount).toBe(2)
  })
})
