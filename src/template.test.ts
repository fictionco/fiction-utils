import { describe, expect, it } from 'vitest'
import { simpleHandlebarsParser } from './template'

describe('simpleHandlebarsParser', () => {
  it('replaces placeholders with context values', () => {
    const template = 'Hello, {{name}}! Welcome to {{place}}.'
    const context = { name: 'Alice', place: 'Wonderland' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('Hello, Alice! Welcome to Wonderland.')
  })

  it('leaves unmatched placeholders unchanged', () => {
    const template = '{{greeting}}, {{name}}! {{farewell}}'
    const context = { name: 'Bob' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('{{greeting}}, Bob! {{farewell}}')
  })

  it('handles an empty template', () => {
    const template = ''
    const context = { key: 'value' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('')
  })

  it('handles an empty context', () => {
    const template = 'Hello, {{name}}!'
    const context = {}
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('Hello, {{name}}!')
  })

  it('handles multiple occurrences of the same placeholder', () => {
    const template = '{{name}} and {{name}} went to {{place}}'
    const context = { name: 'Alice', place: 'the store' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('Alice and Alice went to the store')
  })

  it('handles numeric values in context', () => {
    const template = 'You have {{count}} items'
    const context = { count: '5' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('You have 5 items')
  })

  it('handles special characters in replacement values', () => {
    const template = 'Email: {{email}}'
    const context = { email: 'user@example.com' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('Email: user@example.com')
  })

  it('only replaces exact word matches', () => {
    const template = '{{name}} has {{names}} in common'
    const context = { name: 'John', names: 'many names' }
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('John has many names in common')
  })

  it('handles context with prototype properties', () => {
    const context = Object.create({ inherited: 'should not be used' })
    context.name = 'Direct Property'

    const template = 'Name: {{name}}, Inherited: {{inherited}}'
    const result = simpleHandlebarsParser(template, context)
    expect(result).toBe('Name: Direct Property, Inherited: {{inherited}}')
  })
})
