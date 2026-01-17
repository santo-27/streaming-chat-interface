import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI, Content, GoogleGenerativeAIFetchError, GoogleGenerativeAIResponseError } from '@google/generative-ai'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const SUMMARY_UPDATE_THRESHOLD = 6

interface ConversationContext {
  summary: string | null
  relevantMessages: Array<{ role: 'user' | 'model'; content: string }>
  meta: {
    totalMessageCount: number
    conversationId: string
    lastSummaryAt: number
  }
}

function buildGeminiContents(context: ConversationContext, currentMessage: string): Content[] {
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
      role: msg.role,
      parts: [{ text: msg.content }],
    })
  }

  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }],
  })


  // finally built the prompt that has all the relevant contents alond with the current message

  return contents
}

// is lastsummmaryat a number or date ? it is a number. but in the meta we can store it as date too. Then what is  it really ? it is the message count at which the last summary was made.
// will change this in the next commit.
function shouldUpdateSummary(totalMessageCount: number, lastSummaryAt: number): boolean {
  return totalMessageCount - lastSummaryAt >= SUMMARY_UPDATE_THRESHOLD
}

async function generateSummary(
  context: ConversationContext,
  currentMessage: string,
  assistantResponse: string
): Promise<string> {
  const messagesToSummarize: string[] = []

  if (context.summary) {
    messagesToSummarize.push(`Previous summary: ${context.summary}`)
  }

  for (const msg of context.relevantMessages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant' // why are we doing this ? 

    // limit to first 500 characters to avoid overly long summaries
    messagesToSummarize.push(`${role}: ${msg.content.slice(0, 500)}`)
  }


  messagesToSummarize.push(`User: ${currentMessage.slice(0, 500)}`)
  messagesToSummarize.push(`Assistant: ${assistantResponse.slice(0, 500)}`)

  const summaryPrompt = `Summarize this conversation concisely (2-3 sentences max), capturing key topics, decisions, and any important context needed for future messages. Focus on what was discussed and any conclusions reached.

Conversation:
${messagesToSummarize.join('\n\n')}

Summary:`

  // runs asynchronously to generate the summary, therefore will have some delay
  const result = await model.generateContent(summaryPrompt)

  // removing whitespaces
  return result.response.text().trim()
}

// Extract user-friendly error message using SDK error types and status codes
function getErrorMessage(err: unknown): { message: string; code: string; status?: number } {
  // Handle Gemini API fetch errors (network/HTTP level)
  if (err instanceof GoogleGenerativeAIFetchError) {
    const status = err.status
    const errorDetails = err.errorDetails as Array<{ reason?: string; '@type'?: string }> | undefined

    // Check errorDetails first for specific error reasons
    if (errorDetails?.length) {
      const errorInfo = errorDetails.find(d => d['@type']?.includes('ErrorInfo'))
      const reason = errorInfo?.reason

      if (reason === 'API_KEY_INVALID') {
        return { message: 'Invalid API key. Please check your configuration.', code: 'INVALID_API_KEY', status }
      }
      if (reason === 'RATE_LIMIT_EXCEEDED' || reason === 'RESOURCE_EXHAUSTED') {
        return { message: 'API quota exceeded. Please try again later.', code: 'QUOTA_EXCEEDED', status }
      }
    }

    // Fall back to status codes
    if (status === 400) {
      return { message: 'Invalid request. Please try rephrasing your message.', code: 'INVALID_REQUEST', status }
    }
    if (status === 401 || status === 403) {
      return { message: 'Invalid API key. Please check your configuration.', code: 'INVALID_API_KEY', status }
    }
    if (status === 404) {
      return { message: 'Model not found. Please check server configuration.', code: 'MODEL_NOT_FOUND', status }
    }
    if (status === 429) {
      return { message: 'API quota exceeded. Please try again later.', code: 'QUOTA_EXCEEDED', status }
    }
    if (status && status >= 500) {
      return { message: 'Gemini service error. Please try again.', code: 'SERVER_ERROR', status }
    }

    // Network-level errors (no status code)
    return { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR' }
  }

  // Handle Gemini API response errors (content/safety level)
  if (err instanceof GoogleGenerativeAIResponseError) {
    const blockReason = err.response?.promptFeedback?.blockReason
    if (blockReason) {
      return { message: `Response blocked: ${blockReason.toLowerCase()}.`, code: 'SAFETY_BLOCKED', status: 200 }
    }
    return { message: 'Invalid response from Gemini API.', code: 'RESPONSE_ERROR', status: 200 }
  }

  // Fallback for other Error types
  if (err instanceof Error) {
    return { message: err.message.split('\n')[0].slice(0, 200), code: 'UNKNOWN_ERROR' }
  }

  return { message: 'An unexpected error occurred. Please try again.', code: 'UNKNOWN_ERROR' }
}

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body as { message: string; context?: ConversationContext }

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required', code: 'INVALID_REQUEST' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    let result

    // if there is context, build contents with relevant messages
    if (context && context.relevantMessages.length > 0) {
      const contents = buildGeminiContents(context, message)
      result = await model.generateContentStream({ contents })
    }

    // first message sorta situation
    else {
      result = await model.generateContentStream(message)
    }

    let fullResponse = ''

    // getting token by token response from gemini
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        fullResponse += text
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    // we are seding the summary update as a part of the stream too.

    // why are we adding 2 to totalMessageCount ? because we have to account for the current user message and the assistant response
    if (context && shouldUpdateSummary(context.meta.totalMessageCount + 2, context.meta.lastSummaryAt)) {
      try {
        const newSummary = await generateSummary(context, message, fullResponse)
        // WHY ARE WE SENDING LASTUPDATEDAT AS DATE NOW() IN MILLISECONDS ? SHOULD WE NOT SEND THE MESSAGE COUNT AT WHICH THE SUMMARY WAS MADE RATHER THAN A TIMESTAMP ?
        res.write(`data: ${JSON.stringify({
          updatedSummary: {
            text: newSummary,
            lastUpdatedAt: Date.now(),
            messageCountAtUpdate: context.meta.totalMessageCount + 2,
          }
        })}\n\n`)
      } catch (summaryErr) {
        console.error('Failed to generate summary:', summaryErr)
      }
    }

    res.write('data: [DONE]\n\n')
  } catch (err) {
    const { message: errorMessage, code, status } = getErrorMessage(err)
    res.write(`data: ${JSON.stringify({ error: errorMessage, code, status })}\n\n`)
  }

  res.end()
})

app.listen(3001, () => console.log('Server on http://localhost:3001'))
