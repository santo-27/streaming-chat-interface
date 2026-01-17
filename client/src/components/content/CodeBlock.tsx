import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CopyButton } from '@/components/shared/CopyButton'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  return (
    <div className="my-4 rounded-lg overflow-hidden bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs text-zinc-400">{language}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
        }}
        codeTagProps={{
          style: {
            background: 'transparent',
          }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
