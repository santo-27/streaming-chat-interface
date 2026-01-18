export interface ConversationContext {
  summary: string | null
  relevantMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  meta: {
    totalMessageCount: number
    conversationId: string
    lastSummaryAt: number
  }
}
