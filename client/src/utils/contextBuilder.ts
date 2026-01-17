import type { Conversation, ConversationContext } from '@/types'

const DEFAULT_RECENT_MESSAGES = 6

export function buildContext(
  conversation: Conversation,
  recentMessageCount: number = DEFAULT_RECENT_MESSAGES
): ConversationContext {
  const messages = conversation.messages

  // Take the last N messages for immediate context
  const recentMessages = messages.slice(-recentMessageCount).map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'model' as const,
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
