import { useState, type FormEvent } from 'react'

export function App() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // check for empty input or ongoing request
    if (!input.trim() || loading) return

    // preventing the user from spamming prompts
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        console.log('Received chunk:', value);

        const chunk = decoder.decode(value)

        console.log('Decoded chunk:', chunk);
        // splitting not working properly might be a problem in the future.

        const lines = chunk.split('\n');

        console.log('Split lines:', lines);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            // console.log('Received data:', data);
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                setResponse(prev => prev + parsed.text)
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setResponse('Error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your prompt here"
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>

        {response && (
          <div className="p-4 bg-white rounded-lg whitespace-pre-wrap">
            {response}
          </div>
        )}
      </div>
    </div>
  )
}
