// Custom Markdown Renderer
// Renders parsed markdown AST into React components

import { parseMarkdown, parseInline, type BlockNode, type InlineNode } from '@/utils/markdownParser'
import { CodeBlock } from '@/components/content/CodeBlock'
import { JsonViewer } from '@/components/content/JsonViewer'
import { TableWrapper } from '@/components/content/TableWrapper'

// Render inline nodes
function InlineRenderer({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'text':
            return <span key={i}>{node.content}</span>

          case 'bold':
            return (
              <strong key={i} className="font-semibold">
                {node.children && <InlineRenderer nodes={node.children} />}
              </strong>
            )

          case 'italic':
            return (
              <em key={i}>
                {node.children && <InlineRenderer nodes={node.children} />}
              </em>
            )

          case 'code':
            return (
              <code
                key={i}
                className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono"
              >
                {node.content}
              </code>
            )

          case 'link':
            return (
              <a
                key={i}
                href={node.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {node.children && <InlineRenderer nodes={node.children} />}
              </a>
            )

          case 'strikethrough':
            return (
              <del key={i} className="line-through">
                {node.children && <InlineRenderer nodes={node.children} />}
              </del>
            )

          default:
            return null
        }
      })}
    </>
  )
}

// Try to parse JSON for syntax highlighting
function tryParseJson(code: string): unknown | null {
  try {
    return JSON.parse(code.trim())
  } catch {
    return null
  }
}

// Render a code block
function CodeBlockRenderer({ content, language }: { content: string; language: string }) {
  // Special handling for JSON
  if (language === 'json' || language === 'jsonc') {
    const parsed = tryParseJson(content)
    if (parsed) {
      return <JsonViewer data={parsed} rawText={content} />
    }
  }

  return <CodeBlock code={content} language={language} />
}

// Render a table
function TableRenderer({ headers, alignments, rows }: {
  headers: string[]
  alignments: ('left' | 'center' | 'right' | null)[]
  rows: string[][]
}) {
  const getAlignment = (index: number): React.CSSProperties => {
    const align = alignments[index]
    if (!align) return {}
    return { textAlign: align }
  }

  return (
    <TableWrapper>
      <thead className="bg-zinc-100 dark:bg-zinc-800">
        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
          {headers.map((header, i) => (
            <th
              key={i}
              className="px-4 py-2 text-left font-semibold border-b border-zinc-200 dark:border-zinc-700"
              style={getAlignment(i)}
            >
              <InlineRenderer nodes={parseInline(header)} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
            {row.map((cell, cellIdx) => (
              <td
                key={cellIdx}
                className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800"
                style={getAlignment(cellIdx)}
              >
                <InlineRenderer nodes={parseInline(cell)} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  )
}

// Render block nodes
function BlockRenderer({ nodes }: { nodes: BlockNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.type) {
          case 'paragraph':
            return (
              <p key={i} className="mb-3 last:mb-0 leading-relaxed">
                {node.children && <InlineRenderer nodes={node.children} />}
              </p>
            )

          case 'heading': {
            const level = node.level || 1
            const content = node.children && <InlineRenderer nodes={node.children} />

            switch (level) {
              case 1:
                return <h1 key={i} className="text-2xl font-bold mb-3 mt-4 first:mt-0">{content}</h1>
              case 2:
                return <h2 key={i} className="text-xl font-bold mb-2 mt-3 first:mt-0">{content}</h2>
              case 3:
                return <h3 key={i} className="text-lg font-semibold mb-2 mt-3 first:mt-0">{content}</h3>
              case 4:
                return <h4 key={i} className="text-base font-semibold mb-2 mt-2 first:mt-0">{content}</h4>
              case 5:
                return <h5 key={i} className="text-sm font-semibold mb-1 mt-2 first:mt-0">{content}</h5>
              case 6:
                return <h6 key={i} className="text-sm font-medium mb-1 mt-2 first:mt-0">{content}</h6>
              default:
                return <h1 key={i} className="text-2xl font-bold mb-3 mt-4 first:mt-0">{content}</h1>
            }
          }

          case 'code_block':
            return (
              <div key={i} className="my-3">
                <CodeBlockRenderer
                  content={node.content || ''}
                  language={node.language || 'text'}
                />
              </div>
            )

          case 'blockquote':
            return (
              <blockquote
                key={i}
                className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400"
              >
                {node.nested && <BlockRenderer nodes={node.nested} />}
              </blockquote>
            )

          case 'list':
            if (node.ordered) {
              return (
                <ol key={i} className="mb-3 ml-4 list-decimal space-y-1">
                  {node.items?.map((item, j) => (
                    <li key={j} className="leading-relaxed">
                      {item.children && <InlineRenderer nodes={item.children} />}
                    </li>
                  ))}
                </ol>
              )
            }
            return (
              <ul key={i} className="mb-3 ml-4 list-disc space-y-1">
                {node.items?.map((item, j) => (
                  <li key={j} className="leading-relaxed">
                    {item.children && <InlineRenderer nodes={item.children} />}
                  </li>
                ))}
              </ul>
            )

          case 'table':
            if (node.tableData) {
              return (
                <div key={i} className="my-3">
                  <TableRenderer
                    headers={node.tableData.headers}
                    alignments={node.tableData.alignments}
                    rows={node.tableData.rows}
                  />
                </div>
              )
            }
            return null

          case 'hr':
            return <hr key={i} className="my-4 border-zinc-200 dark:border-zinc-700" />

          default:
            return null
        }
      })}
    </>
  )
}

// Main component
export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = parseMarkdown(content)
  return <BlockRenderer nodes={blocks} />
}
