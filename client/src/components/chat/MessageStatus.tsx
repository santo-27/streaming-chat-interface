import type { MessageStatus as MessageStatusType } from '@/types'

interface MessageStatusProps {
  status: MessageStatusType
}

export function MessageStatus({ status }: MessageStatusProps) {
  if (status === 'stopped') {
    return (
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-amber-300 dark:border-amber-800">
        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Generation stopped</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-red-300 dark:border-red-800">
        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium text-red-600 dark:text-red-400">Error occurred</span>
      </div>
    )
  }

  return null
}
