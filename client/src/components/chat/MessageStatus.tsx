import type { MessageStatus as MessageStatusType } from '@/types'
import { AlertTriangle, AlertCircle } from '@/components/shared/Icons'

interface MessageStatusProps {
  status: MessageStatusType
}

export function MessageStatus({ status }: MessageStatusProps) {
  if (status === 'stopped') {
    return (
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-amber-300 dark:border-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Generation stopped</span>
      </div>
    )
  } 

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-red-300 dark:border-red-800">
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        <span className="text-xs font-medium text-red-600 dark:text-red-400">Error occurred</span>
      </div>
    )
  }

  return null
}
