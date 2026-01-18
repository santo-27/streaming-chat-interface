import { Content } from '@google/generative-ai'
import { ConversationContext } from './types'

export function buildGeminiContents(context: ConversationContext, currentMessage: string): Content[] {
  const contents: Content[] = []

  // Include previous summary if available, and make the response more relevant
  if (context.summary) {
    contents.push({
      role: 'user',
      parts: [{ text: `[Previous conversation summary: ${context.summary}]` }],
    })
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand the context from our previous conversation. How can I help you?' }],
    })
  }

  for (const msg of context.relevantMessages) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })
  }

  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }],
  })

  return contents
}
