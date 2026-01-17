export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'complete' | 'stopped' | 'error'
export type ContentFormat = 'text' | 'json' | 'table' | 'number'

// but messages could be of different formats
export interface Message {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  format: ContentFormat
  timestamp: number
}

export interface ConversationSummary {
  text: string
  lastUpdatedAt: number
  messageCountAtUpdate: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  summary?: ConversationSummary
  isPrivate?: boolean
}

// why not just use the type as MessageRole directly ?
export interface ConversationContext {
  summary: string | null
  relevantMessages: Array<{ role: 'user' | 'model'; content: string }>
  meta: {
    totalMessageCount: number
    conversationId: string
    lastSummaryAt: number
  }
}

export interface ChatRequest {
  message: string
  context: ConversationContext
}

export interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  isLoading: boolean
  error: string | null
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string } & Partial<Message> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'SELECT_CONVERSATION'; payload: string }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'UPDATE_CONVERSATION_TITLE'; payload: { id: string; title: string } }
  | { type: 'UPDATE_CONVERSATION_SUMMARY'; payload: { id: string; summary: ConversationSummary } }
  | { type: 'TOGGLE_CONVERSATION_PRIVACY'; payload: string }
