import { useEffect, useRef, useCallback } from 'react'
import { Message } from '@/components/chat/Message'
import { EmptyState } from '@/components/chat/EmptyState'
import { useChat } from '@/hooks/useChat'

// Constants
const SCROLL_THRESHOLD_PX = 100
// trying to avoid excessive scroll event handling
const SCROLL_DEBOUNCE_MS = 150

export function MessageList() {
  const { activeConversation, isLoading } = useChat()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<number | null>(null)

  const messages = activeConversation?.messages || []

  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD_PX
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current)
    }

    if (!isNearBottom()) {
      isUserScrollingRef.current = true
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      if (isNearBottom()) {
        isUserScrollingRef.current = false
      }
    }, SCROLL_DEBOUNCE_MS)
  }, [isNearBottom])

  useEffect(() => {
    if (!isUserScrollingRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: isLoading ? 'auto' : 'smooth',
        block: 'end'
      })
    }
  }, [activeConversation?.messages, isLoading])

  useEffect(() => {
    isUserScrollingRef.current = false
  }, [activeConversation?.id])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  if (messages.length === 0) {
    return <EmptyState />
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900"
    >
      <div className="px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  )
}
