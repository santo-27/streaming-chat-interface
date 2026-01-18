// Custom Markdown Parser
// Converts markdown text into a structured AST for rendering

export type InlineNodeType = 'text' | 'bold' | 'italic' | 'code' | 'link' | 'strikethrough'
export type BlockNodeType = 'paragraph' | 'heading' | 'code_block' | 'blockquote' | 'list' | 'list_item' | 'table' | 'hr' | 'blank'

export interface InlineNode {
  type: InlineNodeType
  content?: string
  children?: InlineNode[]
  href?: string
}

export interface TableData {
  headers: string[]
  alignments: ('left' | 'center' | 'right' | null)[]
  rows: string[][]
}

export interface BlockNode {
  type: BlockNodeType
  children?: InlineNode[]
  content?: string
  level?: number // for headings (1-6)
  language?: string // for code blocks
  ordered?: boolean // for lists
  items?: BlockNode[] // for list items
  tableData?: TableData // for tables
  nested?: BlockNode[] // for nested content (blockquotes)
}

// Parse inline markdown elements
export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Check for inline code first (highest priority to avoid conflicts)
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      nodes.push({ type: 'code', content: codeMatch[1] })
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Check for links [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      nodes.push({
        type: 'link',
        href: linkMatch[2],
        children: parseInline(linkMatch[1])
      })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Check for bold **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/)
    if (boldMatch) {
      nodes.push({
        type: 'bold',
        children: parseInline(boldMatch[2])
      })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Check for italic *text* or _text_ (but not inside words for underscore)
    const italicMatch = remaining.match(/^(\*|_)(.+?)\1/)
    if (italicMatch) {
      nodes.push({
        type: 'italic',
        children: parseInline(italicMatch[2])
      })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Check for strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/)
    if (strikeMatch) {
      nodes.push({
        type: 'strikethrough',
        children: parseInline(strikeMatch[1])
      })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // Regular text - consume until next special character
    const textMatch = remaining.match(/^[^`\[\]*_~]+/)
    if (textMatch) {
      nodes.push({ type: 'text', content: textMatch[0] })
      remaining = remaining.slice(textMatch[0].length)
      continue
    }

    // Single special character that didn't match a pattern
    nodes.push({ type: 'text', content: remaining[0] })
    remaining = remaining.slice(1)
  }

  return nodes
}

// Parse a table from markdown lines
function parseTable(lines: string[]): TableData | null {
  if (lines.length < 2) return null

  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1) // Remove empty first and last elements
      .map(cell => cell.trim())
  }

  const headers = parseRow(lines[0])

  // Parse alignment from separator row
  const separatorCells = parseRow(lines[1])
  const alignments = separatorCells.map(cell => {
    const trimmed = cell.trim()
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center' as const
    if (trimmed.endsWith(':')) return 'right' as const
    if (trimmed.startsWith(':')) return 'left' as const
    return null
  })

  const rows = lines.slice(2).map(parseRow)

  return { headers, alignments, rows }
}

// Parse block-level markdown elements
export function parseMarkdown(text: string): BlockNode[] {
  const blocks: BlockNode[] = []
  const lines = text.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line
    if (trimmed === '') {
      i++
      continue
    }

    // Horizontal rule
    if (/^([-*_]){3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        children: parseInline(headingMatch[2])
      })
      i++
      continue
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'text'
      const codeLines: string[] = []
      i++

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }

      blocks.push({
        type: 'code_block',
        language,
        content: codeLines.join('\n')
      })
      i++ // Skip closing ```
      continue
    }

    // Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [line]
      i++

      // Check if next line is separator
      if (i < lines.length && /^\|[-:\s|]+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i])
        i++

        // Collect remaining table rows
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i])
          i++
        }

        const tableData = parseTable(tableLines)
        if (tableData) {
          blocks.push({ type: 'table', tableData })
          continue
        }
      }

      // Not a valid table, treat as paragraph
      i = i - tableLines.length + 1
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []

      while (i < lines.length && (lines[i].trim().startsWith('>') || lines[i].trim() === '')) {
        const qLine = lines[i].trim()
        if (qLine === '' && quoteLines.length > 0 && !quoteLines[quoteLines.length - 1].startsWith('>')) {
          break
        }
        quoteLines.push(qLine.replace(/^>\s?/, ''))
        i++
      }

      blocks.push({
        type: 'blockquote',
        nested: parseMarkdown(quoteLines.join('\n'))
      })
      continue
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: BlockNode[] = []

      while (i < lines.length) {
        const listLine = lines[i]
        const listTrimmed = listLine.trim()

        if (/^[-*+]\s+/.test(listTrimmed)) {
          const content = listTrimmed.replace(/^[-*+]\s+/, '')
          items.push({
            type: 'list_item',
            children: parseInline(content)
          })
          i++
        } else if (listTrimmed === '' || /^\s+/.test(listLine)) {
          // Continuation or blank line within list
          if (listTrimmed === '') {
            i++
            // Check if list continues after blank line
            if (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
              continue
            }
            break
          }
          i++
        } else {
          break
        }
      }

      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: BlockNode[] = []

      while (i < lines.length) {
        const listLine = lines[i]
        const listTrimmed = listLine.trim()

        if (/^\d+\.\s+/.test(listTrimmed)) {
          const content = listTrimmed.replace(/^\d+\.\s+/, '')
          items.push({
            type: 'list_item',
            children: parseInline(content)
          })
          i++
        } else if (listTrimmed === '' || /^\s+/.test(listLine)) {
          if (listTrimmed === '') {
            i++
            if (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
              continue
            }
            break
          }
          i++
        } else {
          break
        }
      }

      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    // Regular paragraph - collect lines until blank line or block element
    const paragraphLines: string[] = []

    while (i < lines.length) {
      const pLine = lines[i]
      const pTrimmed = pLine.trim()

      // Stop at blank line
      if (pTrimmed === '') break

      // Stop at block elements
      if (/^#{1,6}\s+/.test(pTrimmed)) break
      if (pTrimmed.startsWith('```')) break
      if (/^[-*+]\s+/.test(pTrimmed)) break
      if (/^\d+\.\s+/.test(pTrimmed)) break
      if (pTrimmed.startsWith('>')) break
      if (/^([-*_]){3,}$/.test(pTrimmed)) break
      if (pTrimmed.startsWith('|') && pTrimmed.endsWith('|')) break

      paragraphLines.push(pLine)
      i++
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        children: parseInline(paragraphLines.join('\n'))
      })
    }
  }

  return blocks
}
