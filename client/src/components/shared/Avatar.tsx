import { cn } from '@/lib/utils'
import { User, Bot } from '@/components/shared/Icons'

interface AvatarProps {
  isUser: boolean
}

export function Avatar({ isUser }: AvatarProps) {
  return (
    <div className={cn(
      'shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md',
      isUser
        ? 'bg-gradient-to-br from-slate-600 to-slate-800'
        : 'bg-gradient-to-br from-[#1869E8] to-[#2563eb]'
    )}>
      {isUser ? (
        <User className="w-5 h-5 text-white" />
      ) : (
        <Bot className="w-5 h-5 text-white" />
      )}
    </div>
  )
}
