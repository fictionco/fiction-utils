# Project Structure

## File Organization
- Flat structure in `src/` directory
- Each utility category in its own file (e.g., `casing.ts`, `async.ts`)
- No nested folders for utilities
- Export all functions from `src/index.ts`

## Build Configuration
- Uses Vite for building and bundling
- Outputs both ESM and CJS formats
- Generates TypeScript declaration files
- Tree-shakeable exports

## Available Utilities

### `async.ts`
- `waitFor(ms)` - Promise-based delay
- `throttle(func, wait)` - Throttle function calls
- `debounce(func, delay)` - Debounce function calls

### `browser.ts`
- `getAnonymousId(config)` - Get/set anonymous user ID

### `casing.ts`
- `toCamel(str)` - Convert to camelCase
- `toPascal(str)` - Convert to PascalCase  
- `toSnake(str)` - Convert to snake_case
- `toKebab(str)` - Convert to kebab-case
- `toSlug(str)` - Convert to URL slug
- `toLabel(str)` - Convert to human label
- `capitalize(str)` - Capitalize first letter
- `convertKeyCase(obj, mode)` - Convert object keys

### `id.ts`
- `objectId(prefix)` - Generate MongoDB-style ID
- `uuid()` - Generate UUID v4
- `shortId(options)` - Generate short ID

### `template.ts`
- `simpleHandlebarsParser(template, context)` - Simple template parsing