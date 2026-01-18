/* eslint-disable react-refresh/only-export-components */
import { createContext, useReducer, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { Message, Conversation, ChatState, ChatAction, ConversationSummary } from '@/types'
import { analyzeContent } from '@/utils/formatDetection'
import { buildContext } from '@/utils/contextBuilder'

// Constants
const STORAGE_KEY = 'chat-conversations'
const TITLE_MAX_LENGTH = 30
const STORAGE_DEBOUNCE_MS = 1000

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
  if (typeof window === 'undefined') {
    return { conversations: [], activeId: null }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return {
        conversations: data.conversations || [],
        activeId: data.activeConversationId || null,
      }
    }
  } catch {
    // Silently ignore parse errors - will start fresh
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

function createInitialState(): ChatState {
  const stored = loadFromStorage()

  // Always ensure we have at least one conversation
  let conversations = stored.conversations
  let activeId = stored.activeId

  // If no conversations exist, create a new one
  if (conversations.length === 0) {
    const newConversation = createNewConversation()
    conversations = [newConversation]
    activeId = newConversation.id
  } else {
    // If we have conversations but no valid activeId, select the first one
    const isActiveIdValid = conversations.some(c => c.id === activeId)
    if (!activeId || !isActiveIdValid) {
      activeId = conversations[0].id
    }
  }

  return {
    conversations,
    activeConversationId: activeId,
    isLoading: false,
    error: null,
  }
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, action.payload],
                updatedAt: Date.now(),
                title: conv.messages.length === 0 && action.payload.role === 'user'
                  ? action.payload.content.slice(0, TITLE_MAX_LENGTH) + (action.payload.content.length > TITLE_MAX_LENGTH ? '...' : '')
                  : conv.title,
              }
            : conv
        ),
      }
    }

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
  // Lazy initialization - runs only once on mount
  const [state, dispatch] = useReducer(chatReducer, null, createInitialState)

  const abortControllerRef = useRef<AbortController | null>(null)
  const storageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use ref to track activeConversationId to avoid stale closures in async functions
  const activeConversationIdRef = useRef(state.activeConversationId)
  useEffect(() => {
    activeConversationIdRef.current = state.activeConversationId
  }, [state.activeConversationId])

  const activeConversation = useMemo(() =>
    state.conversations.find((c) => c.id === state.activeConversationId) || null,
    [state.conversations, state.activeConversationId]
  )

  // Use ref for activeConversation in async functions
  const activeConversationRef = useRef(activeConversation)
  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  // Debounced persist to localStorage
  useEffect(() => {
    if (storageTimeoutRef.current) {
      clearTimeout(storageTimeoutRef.current)
    }

    storageTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
        })
      )
    }, STORAGE_DEBOUNCE_MS)

    return () => {
      if (storageTimeoutRef.current) {
        clearTimeout(storageTimeoutRef.current)
      }
    }
  }, [state.conversations, state.activeConversationId])

  // Flush storage on unmount
  useEffect(() => {
    return () => {
      if (storageTimeoutRef.current) {
        clearTimeout(storageTimeoutRef.current)
        // Sync write on unmount to ensure data is saved
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            conversations: state.conversations,
            activeConversationId: state.activeConversationId,
          })
        )
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const currentActiveId = activeConversationIdRef.current
    const currentActiveConversation = activeConversationRef.current

    if (!content.trim() || !currentActiveId) return

    // Build context before adding user message
    const context = currentActiveConversation
      ? buildContext(currentActiveConversation)
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

              // Handle text content - live update of the message content
              if (parsed.text) {
                hasReceivedContent = true
                fullContent += parsed.text
                dispatch({
                  type: 'UPDATE_MESSAGE',
                  payload: { id: assistantMessage.id, content: fullContent },
                })
              }

              // Handle updated summary from backend - use ref to get current ID
              if (parsed.updatedSummary && activeConversationIdRef.current) {
                dispatch({
                  type: 'UPDATE_CONVERSATION_SUMMARY',
                  payload: {
                    id: activeConversationIdRef.current,
                    summary: parsed.updatedSummary as ConversationSummary,
                  },
                })
              }

              // Handle error in SSE stream
              if (parsed.error) {
                errorOccurred = true
                if (hasReceivedContent) {
                  dispatch({
                    type: 'UPDATE_MESSAGE',
                    payload: { id: assistantMessage.id, status: 'stopped' },
                  })
                } else {
                  dispatch({ type: 'DELETE_MESSAGE', payload: assistantMessage.id })
                }
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
        dispatch({ type: 'DELETE_MESSAGE', payload: assistantMessage.id })
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
  }, [])

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const createConversation = useCallback(() => {
    const newConv = createNewConversation()
    dispatch({ type: 'CREATE_CONVERSATION', payload: newConv })
  }, [])

  const selectConversation = useCallback((id: string) => {
    dispatch({ type: 'SELECT_CONVERSATION', payload: id })
  }, [])

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id })
  }, [])

  const renameConversation = useCallback((id: string, title: string) => {
    dispatch({ type: 'UPDATE_CONVERSATION_TITLE', payload: { id, title } })
  }, [])

  const toggleConversationPrivacy = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_CONVERSATION_PRIVACY', payload: id })
  }, [])

  const contextValue = useMemo<ChatContextValue>(() => ({
    ...state,
    activeConversation,
    sendMessage,
    stopGeneration,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    toggleConversationPrivacy,
  }), [
    state,
    activeConversation,
    sendMessage,
    stopGeneration,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    toggleConversationPrivacy,
  ])

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}
