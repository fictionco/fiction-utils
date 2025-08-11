/**
 * Parse a simple handlebars template
 */
export function simpleHandlebarsParser(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match: string, key: string): string => {
    return Object.prototype.hasOwnProperty.call(context, key) ? context[key]! : match
  })
}