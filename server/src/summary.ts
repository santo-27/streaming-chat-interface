import { model } from './gemini'
import { ConversationContext } from './types'

const SUMMARY_UPDATE_THRESHOLD = 6

export function shouldUpdateSummary(totalMessageCount: number, lastSummaryAt: number): boolean {
  return totalMessageCount - lastSummaryAt >= SUMMARY_UPDATE_THRESHOLD
}

export async function generateSummary(
  context: ConversationContext,
  currentMessage: string,
  assistantResponse: string
): Promise<string> {
  const messagesToSummarize: string[] = []

  if (context.summary) {
    messagesToSummarize.push(`Previous summary: ${context.summary}`)
  }

  for (const msg of context.relevantMessages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant'

    // limit to first 500 characters to avoid overly long summaries
    messagesToSummarize.push(`${role}: ${msg.content.slice(0, 500)}`)
  }

  messagesToSummarize.push(`User: ${currentMessage.slice(0, 500)}`)
  messagesToSummarize.push(`Assistant: ${assistantResponse.slice(0, 500)}`)

  const summaryPrompt = `Summarize this conversation concisely (2-3 sentences max), capturing key topics, decisions, and any important context needed for future messages. Focus on what was discussed and any conclusions reached.

Conversation:
${messagesToSummarize.join('\n\n')}

Summary:`

  const result = await model.generateContent(summaryPrompt)

  return result.response.text().trim()
}
