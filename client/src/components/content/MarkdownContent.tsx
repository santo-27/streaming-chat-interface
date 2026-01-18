// Custom markdown content renderer
// Uses our own markdown parser instead of external libraries

import { MarkdownRenderer } from '@/components/content/MarkdownRenderer'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return <MarkdownRenderer content={content} />
}
