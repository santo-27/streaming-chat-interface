import express from 'express'
import cors from 'cors'

import { model } from './gemini'
import { ConversationContext } from './types'
import { buildGeminiContents } from './context'
import { shouldUpdateSummary, generateSummary } from './summary'
import { getErrorMessage } from './errors'

const app = express()
app.use(cors())
app.use(express.json())

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

    // we are sending the summary update as a part of the stream too.
    // The reason for adding 2 messages is that by the time we get here,the user message and the assistant response have already been added.
    if (context && shouldUpdateSummary(context.meta.totalMessageCount + 2, context.meta.lastSummaryAt)) {
      try {
        const newSummary = await generateSummary(context, message, fullResponse)
        res.write(`data: ${JSON.stringify({
          updatedSummary: {
            text: newSummary,
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
