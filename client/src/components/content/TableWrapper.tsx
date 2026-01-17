import { useState, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TableWrapperProps {
  children: ReactNode
}

export function TableWrapper({ children }: TableWrapperProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!tableRef.current) return
    const table = tableRef.current.querySelector('table')
    if (!table) return

    const rows = Array.from(table.querySelectorAll('tr'))
    const text = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        return cells.map((cell) => cell.textContent?.trim() || '').join('\t')
      })
      .join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group my-4">
      <div className="flex items-center justify-between px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-t-lg border border-b-0 border-zinc-200 dark:border-zinc-700">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Table</span>
        <button
          onClick={handleCopy}
          className={cn(
            'px-2 py-0.5 text-xs rounded transition-colors',
            'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
            'hover:bg-zinc-300 dark:hover:bg-zinc-600',
            copied && 'bg-green-600 text-white'
          )}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div
        ref={tableRef}
        className="overflow-x-auto rounded-b-lg border border-zinc-200 dark:border-zinc-700"
      >
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  )
}
