# @fiction/utils - Claude Code Reference

Framework-agnostic TypeScript utilities for modern web development.

## Key Features
- Tree-shakeable ESM exports
- Full TypeScript support  
- Zero runtime dependencies
- SSR/Node.js compatible
- Comprehensive test coverage

## Core Utilities

### Text Processing
- `toCamel()`, `toPascal()`, `toSnake()`, `toKebab()` - Case conversions
- `convertKeyCase()` - Transform object keys
- `countWords()` - Count words in text/HTML

### IDs & Hashing
- `uuid()` - Generate UUIDs
- `objectId()` - MongoDB-style IDs with prefixes
- `fastHash()` - Consistent hashing for any data
- `hashEqual()` - Compare objects by hash

### Async Operations
- `waitFor()` - Promise-based delays
- `throttle()`, `debounce()` - Rate limiting

### Object Manipulation
- `omit()` - Remove object keys
- `deepMerge()` - Merge objects recursively
- `getNested()`, `setNested()` - Dot-path object access
- `removeUndefined()` - Clean objects

### Numbers & Formatting
- `randomBetween()` - Random numbers with precision
- `formatNumber()` - Format as currency, percent, etc.
- `formatBytes()` - Human-readable file sizes

### UI Management
- `uiReset` - Global UI reset manager for modals/dropdowns
  - Auto-triggers: Escape key, clicks, route changes
  - Framework agnostic (Vue/React/Astro)
  - SSR safe

### Advanced Processing
- `ObjectProcessor` - Transform objects with custom rules
- `Shortcodes` - Template processing with custom tags

## Usage Patterns

```typescript
import { uiReset, toCamel, waitFor, uuid } from '@fiction/utils'

// UI reset management
const cleanup = uiReset.onReset(() => closeModal())

// Case conversion
const apiData = convertKeyCase(data, { mode: 'camel' })

// Async operations
await waitFor(1000)

// ID generation
const id = uuid()
```

## Installation
```bash
npm install @fiction/utils
```

All functions are pure, side-effect free, and designed for composition.