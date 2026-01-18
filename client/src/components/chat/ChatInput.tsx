import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'
import { Send, Square } from '@/components/shared/Icons'

// Constants
const TEXTAREA_MAX_HEIGHT = 150
const TEXTAREA_MIN_HEIGHT = 28

export function ChatInput() {
  const [input, setInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const { sendMessage, stopGeneration, isLoading } = useChat()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // UX improvement: submit on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = Math.min(target.scrollHeight, TEXTAREA_MAX_HEIGHT) + 'px'
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-4 sm:px-6 sm:py-5">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'relative flex items-end gap-3 p-2 rounded-2xl border-2 transition-all duration-200 bg-slate-50 dark:bg-slate-800/50',
            isFocused
              ? 'border-[#1869E8] shadow-lg shadow-blue-500/10'
              : 'border-slate-200 dark:border-slate-700',
            isLoading && 'opacity-80'
          )}
        >
          {/* Input area */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full resize-none bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'min-h-[28px] max-h-[150px] py-2 px-3 text-[15px] leading-relaxed',
                'disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-0'
              )}
              style={{
                height: 'auto',
                minHeight: `${TEXTAREA_MIN_HEIGHT}px`
              }}
              onInput={handleTextareaInput}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1">
            {isLoading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                aria-label="Stop generation"
              >
                <Square className="w-5 h-5" fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-xl shadow-md transition-all duration-200',
                  input.trim()
                    ? 'bg-gradient-to-r from-[#1869E8] to-[#2563eb] hover:from-[#1559cc] hover:to-[#1d4ed8] text-white hover:shadow-lg active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p className="mt-2 text-xs text-center text-slate-400 dark:text-slate-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  )
}
