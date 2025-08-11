import { describe, expect, it } from 'vitest'
import { getObjectWordCount } from '../wordCount'

describe('countWords', () => {
  it('counts words in simple text', () => {
    expect(getObjectWordCount({ text: 'hello world' })).toBe(2)
    expect(getObjectWordCount({ text: 'one two three four' })).toBe(4)
  })

  it('handles extra whitespace', () => {
    expect(getObjectWordCount({ text: '  hello   world  ' })).toBe(2)
    expect(getObjectWordCount({ text: 'one\ntwo\tthree    four' })).toBe(4)
  })

  it('strips HTML tags', () => {
    expect(getObjectWordCount({ content: '<p>hello <strong>world</strong></p>' })).toBe(2)
    expect(getObjectWordCount({ content: '<div>one</div> <span>two three</span>' })).toBe(3)
  })

  it('handles empty or invalid input', () => {
    expect(getObjectWordCount({})).toBe(0)
    expect(getObjectWordCount({ text: '' })).toBe(0)
    expect(getObjectWordCount({ text: '   ' })).toBe(0)
    expect(getObjectWordCount(null as any)).toBe(0)
    expect(getObjectWordCount(undefined as any)).toBe(0)
  })
})

describe('getObjectWordCount standard fields', () => {
  it('counts words in text fields', () => {
    const obj = {
      title: 'Hello World',
      description: 'This is a test',
      subTitle: 'Welcome back',
      content: 'Main content here',
    }
    expect(getObjectWordCount(obj)).toBe(11)
  })

  it('handles nested objects', () => {
    const obj = {
      title: 'Parent Title',
      child: {
        title: 'Child Title',
        description: 'Child description',
      },
    }
    expect(getObjectWordCount(obj)).toBe(6)
  })

  it('processes arrays of objects', () => {
    const obj = {
      title: 'Main Title',
      items: [
        { title: 'Item One' },
        { description: 'Second item' },
      ],
    }
    expect(getObjectWordCount(obj)).toBe(6)
  })
})

describe('getObjectWordCount taxonomy handling', () => {
  it('counts words in taxonomy fields', () => {
    const obj = {
      title: 'Main Title',
      tags: ['web-development', 'user interface', 'design'],
      categories: ['Programming', 'Front End'],
      topics: ['React JS', 'TypeScript'],
    }
    expect(getObjectWordCount(obj)).toBe(12)
  })

  it('handles mixed taxonomy and content', () => {
    const obj = {
      title: 'Blog Post',
      content: 'This is the main content',
      tags: ['javascript', 'programming'],
      categories: ['Tech Blog'],
    }
    expect(getObjectWordCount(obj)).toBe(11)
  })

  it('handles empty taxonomy arrays', () => {
    const obj = {
      title: 'Test',
      tags: [],
      categories: [],
      keywords: [],
    }
    expect(getObjectWordCount(obj)).toBe(1)
  })

  it('handles nested taxonomy fields', () => {
    const obj = {
      title: 'Parent',
      sections: [{
        title: 'Child',
        tags: ['tag-one', 'tag-two'],
        categories: ['Category One'],
      }],
    }
    expect(getObjectWordCount(obj)).toBe(6)
  })

  it('ignores invalid taxonomy values', () => {
    const obj = {
      tags: [null, undefined, '', 'valid-tag', 123, true],
    }
    expect(getObjectWordCount(obj)).toBe(1)
  })
})

describe('getObjectWordCount additional fields', () => {
  it('counts words in additional specified fields', () => {
    const obj = {
      title: 'Main Title',
      customField: 'Should count this',
      anotherField: 'Count this too',
    }
    expect(getObjectWordCount(obj, {
      addFields: ['customField', 'anotherField'],
    })).toBe(8)
  })

  it('combines additional fields with standard fields', () => {
    const obj = {
      title: 'Standard Field',
      customField: 'Additional Field',
      tags: ['one', 'two'],
    }
    expect(getObjectWordCount(obj, {
      addFields: ['customField'],
    })).toBe(6)
  })
})

describe('getObjectWordCount edge cases', () => {
  it('handles complex nested structures', () => {
    const obj = {
      title: 'Level 1',
      items: [{
        title: 'Level 2',
        tags: ['tag-one'],
        children: [{
          title: 'Level 3',
          categories: ['Category One', 'Category Two'],
          description: 'Deep description',
        }],
      }],
    }
    expect(getObjectWordCount(obj)).toBe(13)
  })

  it('handles mixed content types safely', () => {
    const obj = {
      title: 'Title',
      nullField: null,
      numberField: 123,
      boolField: true,
      tags: ['tag-one', null, undefined, 'tag-two'],
      description: 'Valid description',
    }
    expect(getObjectWordCount(obj)).toBe(5)
  })
})
