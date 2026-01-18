import type { Conversation, ConversationContext } from '@/types'

const DEFAULT_RECENT_MESSAGES = 6

export function buildContext(
  conversation: Conversation,
  recentMessageCount: number = DEFAULT_RECENT_MESSAGES
): ConversationContext {
  // Filter out error messages - they should not be sent as context to the backend
  const messages = conversation.messages.filter(msg => !msg.isError)

  // Take the last N messages for immediate context
  const recentMessages = messages.slice(-recentMessageCount).map(msg => ({
    role: msg.role,
    content: msg.content,
  }))

  return {
    summary: conversation.summary?.text || null,
    relevantMessages: recentMessages,
    meta: {
      totalMessageCount: messages.length,
      conversationId: conversation.id,
      lastSummaryAt: conversation.summary?.messageCountAtUpdate || 0,
    },
  }
}
