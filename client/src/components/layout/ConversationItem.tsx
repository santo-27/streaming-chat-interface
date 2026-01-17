import { useState, useRef, useEffect } from 'react'
import type { Conversation } from '@/types'
import { cn } from '@/lib/utils'

interface ChatMenuProps {
  conversation: Conversation
  isActive: boolean
  onRename: () => void
  onTogglePrivacy: () => void
  onDelete: () => void
}

function ChatMenu({ conversation, isActive, onRename, onTogglePrivacy, onDelete }: ChatMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
        )}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRename()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onTogglePrivacy()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
          >
            {conversation.isPrivate ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Make Public
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Make Private
              </>
            )}
          </button>
          <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isRenaming: boolean
  renameValue: string
  onSelect: () => void
  onRename: () => void
  onFinishRename: () => void
  onRenameValueChange: (value: string) => void
  onCancelRename: () => void
  onTogglePrivacy: () => void
  onDelete: () => void
  renameInputRef: React.RefObject<HTMLInputElement | null>
}

export function ConversationItem({
  conversation,
  isActive,
  isRenaming,
  renameValue,
  onSelect,
  onRename,
  onFinishRename,
  onRenameValueChange,
  onCancelRename,
  onTogglePrivacy,
  onDelete,
  renameInputRef,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-[#1869E8] to-[#2563eb] text-white shadow-md'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      )}
      onClick={() => !isRenaming && onSelect()}
    >
      {conversation.isPrivate && (
        <svg
          className={cn('w-4 h-4 shrink-0', isActive ? 'text-white/70' : 'text-slate-400')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )}

      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          value={renameValue}
          onChange={(e) => onRenameValueChange(e.target.value)}
          onBlur={onFinishRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onFinishRename()
            if (e.key === 'Escape') onCancelRename()
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 outline-none focus:border-[#1869E8]"
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-sm font-medium">{conversation.title}</span>
      )}

      {!isRenaming && (
        <ChatMenu
          conversation={conversation}
          isActive={isActive}
          onRename={onRename}
          onTogglePrivacy={onTogglePrivacy}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
