import { cn } from '@/lib/utils'

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
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="8" cy="10" r="1"/>
          <circle cx="12" cy="10" r="1"/>
          <circle cx="16" cy="10" r="1"/>
        </svg>
      )}
    </div>
  )
}
