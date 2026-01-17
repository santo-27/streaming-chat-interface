import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
  variant?: 'dark' | 'light'
}

export function CopyButton({ text, className, variant = 'dark' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'px-2 py-1 text-xs rounded transition-colors',
        variant === 'dark'
          ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600',
        copied && 'bg-green-600 text-white',
        className
      )}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
