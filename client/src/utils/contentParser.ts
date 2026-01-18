import type { ContentSegment, ParsedContent, ContentFormat } from '@/types'

// Regex patterns for markdown elements (without 'g' flag for use with .test())
const ORDERED_LIST_REGEX = /^\d+\.\s+.+$/m
const UNORDERED_LIST_REGEX = /^[-*+]\s+.+$/m
const BLOCKQUOTE_REGEX = /^>\s+.+$/m

interface CodeBlock {
  fullMatch: string
  language: string
  code: string
  startIndex: number
  endIndex: number
}

function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      fullMatch: match[0],
      language: match[1]?.toLowerCase() || 'text',
      code: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return blocks
}

function isTableBlock(text: string): boolean {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return false

  // Check if first line looks like a table header
  const firstLine = lines[0].trim()
  if (!firstLine.startsWith('|') || !firstLine.endsWith('|')) return false

  // Check for separator line (second line should have dashes)
  const secondLine = lines[1].trim()
  if (!secondLine.match(/^\|[-:\s|]+\|$/)) return false

  return true
}

function extractTableBlocks(content: string): { text: string; startIndex: number; endIndex: number }[] {
  const tables: { text: string; startIndex: number; endIndex: number }[] = []
  const lines = content.split('\n')
  let inTable = false
  let tableStart = 0
  let currentIndex = 0
  let tableLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineStart = currentIndex
    currentIndex += line.length + 1 // +1 for newline

    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|')
    const isSeparatorLine = !!line.trim().match(/^\|[-:\s|]+\|$/)

    if (isTableLine || isSeparatorLine) {
      if (!inTable) {
        inTable = true
        tableStart = lineStart
        tableLines = []
      }
      tableLines.push(line)
    } else {
      if (inTable && tableLines.length >= 2) {
        // Validate it's actually a table (has separator)
        const tableText = tableLines.join('\n')
        if (isTableBlock(tableText)) {
          tables.push({
            text: tableText,
            startIndex: tableStart,
            endIndex: lineStart - 1,
          })
        }
      }
      inTable = false
      tableLines = []
    }
  }

  // Handle table at end of content
  if (inTable && tableLines.length >= 2) {
    const tableText = tableLines.join('\n')
    if (isTableBlock(tableText)) {
      tables.push({
        text: tableText,
        startIndex: tableStart,
        endIndex: content.length,
      })
    }
  }

  return tables
}

function tryParseJson(content: string): unknown | null {
  try {
    return JSON.parse(content.trim())
  } catch {
    return null
  }
}

function detectHeadings(content: string): { level: number; text: string; index: number }[] {
  const headings: { level: number; text: string; index: number }[] = []
  const regex = /^(#{1,6})\s+(.+)$/gm
  let match

  while ((match = regex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      index: match.index,
    })
  }

  return headings
}

function hasLists(content: string): { ordered: boolean; unordered: boolean } {
  return {
    ordered: ORDERED_LIST_REGEX.test(content),
    unordered: UNORDERED_LIST_REGEX.test(content),
  }
}

function hasBlockquotes(content: string): boolean {
  return BLOCKQUOTE_REGEX.test(content)
}

export function parseContent(content: string): ParsedContent {
  const segments: ContentSegment[] = []
  const languages: string[] = []
  let hasCode = false
  let hasJson = false
  let hasTable = false
  let hasList = false

  // Extract code blocks first (they take priority)
  const codeBlocks = extractCodeBlocks(content)

  // Extract tables from non-code content
  const tables = extractTableBlocks(content)

  // Check for lists
  const lists = hasLists(content)
  hasList = lists.ordered || lists.unordered

  // Track what we've already processed
  const processedRanges: { start: number; end: number; type: string }[] = []

  // Process code blocks
  for (const block of codeBlocks) {
    hasCode = true
    if (block.language && block.language !== 'text' && !languages.includes(block.language)) {
      languages.push(block.language)
    }

    const isJsonCode = block.language === 'json' || block.language === 'jsonc'
    const parsed = isJsonCode ? tryParseJson(block.code) : null

    if (parsed) {
      hasJson = true
      segments.push({
        type: 'json',
        content: block.code,
        language: block.language,
        parsed,
      })
    } else {
      segments.push({
        type: 'code',
        content: block.code,
        language: block.language,
      })
    }

    processedRanges.push({
      start: block.startIndex,
      end: block.endIndex,
      type: 'code',
    })
  }

  // Process tables (that aren't inside code blocks)
  for (const table of tables) {
    const isInsideCode = processedRanges.some(
      range => range.type === 'code' &&
        table.startIndex >= range.start &&
        table.endIndex <= range.end
    )

    if (!isInsideCode) {
      hasTable = true
      segments.push({
        type: 'table',
        content: table.text,
      })
      processedRanges.push({
        start: table.startIndex,
        end: table.endIndex,
        type: 'table',
      })
    }
  }

  // Check headings
  const headings = detectHeadings(content)
  for (const heading of headings) {
    const isInsideProcessed = processedRanges.some(
      range => heading.index >= range.start && heading.index <= range.end
    )

    if (!isInsideProcessed) {
      segments.push({
        type: 'heading',
        content: heading.text,
        level: heading.level,
      })
    }
  }

  // Check for blockquotes
  if (hasBlockquotes(content)) {
    segments.push({
      type: 'blockquote',
      content: '', // Content is in the markdown
    })
  }

  // Add text segments for remaining content
  // Sort processed ranges
  processedRanges.sort((a, b) => a.start - b.start)

  let lastEnd = 0
  for (const range of processedRanges) {
    if (range.start > lastEnd) {
      const textContent = content.slice(lastEnd, range.start).trim()
      if (textContent) {
        segments.push({
          type: 'text',
          content: textContent,
        })
      }
    }
    lastEnd = range.end
  }

  // Add remaining text after last processed range
  if (lastEnd < content.length) {
    const textContent = content.slice(lastEnd).trim()
    if (textContent) {
      segments.push({
        type: 'text',
        content: textContent,
      })
    }
  }

  // If no segments were found, treat entire content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: content,
    })
  }

  return {
    segments,
    hasCode,
    hasJson,
    hasTable,
    hasList,
    languages,
  }
}

export function detectPrimaryFormat(parsedContent: ParsedContent): ContentFormat {
  // Determine the "primary" format based on what's present
  // Priority: json > table > text (code is still text for display purposes)

  if (parsedContent.hasJson) {
    return 'json'
  }

  if (parsedContent.hasTable) {
    return 'table'
  }

  // Check if entire content is a single number
  if (parsedContent.segments.length === 1 && parsedContent.segments[0].type === 'text') {
    const text = parsedContent.segments[0].content.trim()
    if (text !== '' && !isNaN(Number(text)) && text.match(/^-?\d+\.?\d*$/)) {
      return 'number'
    }
  }

  return 'text'
}

export function getContentSummary(parsedContent: ParsedContent): string {
  const parts: string[] = []

  if (parsedContent.hasCode) {
    if (parsedContent.languages.length > 0) {
      parts.push(`code (${parsedContent.languages.join(', ')})`)
    } else {
      parts.push('code')
    }
  }

  if (parsedContent.hasJson) {
    parts.push('JSON')
  }

  if (parsedContent.hasTable) {
    parts.push('table')
  }

  if (parsedContent.hasList) {
    parts.push('list')
  }

  const hasOnlyText = parsedContent.segments.every(s => s.type === 'text')
  if (hasOnlyText) {
    parts.push('text')
  } else if (parsedContent.segments.some(s => s.type === 'text')) {
    parts.push('text')
  }

  return parts.join(', ')
}
