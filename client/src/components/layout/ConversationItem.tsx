import { useState, useRef, useEffect } from 'react'
import type { Conversation } from '@/types'
import { cn } from '@/lib/utils'
import { MoreVertical, Pencil, Lock, Eye, Trash2 } from '@/components/shared/Icons'

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
        aria-label="Conversation options"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
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
            <Pencil className="w-4 h-4" />
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
                <Eye className="w-4 h-4" />
                Make Public
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
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
            <Trash2 className="w-4 h-4" />
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
          : 'bg-transparent hover:bg-slate-200/70 dark:hover:bg-slate-700/70 hover:shadow-sm text-slate-700 dark:text-slate-300'
      )}
      onClick={() => !isRenaming && onSelect()}
    >
      {conversation.isPrivate && (
        <Lock
          className={cn('w-4 h-4 shrink-0', isActive ? 'text-white/70' : 'text-slate-400')}
        />
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
