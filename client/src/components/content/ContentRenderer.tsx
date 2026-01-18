import type { ContentFormat, ParsedContent } from '@/types'
import { parseJson, formatNumber } from '@/utils/formatDetection'
import { JsonViewer } from '@/components/content/JsonViewer'
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer'

interface ContentRendererProps {
  content: string
  format: ContentFormat
  parsedContent?: ParsedContent
  showContentBadges?: boolean
}


// used for showing the bubble sorta thingy above the message.
// keeping it here cos its a dumb component.
function ContentBadges({ parsedContent }: { parsedContent: ParsedContent }) {
  const badges: { label: string; color: string }[] = []

  if (parsedContent.hasCode) {
    const langLabel = parsedContent.languages.length > 0
      ? parsedContent.languages.slice(0, 2).join(', ')
      : 'code'
    badges.push({ label: langLabel, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' })
  }

  if (parsedContent.hasJson) {
    badges.push({ label: 'JSON', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' })
  }

  if (parsedContent.hasTable) {
    badges.push({ label: 'table', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' })
  }

  if (parsedContent.hasList) {
    badges.push({ label: 'list', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' })
  }

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {badges.map((badge, i) => (
        <span
          key={i}
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}

export function ContentRenderer({ content, format, parsedContent, showContentBadges = false }: ContentRendererProps) {
  // Show content type badges if available and enabled
  const badges = showContentBadges && parsedContent ? (
    <ContentBadges parsedContent={parsedContent} />
  ) : null

  if (format === 'json') {
    const parsed = parseJson(content)
    if (!parsed) {
      return (
        <>
          {badges}
          <MarkdownRenderer content={content} />
        </>
      )
    }

    const formatted = JSON.stringify(parsed, null, 2)
    return (
      <>
        {badges}
        <JsonViewer data={parsed} rawText={formatted} />
      </>
    )
  }

  if (format === 'number') {
    return (
      <>
        {badges}
        <p className="text-2xl font-semibold tabular-nums">
          {formatNumber(content)}
        </p>
      </>
    )
  }
  // almost always we get text
  return (
    <>
      {badges}
      <MarkdownRenderer content={content} />
    </>
  )
}
