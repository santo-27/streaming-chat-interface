/* eslint-disable react-refresh/only-export-components */
import { createContext, useReducer, useRef, useEffect, type ReactNode } from 'react'
import type { Message, Conversation, ChatState, ChatAction, ConversationSummary } from '@/types'
import { analyzeContent } from '@/utils/formatDetection'
import { buildContext } from '@/utils/contextBuilder'

const STORAGE_KEY = 'chat-conversations'

interface ChatContextValue extends ChatState {
  activeConversation: Conversation | null
  sendMessage: (content: string) => void
  stopGeneration: () => void
  createConversation: () => void
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  toggleConversationPrivacy: (id: string) => void
}

function loadFromStorage(): { conversations: Conversation[]; activeId: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        conversations: data.conversations || [],
        activeId: data.activeConversationId || null,
      }
    }
    //catch error and print to console
  } catch (e) {
    console.error('Error loading conversations from storage:', e);
    // Ignore parse errors
  }
  return { conversations: [], activeId: null }
}

function createNewConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

const stored = loadFromStorage()

// since we already have conversations, no need to create a new one
const initialConversation = stored.conversations.length > 0 ? null : createNewConversation()

const initialState: ChatState = {
  conversations: initialConversation
    ? [initialConversation, ...stored.conversations]
    : stored.conversations,
  activeConversationId: initialConversation?.id || stored.activeId || stored.conversations[0]?.id || null,
  isLoading: false,
  error: null,
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {

    // adding the message to the active conversation only
    case 'ADD_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, action.payload],
                updatedAt: Date.now(),
                // Update title from first user message
                title: conv.messages.length === 0 && action.payload.role === 'user'
                  ? action.payload.content.slice(0, 30) + (action.payload.content.length > 30 ? '...' : '')
                  : conv.title,
              }
            : conv
        ),
      }
    }

    // im not really using this for now but might be useful later
    case 'UPDATE_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: conv.messages.map((msg) =>
                  msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
                ),
                updatedAt: Date.now(),
              }
            : conv
        ),
      }
    }
    case 'DELETE_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: conv.messages.filter((msg) => msg.id !== action.payload),
                updatedAt: Date.now(),
              }
            : conv
        ),
      }
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CREATE_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConversationId: action.payload.id,
      }
    case 'SELECT_CONVERSATION':
      return { ...state, activeConversationId: action.payload }
    case 'DELETE_CONVERSATION': {
      const remaining = state.conversations.filter((c) => c.id !== action.payload)
      const needsNewActive = state.activeConversationId === action.payload
      return {
        ...state,
        conversations: remaining,
        activeConversationId: needsNewActive
          ? remaining[0]?.id || null
          : state.activeConversationId,
      }
    }
    case 'UPDATE_CONVERSATION_TITLE':
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? { ...conv, title: action.payload.title } : conv
        ),
      }
    case 'UPDATE_CONVERSATION_SUMMARY':
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? { ...conv, summary: action.payload.summary } : conv
        ),
      }
    case 'TOGGLE_CONVERSATION_PRIVACY':
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload ? { ...conv, isPrivate: !conv.isPrivate } : conv
        ),
      }
    default:
      return state
  }
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const abortControllerRef = useRef<AbortController | null>(null)

  const activeConversation = state.conversations.find(
    (c) => c.id === state.activeConversationId
  ) || null

  // Persist to localStorage
  // storing the active conversation id just for user experience purpose, will work even withhout this
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      })
    )
  }, [state.conversations, state.activeConversationId])

  const sendMessage = async (content: string) => {
    if (!content.trim() || state.isLoading || !state.activeConversationId) return

    // Build context before adding user message
    const context = activeConversation
      ? buildContext(activeConversation)
      : null

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      status: 'complete',
      format: 'text',
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })

    // Add empty assistant message
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      status: 'streaming',
      format: 'text',
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    // Create abort controller
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, context }),
        signal: abortControllerRef.current.signal,
      })

      // Handle HTTP errors (use error message from backend)
      if (!response.ok) {
        try {
          const errorBody = await response.json()
          throw new Error(errorBody.error || 'Request failed. Please try again.')
        } catch {
          throw new Error('Request failed. Please try again.')
        }
      }

      // Check content type - handle non-SSE responses
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        // Server returned JSON instead of SSE (likely an error)
        const jsonResponse = await response.json()
        throw new Error(jsonResponse.error || 'Unexpected JSON response')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let fullContent = ''
      let hasReceivedContent = false
      let errorOccurred = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              console.log('Parsed SSE chunk:', parsed);

              // Handle text content
              // live update of the message content
              if (parsed.text) {
                hasReceivedContent = true
                fullContent += parsed.text
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: { id: assistantMessage.id, content: fullContent },
                })
              }

              // Handle updated summary from backend
              if (parsed.updatedSummary && state.activeConversationId) {
                dispatch({
                  type: 'UPDATE_CONVERSATION_SUMMARY',
                  payload: {
                    id: state.activeConversationId,
                    summary: parsed.updatedSummary as ConversationSummary,
                  },
                })
              }

              // Handle error in SSE stream
              if (parsed.error) {
                errorOccurred = true
                // If we received partial content, keep it but mark as stopped
                // Otherwise, delete the empty assistant message
                if (hasReceivedContent) {
                  dispatch({
                    type: 'UPDATE_MESSAGE',
                    payload: { id: assistantMessage.id, status: 'stopped' },
                  })
                } else {
                  dispatch({ type: 'DELETE_MESSAGE', payload: assistantMessage.id })
                }
                // Add error as a separate message that won't be sent as context
                const errorMessage: Message = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: parsed.error,
                  status: 'error',
                  format: 'text',
                  timestamp: Date.now(),
                  isError: true,
                }
                dispatch({ type: 'ADD_MESSAGE', payload: errorMessage })
                dispatch({ type: 'SET_ERROR', payload: parsed.error })
              }
            } catch {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }

      // Only mark as complete if no error occurred
      if (!errorOccurred) {
        const { parsed, format } = analyzeContent(fullContent)
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMessage.id,
            status: 'complete',
            format,
            parsedContent: parsed,
          },
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { id: assistantMessage.id, status: 'stopped' },
        })
      } else {
        const errorContent = err instanceof Error ? err.message : 'An unexpected error occurred'
        // Delete the empty assistant message
        dispatch({ type: 'DELETE_MESSAGE', payload: assistantMessage.id })
        // Add error as a separate message that won't be sent as context
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errorContent,
          status: 'error',
          format: 'text',
          timestamp: Date.now(),
          isError: true,
        }
        dispatch({ type: 'ADD_MESSAGE', payload: errorMsg })
        dispatch({ type: 'SET_ERROR', payload: errorContent })
      }
    }

    dispatch({ type: 'SET_LOADING', payload: false })
    abortControllerRef.current = null
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const createConversation = () => {
    const newConv = createNewConversation()
    dispatch({ type: 'CREATE_CONVERSATION', payload: newConv })
  }

  const selectConversation = (id: string) => {
    dispatch({ type: 'SELECT_CONVERSATION', payload: id })
  }

  const deleteConversation = (id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id })
  }

  const renameConversation = (id: string, title: string) => {
    dispatch({ type: 'UPDATE_CONVERSATION_TITLE', payload: { id, title } })
  }

  const toggleConversationPrivacy = (id: string) => {
    dispatch({ type: 'TOGGLE_CONVERSATION_PRIVACY', payload: id })
  }

  return (
    <ChatContext.Provider
      value={{
        ...state,
        activeConversation,
        sendMessage,
        stopGeneration,
        createConversation,
        selectConversation,
        deleteConversation,
        renameConversation,
        toggleConversationPrivacy,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
