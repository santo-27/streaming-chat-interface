import { useState, type ReactNode } from 'react'
import { CopyButton } from '@/components/shared/CopyButton'

interface JsonNodeProps {
  data: unknown
  keyName?: string
  isLast?: boolean
  depth?: number
  defaultExpanded?: boolean
}

function JsonNode({ data, keyName, isLast = true, depth = 0, defaultExpanded = true }: JsonNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && depth < 2)

  const isObject = data !== null && typeof data === 'object' && !Array.isArray(data)
  const isArray = Array.isArray(data)
  const isCollapsible = isObject || isArray

  const comma = isLast ? '' : ','

  if (!isCollapsible) {
    let valueElement: ReactNode
    if (data === null) {
      valueElement = <span className="text-orange-400">null</span>
    } else if (typeof data === 'boolean') {
      valueElement = <span className="text-orange-400">{data.toString()}</span>
    } else if (typeof data === 'number') {
      valueElement = <span className="text-purple-400">{data}</span>
    } else if (typeof data === 'string') {
      valueElement = <span className="text-green-400">"{data}"</span>
    } else {
      valueElement = <span>{String(data)}</span>
    }

    return (
      <div className="leading-relaxed">
        {keyName !== undefined && (
          <span className="text-blue-300">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-zinc-400">: </span>}
        {valueElement}
        <span className="text-zinc-400">{comma}</span>
      </div>
    )
  }

  const entries = isArray
    ? (data as unknown[]).map((v, i) => [i, v] as const)
    : Object.entries(data as Record<string, unknown>)

  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'
  const itemCount = entries.length
  const previewText = isArray ? `${itemCount} item${itemCount !== 1 ? 's' : ''}` : `${itemCount} key${itemCount !== 1 ? 's' : ''}`

  return (
    <div>
      <div
        className="inline-flex items-center cursor-pointer hover:bg-zinc-800/50 rounded -ml-4 pl-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-zinc-500 w-4 text-xs select-none">
          {isExpanded ? '▼' : '▶'}
        </span>
        {keyName !== undefined && (
          <span className="text-blue-300">"{keyName}"</span>
        )}
        {keyName !== undefined && <span className="text-zinc-400">: </span>}
        <span className="text-zinc-400">{openBracket}</span>
        {!isExpanded && (
          <>
            <span className="text-zinc-500 mx-1 text-xs">{previewText}</span>
            <span className="text-zinc-400">{closeBracket}</span>
            <span className="text-zinc-400">{comma}</span>
          </>
        )}
      </div>
      {isExpanded && (
        <>
          <div className="ml-4 border-l border-zinc-700 pl-3">
            {entries.map(([key, value], index) => (
              <JsonNode
                key={isArray ? index : String(key)}
                data={value}
                keyName={isArray ? undefined : String(key)}
                isLast={index === entries.length - 1}
                depth={depth + 1}
                defaultExpanded={depth < 1}
              />
            ))}
          </div>
          <div>
            <span className="text-zinc-400">{closeBracket}</span>
            <span className="text-zinc-400">{comma}</span>
          </div>
        </>
      )}
    </div>
  )
}

interface JsonViewerProps {
  data: unknown
  rawText: string
}

export function JsonViewer({ data, rawText }: JsonViewerProps) {
  return (
    <div className="font-mono text-sm">
      <div className="bg-zinc-900 text-zinc-100 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <span className="text-xs text-zinc-400">JSON</span>
          <CopyButton text={rawText} />
        </div>
        <div className="p-4 overflow-x-auto">
          <JsonNode data={data} />
        </div>
      </div>
    </div>
  )
}
