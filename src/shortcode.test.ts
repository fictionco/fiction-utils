import { beforeEach, describe, expect, it } from 'vitest'
import { Shortcodes } from './shortcode'

describe('shortcodes tests', () => {
  const shortcodes = new Shortcodes({ cwd: '/test/cwd' })

  beforeEach(() => {
    shortcodes.clear()
    shortcodes.addShortcode({ shortcode: 'mock', handler: () => 'MockResult' })
    shortcodes.addShortcode({
      shortcode: 'mock_attr',
      handler: (args) => {
        const attr = Object.entries(args.attributes || {}).map(([key, value]) => `${key}:${value}`).join(', ')
        return `MockResult: ${attr}`
      },
    })
  })

  it('should parse attributes with escaped quotes', async () => {
    const result = shortcodes.parseAttributes(`search=\\\"test\\\"`)
    const expected = { search: 'test' }
    expect(result).toEqual(expected)
  })

  it('should parse a string with a cwd shortcode', async () => {
    const { text } = await shortcodes.parseString('Current directory: [@cwd]')
    expect(text).toBe('Current directory: /test/cwd')
  })

  it('should parse a string with date and time shortcodes', async () => {
    const dateString = new Date().toLocaleDateString()
    const timeString = new Date().toLocaleTimeString()
    const result = await shortcodes.parseString('Today is [@date] and the time is [@time]')
    expect(result.text).toBe(`Today is ${dateString} and the time is ${timeString}`)
  })

  it('should handle custom shortcodes', async () => {
    shortcodes.addShortcode({ shortcode: 'greeting', handler: () => 'Hello World' })
    const result = await shortcodes.parseString('Greeting: [@greeting]')
    expect(result.text).toBe('Greeting: Hello World')
  })

  it('should recursively parse an object with shortcodes', async () => {
    const settings = {
      directory: '[@cwd]',
      today: '[@date]',
      greeting: 'Welcome to [@siteName]',
    }
    shortcodes.addShortcode({ shortcode: 'siteName', handler: () => 'MySite' })
    const parsedSettings = await shortcodes.parseObject(settings)
    expect(parsedSettings).toEqual({
      directory: '/test/cwd',
      today: new Date().toLocaleDateString(),
      greeting: 'Welcome to MySite',
    })
  })

  it('should correctly process content within shortcodes', async () => {
    shortcodes.addShortcode({ shortcode: 'sc', handler: (args) => `Processed: ${args.content}` })
    const result = await shortcodes.parseString('[@sc]sample content[/@sc]')
    expect(result.text).toBe('Processed: sample content')
  })

  it('should handle nested content shortcodes', async () => {
    shortcodes.addShortcode({ shortcode: 'outer', handler: (args) => `Outer Start ${args.content} Outer End` })
    shortcodes.addShortcode({ shortcode: 'inner', handler: (args) => `Inner Start ${args.content} Inner End` })
    const result = await shortcodes.parseString('[@outer][@inner]content[/@inner][/@outer]')
    expect(result.text).toBe('Outer Start Inner Start content Inner End Outer End')
  })

  it('should handle shortcodes with attributes', async () => {
    shortcodes.addShortcode({ shortcode: 'sc', handler: (args) => `Attribute: ${args.attributes?.attribute}, Content: ${args.content}` })
    const result = await shortcodes.parseString('[@sc attribute="value"]sample content[/@sc]')
    expect(result.text).toBe('Attribute: value, Content: sample content')
  })

  it('should handle shortcodes with multiple attributes', async () => {
    shortcodes.addShortcode({ shortcode: 'multi', handler: (args) => {
      return `Attributes: ${args.attributes?.first}, ${args.attributes?.second}; Content: ${args.content}`
    } })
    const result = await shortcodes.parseString('[@multi first="one" second="two"]content here[/@multi]')
    expect(result.text).toBe('Attributes: one, two; Content: content here')
  })

  it('should handle shortcodes with attributes but no content', async () => {
    shortcodes.addShortcode({ shortcode: 'attrOnly', handler: (args) => `Only attribute: ${args.attributes?.only}` })
    const result = await shortcodes.parseString('[@attrOnly only="attribute-value"]')
    expect(result.text).toBe('Only attribute: attribute-value')
  })

  it('should handle shortcodes with empty attributes', async () => {
    shortcodes.addShortcode({ shortcode: 'emptyAttr', handler: (args) => `Empty attribute: ${args.attributes?.empty}` })
    const result = await shortcodes.parseString('[@emptyAttr empty=""]')
    expect(result.text).toBe('Empty attribute: ')
  })

  it('should return empty string when input is empty', async () => {
    const result = await shortcodes.parseString('')
    expect(result.text).toBe('')
  })

  it('should return the original string if it contains no shortcodes', async () => {
    const original = 'This is a test string without shortcodes.'
    const result = await shortcodes.parseString(original)
    expect(result.text).toBe(original)
  })

  it('should ignore unrecognized shortcodes', async () => {
    const original = 'This string contains an [@unknown] shortcode.'
    const result = await shortcodes.parseString(original)
    expect(result.text).toBe(original)
  })

  it('should handle shortcodes with special characters in names and attributes', async () => {
    shortcodes.addShortcode({ shortcode: 'special@char', handler: (args) => `Special: ${args.attributes?.['attr@special']}` })
    const result = await shortcodes.parseString('[@special@char attr@special="value"]')
    expect(result.text).toBe('Special: value')
  })

  it('should handle different types of whitespace within shortcode tags and attributes', async () => {
    shortcodes.addShortcode({ shortcode: 'whitespace', handler: () => 'Whitespace handled' })
    const result = await shortcodes.parseString('[@  whitespace   ]')
    expect(result.text).toBe('Whitespace handled')
  })

  it('should correctly parse single and double quotes in attribute values', async () => {
    shortcodes.addShortcode({ shortcode: 'quoteTest', handler: (args) => `Quote: ${args.attributes?.quote}` })
    const singleQuoteResult = await shortcodes.parseString('[@quoteTest quote=\'single quote\']')
    const doubleQuoteResult = await shortcodes.parseString('[@quoteTest quote="double quote"]')
    expect(singleQuoteResult.text).toBe('Quote: single quote')
    expect(doubleQuoteResult.text).toBe('Quote: double quote')
  })

  it('should not treat escaped shortcodes as valid', async () => {
    const result = await shortcodes.parseString('This is not a shortcode: \\[@escaped]')
    expect(result.text).toBe('This is not a shortcode: [@escaped]')
  })

  it('should gracefully handle invalid shortcode formats', async () => {
    const invalidFormatString = 'This is an invalid format: [@invalid'
    const result = await shortcodes.parseString(invalidFormatString)
    expect(result.text).toBe(invalidFormatString)
  })

  it('should parse escaped string values', async () => {
    const input = `"""
    {
      "userConfig": {
        "mediaItems": [
          {
            "media": {
              "url": "[@mock_attr search=\"futuristic secret agent technology\" orientation=\"landscape\" description=\"spies playing baseball\"]",
              "format": "url"
            }
          }
        ]
      }
    }"""`

    const result = await shortcodes.parseObject({ input })
    expect(result.input).toContain('MockResult: search:futuristic secret agent technology, orientation:landscape, description:spies playing baseball')
  })

  it('should parse simple string values', async () => {
    const input = { key: 'Some [@mock]' }
    const expected = { key: 'Some MockResult' }
    expect(await shortcodes.parseObject(input)).toEqual(expected)
  })

  it('should recursively parse nested objects', async () => {
    const input = { nested: { key: 'Nested [@mock]' } }
    const expected = { nested: { key: 'Nested MockResult' } }
    expect(await shortcodes.parseObject(input)).toEqual(expected)
  })

  it('should parse each object in an array of objects', async () => {
    const input = { array: [{ key: 'Item 1 [@mock]' }, { key: 'Item 2 [@mock]' }] }
    const expected = { array: [{ key: 'Item 1 MockResult' }, { key: 'Item 2 MockResult' }] }
    expect(await shortcodes.parseObject(input)).toEqual(expected)
  })

  it('should parse each string in an array of strings', async () => {
    const input = { array: ['String 1 [@mock]', 'String 2 [@mock]'] }
    const expected = { array: ['String 1 MockResult', 'String 2 MockResult'] }
    expect(await shortcodes.parseObject(input)).toEqual(expected)
  })

  it('should correctly handle objects with mixed types', async () => {
    const input = { string: 'Some [@mock]', array: ['String [@mock]'], nested: { key: 'Nested [@mock]' } }
    const expected = { string: 'Some MockResult', array: ['String MockResult'], nested: { key: 'Nested MockResult' } }
    expect(await shortcodes.parseObject(input)).toEqual(expected)
  })

  it('should leave non-string values unchanged', async () => {
    const input = { number: 123, boolean: true, nullValue: null }
    expect(await shortcodes.parseObject(input)).toEqual(input)
  })
})

