import { parseJson, parseTable, formatNumber, detectFormat } from '../utils/formatDetection'

describe('parseJson', () => {
  it('parses valid JSON object', () => {
    const result = parseJson('{"name": "test", "value": 123}')
    expect(result).toEqual({ name: 'test', value: 123 })
  })

  it('parses valid JSON array', () => {
    const result = parseJson('[1, 2, 3]')
    expect(result).toEqual([1, 2, 3])
  })

  it('handles whitespace around JSON', () => {
    const result = parseJson('  { "key": "value" }  ')
    expect(result).toEqual({ key: 'value' })
  })

  it('returns null for invalid JSON', () => {
    expect(parseJson('not json')).toBeNull()
    expect(parseJson('{invalid}')).toBeNull()
    expect(parseJson('')).toBeNull()
  })
})

describe('parseTable', () => {
  it('parses a basic markdown table', () => {
    const table = `| Name | Age |
| --- | --- |
| Alice | 30 |
| Bob | 25 |`

    const result = parseTable(table)
    expect(result).toEqual({
      headers: ['Name', 'Age'],
      rows: [['Alice', '30'], ['Bob', '25']],
    })
  })

  it('parses table with alignment markers', () => {
    const table = `| Left | Center | Right |
|:---|:---:|---:|
| a | b | c |`

    const result = parseTable(table)
    expect(result).toEqual({
      headers: ['Left', 'Center', 'Right'],
      rows: [['a', 'b', 'c']],
    })
  })

  it('returns null for content with less than 2 lines', () => {
    expect(parseTable('single line')).toBeNull()
    expect(parseTable('')).toBeNull()
  })

  it('handles extra whitespace in cells', () => {
    const table = `|  Name  |  Value  |
| --- | --- |
|  test  |  123  |`

    const result = parseTable(table)
    expect(result?.headers).toEqual(['Name', 'Value'])
    expect(result?.rows[0]).toEqual(['test', '123'])
  })
})

describe('formatNumber', () => {
  it('formats integer with locale separators', () => {
    const result = formatNumber('1000000')
    expect(result).toMatch(/1[,.]000[,.]000/)
  })

  it('formats decimal numbers', () => {
    const result = formatNumber('1234.56')
    expect(result).toMatch(/1[,.]234/)
  })

  it('returns original value for non-numeric strings', () => {
    expect(formatNumber('not a number')).toBe('not a number')
    expect(formatNumber('abc123')).toBe('abc123')
  })

  it('handles negative numbers', () => {
    const result = formatNumber('-1000')
    expect(result).toMatch(/-1[,.]000/)
  })

  it('handles whitespace', () => {
    const result = formatNumber('  42  ')
    expect(result).toBe('42')
  })
})

describe('detectFormat', () => {
  it('detects plain text', () => {
    expect(detectFormat('Hello world')).toBe('text')
  })

  it('detects number format', () => {
    expect(detectFormat('42')).toBe('number')
    expect(detectFormat('-123.45')).toBe('number')
  })

  it('detects JSON in code block', () => {
    const content = '```json\n{"key": "value"}\n```'
    expect(detectFormat(content)).toBe('json')
  })

  it('detects table format', () => {
    const table = `| Col1 | Col2 |
| --- | --- |
| a | b |`
    expect(detectFormat(table)).toBe('table')
  })
})
