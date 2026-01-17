import type { ContentFormat } from '@/types'
import { parseJson, formatNumber } from '@/utils/formatDetection'
import { JsonViewer } from '@/components/content/JsonViewer'
import { MarkdownContent } from '@/components/content/MarkdownContent'

interface ContentRendererProps {
  content: string
  format: ContentFormat
}

export function ContentRenderer({ content, format }: ContentRendererProps) {
  if (format === 'json') {
    const parsed = parseJson(content)
    // doing this as a fallback in case the format detection was wrong
    if (!parsed) return <MarkdownContent content={content} />

    const formatted = JSON.stringify(parsed, null, 2)
    return <JsonViewer data={parsed} rawText={formatted} />
  }

  if (format === 'number') {
    return (
      <p className="text-2xl font-semibold tabular-nums">
        {formatNumber(content)}
      </p>
    )
  }

  return <MarkdownContent content={content} />
}