describe('synchronous shortcodes', () => {
  const shortcodes = new Shortcodes({ cwd: '/test/cwd' })

  beforeEach(() => {
    shortcodes.clear()
  })

  it('should parse a string with synchronous shortcodes', () => {
    const result = shortcodes.parseStringSync('Current directory: [@cwd]')
    expect(result.text).toBe('Current directory: /test/cwd')
  })

  it('should handle custom synchronous shortcodes', () => {
    shortcodes.addShortcode({ shortcode: 'syncGreeting', handler: () => 'Hello Sync World' })
    const result = shortcodes.parseStringSync('Sync Greeting: [@syncGreeting]')
    expect(result.text).toBe('Sync Greeting: Hello Sync World')
  })

  it('should recursively parse nested synchronous shortcodes', () => {
    shortcodes.addShortcode({ shortcode: 'outer', handler: ({ content }) => `<outer>${content}</outer>` })
    shortcodes.addShortcode({ shortcode: 'inner', handler: ({ content }) => `<inner>${content}</inner>` })
    const result = shortcodes.parseStringSync('[@outer][@inner]content[/@inner][/@outer]')
    expect(result.text).toBe('<outer><inner>content</inner></outer>')
  })

  it('should handle shortcodes with attributes in sync mode', () => {
    shortcodes.addShortcode({ shortcode: 'attr', handler: ({ attributes }) => `Attribute: ${attributes?.value}` })
    const result = shortcodes.parseStringSync('[@attr value="test"]')
    expect(result.text).toBe('Attribute: test')
  })

  it('should throw an error when encountering an async shortcode in sync mode', () => {
    shortcodes.addShortcode({ shortcode: 'asyncShortcode', handler: async () => 'Async Result' })
    expect(() => {
      shortcodes.parseStringSync('This will fail: [@asyncShortcode]')
    }).toThrow('Synchronous parsing is not possible when async shortcodes are present')
  })

  it('should handle multiple shortcodes in a single string synchronously', () => {
    shortcodes.addShortcode({ shortcode: 'one', handler: () => '1' })
    shortcodes.addShortcode({ shortcode: 'two', handler: () => '2' })
    const result = shortcodes.parseStringSync('Count: [@one] [@two] [@one]')
    expect(result.text).toBe('Count: 1 2 1')
  })

  it('should ignore unrecognized shortcodes in sync mode', () => {
    const result = shortcodes.parseStringSync('This [@unknown] shortcode will be ignored')
    expect(result.text).toBe('This [@unknown] shortcode will be ignored')
  })

  it('should handle escaped shortcodes in sync mode', () => {
    const result = shortcodes.parseStringSync('This \\[@escaped] is not a shortcode')
    expect(result.text).toBe('This [@escaped] is not a shortcode')
  })

  it('should process shortcodes with empty content in sync mode', () => {
    shortcodes.addShortcode({ shortcode: 'empty', handler: ({ content }) => `Empty: "${content}"` })
    const result = shortcodes.parseStringSync('[@empty][/@empty]')
    expect(result.text).toBe('Empty: ""')
  })

  it('should handle complex nested structures synchronously', () => {
    shortcodes.addShortcode({ shortcode: 'list', handler: ({ content }) => `<ul>${content}</ul>` })
    shortcodes.addShortcode({ shortcode: 'item', handler: ({ content }) => `<li>${content}</li>` })
    const input = '[@list][@item]First[/@item][@item]Second[/@item][/@list]'
    const result = shortcodes.parseStringSync(input)
    expect(result.text).toBe('<ul><li>First</li><li>Second</li></ul>')
  })
})
