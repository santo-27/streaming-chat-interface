import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationItem } from '@/components/layout/ConversationItem'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types'
import { MessageSquare, Plus, X, Lock, ChevronDown } from '@/components/shared/Icons'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

// Constants
const MOBILE_BREAKPOINT = 768

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
    toggleConversationPrivacy,
  } = useChat()

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showPrivate, setShowPrivate] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const publicConversations = conversations.filter(c => !c.isPrivate)
  const privateConversations = conversations.filter(c => c.isPrivate)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const handleSelectConversation = (id: string) => {
    selectConversation(id)
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      onClose()
    }
  }

  const handleNewChat = () => {
    createConversation()
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      onClose()
    }
  }

  const handleStartRename = (conv: Conversation) => {
    setRenamingId(conv.id)
    setRenameValue(conv.title)
  }

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
      renameConversation(renamingId, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleCancelRename = () => {
    setRenamingId(null)
    setRenameValue('')
  }

  const renderConversationItem = (conv: Conversation) => (
    <ConversationItem
      key={conv.id}
      conversation={conv}
      isActive={conv.id === activeConversationId}
      isRenaming={renamingId === conv.id}
      renameValue={renameValue}
      onSelect={() => handleSelectConversation(conv.id)}
      onRename={() => handleStartRename(conv)}
      onFinishRename={handleFinishRename}
      onRenameValueChange={setRenameValue}
      onCancelRename={handleCancelRename}
      onTogglePrivacy={() => toggleConversationPrivacy(conv.id)}
      onDelete={() => deleteConversation(conv.id)}
      renameInputRef={renameInputRef}
    />
  )

  const renderSidebarContent = () => (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1869E8] to-[#3b82f6] flex items-center justify-center shadow-md">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">Petavue Assignment</span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-[#1869E8] to-[#2563eb] hover:from-[#1559cc] hover:to-[#1d4ed8] text-white font-medium shadow-md hover:shadow-lg gap-2 h-11"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-3 pr-4 space-y-1 pb-6">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Recent
          </p>
          {publicConversations.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No conversations yet</p>
          ) : (
            publicConversations.map(renderConversationItem)
          )}

          {privateConversations.length > 0 && (
            <>
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className="w-full flex items-center justify-between px-3 py-2 mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-expanded={showPrivate}
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Private ({privateConversations.length})
                </span>
                <ChevronDown
                  className={cn('w-4 h-4 transition-transform', showPrivate && 'rotate-180')}
                />
              </button>
              {showPrivate && (
                <div className="space-y-1 mt-1">
                  {privateConversations.map(renderConversationItem)}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </>
  )

  return (
    <>
      <aside
        className={cn(
          'hidden md:block h-full w-72 shrink-0 relative z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-[margin] duration-300 ease-in-out',
          isOpen ? 'ml-0' : '-ml-72'
        )}
      >
        <div className="h-full w-full flex flex-col">
          {renderSidebarContent()}
        </div>
      </aside>

      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent()}
      </div>
    </>
  )
}
