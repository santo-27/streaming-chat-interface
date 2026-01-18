export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'streaming' | 'complete' | 'stopped' | 'error'
export type ContentFormat = 'text' | 'json' | 'table' | 'number'

// Segment types for parsed content
export type SegmentType = 'text' | 'code' | 'json' | 'table' | 'heading' | 'list' | 'blockquote'

export interface ContentSegment {
  type: SegmentType
  content: string
  language?: string // for code blocks
  level?: number // for headings (1-6)
  ordered?: boolean // for lists
  parsed?: unknown // for json - the parsed object
}

export interface ParsedContent {
  segments: ContentSegment[]
  hasCode: boolean
  hasJson: boolean
  hasTable: boolean
  hasList: boolean
  languages: string[] // programming languages found in code blocks
}

export interface Message {
  id: string
  role: MessageRole
  content: string // raw content
  status: MessageStatus
  format: ContentFormat // primary format (legacy, kept for compatibility)
  parsedContent?: ParsedContent // structured content segments
  timestamp: number
  isError?: boolean // error messages are displayed but not sent as context
}

export interface ConversationSummary {
  text: string
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


export interface ConversationContext {
  summary: string | null
  relevantMessages: Array<{ role: MessageRole; content: string }>
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
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CREATE_CONVERSATION'; payload: Conversation }
  | { type: 'SELECT_CONVERSATION'; payload: string }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'UPDATE_CONVERSATION_TITLE'; payload: { id: string; title: string } }
  | { type: 'UPDATE_CONVERSATION_SUMMARY'; payload: { id: string; summary: ConversationSummary } }
  | { type: 'TOGGLE_CONVERSATION_PRIVACY'; payload: string }
