import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/components/content/CodeBlock'
import { JsonViewer } from '@/components/content/JsonViewer'
import { TableWrapper } from '@/components/content/TableWrapper'
import { parseJson } from '@/utils/formatDetection'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || '')
          const codeString = String(children).replace(/\n$/, '')
          const isInline = !match && !codeString.includes('\n')

          if (isInline) {
            return (
              <code className="bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          }

          const language = match?.[1]?.toLowerCase()
          if (language === 'json' || language === 'jsonc') {
            const parsed = parseJson(codeString)
            
            // gotta come up with a method that would always parse the JSON correctly
            if (parsed) {
              return <JsonViewer data={parsed} rawText={codeString} />
            }
          }

          return <CodeBlock code={codeString} language={match?.[1] || 'text'} />
        },
        table({ children }) {
          return <TableWrapper>{children}</TableWrapper>
        },
        thead({ children }) {
          return <thead className="bg-zinc-100 dark:bg-zinc-800">{children}</thead>
        },
        th({ children }) {
          return (
            <th className="px-4 py-2 text-left font-semibold border-b border-zinc-200 dark:border-zinc-700">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
              {children}
            </td>
          )
        },
        tr({ children }) {
          return (
            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">{children}</tr>
          )
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        },
        ul({ children }) {
          return <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400">
              {children}
            </blockquote>
          )
        },
        hr() {
          return <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {children}
            </a>
          )
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
