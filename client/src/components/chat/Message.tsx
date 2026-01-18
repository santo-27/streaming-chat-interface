import { useState } from 'react'
import type { Message as MessageType } from '@/types'
import { ContentRenderer } from '@/components/content/ContentRenderer'
import { Avatar } from '@/components/shared/Avatar'
import { MessageStatus } from '@/components/chat/MessageStatus'
import { StreamingIndicator } from '@/components/chat/StreamingIndicator'
import { cn } from '@/lib/utils'
import { Check, Copy } from '@/components/shared/Icons'

// Constants
const COPY_FEEDBACK_DURATION_MS = 2000

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS)
  }

  return (
    <div className={cn('flex gap-3 sm:gap-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar isUser={isUser} />

      <div className="group relative max-w-[90%]">
        <div
          className={cn(
            'relative px-4 py-3 rounded-2xl shadow-sm',
            isUser
              ? 'bg-gradient-to-br from-[#1869E8] to-[#2563eb] text-white rounded-tr-md'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-md',
            message.status === 'streaming' && !isUser && 'border-[#1869E8]/50',
            message.status === 'stopped' && 'border-amber-400 bg-amber-50 dark:bg-amber-950/30',
            message.status === 'error' && 'border-red-400 bg-red-50 dark:bg-red-950/30'
          )}
        >
          {message.status === 'streaming' && !message.content ? (
            <StreamingIndicator />
          ) : (
            <div className={cn(
              'prose prose-sm max-w-none',
              isUser ? 'prose-invert' : 'dark:prose-invert',
              '[&>p]:my-0 [&>p:not(:last-child)]:mb-2'
            )}>
              <ContentRenderer
                content={message.content}
                format={message.format}
                parsedContent={message.parsedContent}
                showContentBadges={!isUser && message.status === 'complete'}
              />
            </div>
          )}

          {!isUser && <MessageStatus status={message.status} />}
        </div>

        {message.content && message.status !== 'streaming' && (
          <button
            onClick={handleCopy}
            className={cn(
              'absolute -bottom-3 px-2.5 py-1 text-xs font-medium rounded-lg shadow-md transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              isUser ? 'left-2' : 'right-2',
              copied
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            )}
            aria-label={copied ? 'Copied to clipboard' : 'Copy message'}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="w-3 h-3" />
                Copy
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
