import { parseContent, detectPrimaryFormat, getContentSummary } from '../utils/contentParser'

// Tests for contentParser.ts
describe('parseContent', () => {
  describe('code blocks', () => {
    // Tests for code block extraction
    it('extracts code block with language', () => {
      const content = '```javascript\nconst x = 1;\n```'
      const result = parseContent(content)

      expect(result.hasCode).toBe(true)
      expect(result.languages).toContain('javascript')
      expect(result.segments).toContainEqual(
        expect.objectContaining({
          type: 'code',
          language: 'javascript',
          content: 'const x = 1;\n',
        })
      )
    })

    it('extracts multiple code blocks', () => {
      const content = '```python\nprint("hello")\n```\nSome text\n```rust\nfn main() {}\n```'
      const result = parseContent(content)

      expect(result.hasCode).toBe(true)
      expect(result.languages).toContain('python')
      expect(result.languages).toContain('rust')
    })

    it('handles code block without language', () => {
      const content = '```\nsome code\n```'
      const result = parseContent(content)

      expect(result.hasCode).toBe(true)
      expect(result.segments).toContainEqual(
        expect.objectContaining({
          type: 'code',
          language: 'text',
        })
      )
    })
  })

  describe('JSON detection', () => {
    it('detects JSON in json code block', () => {
      const content = '```json\n{"name": "test"}\n```'
      const result = parseContent(content)

      expect(result.hasJson).toBe(true)
      expect(result.segments).toContainEqual(
        expect.objectContaining({
          type: 'json',
          parsed: { name: 'test' },
        })
      )
    })

    it('does not flag invalid JSON in json block', () => {
      const content = '```json\n{invalid json}\n```'
      const result = parseContent(content)

      expect(result.hasJson).toBe(false)
      expect(result.hasCode).toBe(true)
    })
  })

  describe('table detection', () => {
    it('detects markdown table', () => {
      const content = `| Header1 | Header2 |
|---------|---------|
| Cell1   | Cell2   |`

      const result = parseContent(content)
      expect(result.hasTable).toBe(true)
      expect(result.segments).toContainEqual(
        expect.objectContaining({ type: 'table' })
      )
    })

    it('does not detect table inside code block', () => {
      const content = '```\n| Not | Table |\n|---|---|\n```'
      const result = parseContent(content)

      expect(result.hasTable).toBe(false)
      expect(result.hasCode).toBe(true)
    })
  })

  describe('list detection', () => {
    it('detects ordered list', () => {
      const content = '1. First item\n2. Second item'
      const result = parseContent(content)
      expect(result.hasList).toBe(true)
    })

    it('detects unordered list with dash', () => {
      const content = '- Item one\n- Item two'
      const result = parseContent(content)
      expect(result.hasList).toBe(true)
    })

    it('detects unordered list with asterisk', () => {
      const content = '* Item one\n* Item two'
      const result = parseContent(content)
      expect(result.hasList).toBe(true)
    })
  })

  describe('heading detection', () => {
    it('detects headings', () => {
      const content = '# Heading 1\nSome text\n## Heading 2'
      const result = parseContent(content)

      expect(result.segments).toContainEqual(
        expect.objectContaining({
          type: 'heading',
          level: 1,
          content: 'Heading 1',
        })
      )
      expect(result.segments).toContainEqual(
        expect.objectContaining({
          type: 'heading',
          level: 2,
          content: 'Heading 2',
        })
      )
    })
  })

  describe('plain text', () => {
    it('returns text segment for plain content', () => {
      const content = 'Just plain text'
      const result = parseContent(content)

      expect(result.segments).toContainEqual(
        expect.objectContaining({
          type: 'text',
          content: 'Just plain text',
        })
      )
    })

    it('handles empty content', () => {
      const result = parseContent('')
      expect(result.segments.length).toBeGreaterThan(0)
    })
  })
})

describe('detectPrimaryFormat', () => {
  it('returns json when JSON is present', () => {
    const parsed = parseContent('```json\n{"a":1}\n```')
    expect(detectPrimaryFormat(parsed)).toBe('json')
  })

  it('returns table when table is present (no JSON)', () => {
    const parsed = parseContent('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(detectPrimaryFormat(parsed)).toBe('table')
  })

  it('returns number for single numeric content', () => {
    const parsed = parseContent('42')
    expect(detectPrimaryFormat(parsed)).toBe('number')
  })

  it('returns number for negative decimals', () => {
    const parsed = parseContent('-123.45')
    expect(detectPrimaryFormat(parsed)).toBe('number')
  })

  it('returns text for regular content', () => {
    const parsed = parseContent('Hello world')
    expect(detectPrimaryFormat(parsed)).toBe('text')
  })

  it('returns text for content with code but no JSON', () => {
    const parsed = parseContent('```python\nprint("hi")\n```')
    expect(detectPrimaryFormat(parsed)).toBe('text')
  })
})

describe('getContentSummary', () => {
  it('summarizes content with code', () => {
    const parsed = parseContent('```python\ncode\n```')
    const summary = getContentSummary(parsed)
    expect(summary).toContain('code')
    expect(summary).toContain('python')
  })

  it('summarizes content with JSON', () => {
    const parsed = parseContent('```json\n{"a":1}\n```')
    const summary = getContentSummary(parsed)
    expect(summary).toContain('JSON')
  })

  it('summarizes content with table', () => {
    const parsed = parseContent('| A |\n|---|\n| 1 |')
    const summary = getContentSummary(parsed)
    expect(summary).toContain('table')
  })

  it('summarizes content with list', () => {
    const parsed = parseContent('- item 1\n- item 2')
    const summary = getContentSummary(parsed)
    expect(summary).toContain('list')
  })
})
