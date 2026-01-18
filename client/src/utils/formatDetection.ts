// Content format detection utilities
// Uses the new content parser for rich content detection

import type { ContentFormat, ParsedContent } from '@/types'
import { parseContent, detectPrimaryFormat } from './contentParser'

// Main function: parses content and returns both parsed structure and primary format
export function analyzeContent(content: string): { parsed: ParsedContent; format: ContentFormat } {
  const parsed = parseContent(content)
  const format = detectPrimaryFormat(parsed)
  return { parsed, format }
}

// Legacy function kept for backward compatibility
export function detectFormat(content: string): ContentFormat {
  const { format } = analyzeContent(content)
  return format
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
