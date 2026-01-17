// no real value is being added here. just utility functions to detect and parse content formats to fulfill the requirements mentioned.

import type { ContentFormat } from '@/types'

export function detectFormat(content: string): ContentFormat {
  const trimmed = content.trim()

  // Check for JSON (objects or arrays)
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {

    // the return wont even execute if JSON.parse fails, there might be a better way tho..... :/
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch (err) {
      console.error('JSON parse error during format detection:', err);
        // Not valid JSON, continue checking
    }
  }

  // why should i do this when we are able to handle python code or stuff like that ?

  // Check for markdown table (lines with | separators)
  const lines = trimmed.split('\n')
  if (lines.length >= 2) {
    const hasTableSyntax = lines.every(line => {
      const trimmedLine = line.trim()
      return trimmedLine.includes('|') || trimmedLine.match(/^[-|:\s]+$/)
    })
    if (hasTableSyntax && lines[0].includes('|')) {
      return 'table'
    }
  }

  // Check for pure number
  if (trimmed !== '' && !isNaN(Number(trimmed)) && trimmed.match(/^-?\d+\.?\d*$/)) {
    return 'number'
  }

  return 'text'
}

export function parseJson(content: string): unknown {
  try {
    return JSON.parse(content.trim())
  } catch {
    return null
  }
}

export function parseTable(content: string): { headers: string[]; rows: string[][] } | null {
  // Split content into lines and filter out empty lines
  const lines = content.trim().split('\n').filter(line => line.trim())

  // because a table needs at least a header and one row at least
  if (lines.length < 2) return null


  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .map(cell => cell.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1 || arr.length === 1)
  }

  const headers = parseRow(lines[0])

  // Skip separator line (the one with dashes)
  const dataStartIndex = lines[1].match(/^[-|:\s]+$/) ? 2 : 1
  const rows = lines.slice(dataStartIndex).map(parseRow)

  return { headers, rows }
}

export function formatNumber(value: string): string {
  const num = Number(value.trim())
  if (isNaN(num)) return value
  return num.toLocaleString()
}
