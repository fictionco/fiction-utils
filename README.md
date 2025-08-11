# @fiction/utils

A collection of well-tested TypeScript utility functions designed for consistency and reusability across projects.

## Features

- 🌳 **Tree-shakeable** - Import only what you need
- 📦 **Dual package** - ESM and CommonJS support
- 🔧 **TypeScript first** - Full type safety
- 🧪 **Well tested** - Comprehensive test coverage
- 🚀 **Zero dependencies** - Lightweight and fast
- 🎯 **Modern targets** - Node.js 18+ and modern browsers

## Installation

```bash
npm install @fiction/utils
# or
pnpm add @fiction/utils
# or
yarn add @fiction/utils
```

## Usage

### Import everything

```typescript
import { toCamel, waitFor, uuid } from '@fiction/utils'
```

### Import specific modules (tree-shakeable)

```typescript
import { toCamel, toSnake } from '@fiction/utils/casing'
import { waitFor, throttle } from '@fiction/utils/async'
import { uuid, objectId } from '@fiction/utils/id'
```

## Available Utilities

### Async Operations (`/async`)

```typescript
import { waitFor, throttle, debounce } from '@fiction/utils/async'

// Wait for a specific amount of time
await waitFor(1000) // Wait 1 second

// Throttle function calls
const throttledFn = throttle(myFunction, 100)

// Debounce function calls
const debouncedFn = debounce(myFunction, 300)
```

### Browser Utilities (`/browser`)

```typescript
import { getAnonymousId } from '@fiction/utils/browser'

// Get or create anonymous user ID
const { anonymousId, isNew } = getAnonymousId({
  anonIdKey: 'MyAppAnonId',
  firstSessionKey: 'MyAppFirstSession',
  cookieExpireDays: 365
})
```

### Text Casing (`/casing`)

```typescript
import { toCamel, toPascal, toSnake, toKebab } from '@fiction/utils/casing'

toCamel('hello_world') // 'helloWorld'
toPascal('hello-world') // 'HelloWorld'
toSnake('helloWorld') // 'hello_world'
toKebab('helloWorld') // 'hello-world'
toSlug('Hello World!') // 'hello-world'
toLabel('hello_world') // 'Hello World'
capitalize('hello') // 'Hello'

// Convert object keys
const obj = { user_name: 'john', user_age: 30 }
convertKeyCase(obj, { mode: 'camel' }) // { userName: 'john', userAge: 30 }
```

### ID Generation (`/id`)

```typescript
import { uuid, objectId, shortId } from '@fiction/utils/id'

uuid() // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
objectId({ prefix: 'usr' }) // 'usr507f1f77bcf86cd799439011'
shortId({ len: 8, withNumbers: true }) // 'a7b2x9k1'
```

### Template Parsing (`/template`)

```typescript
import { simpleHandlebarsParser } from '@fiction/utils/template'

const template = 'Hello {{name}}!'
const context = { name: 'World' }
simpleHandlebarsParser(template, context) // 'Hello World!'
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build the package
pnpm build

# Lint code
pnpm lint

# Type check
pnpm typecheck
```

## Publishing

This package uses automated publishing via GitHub Actions. To publish:

1. Update version in `package.json`
2. Create and push a git tag: `git tag v1.0.0 && git push origin v1.0.0`
3. GitHub Actions will automatically build and publish to NPM

### Setup GitHub Secrets

For the automated workflows to work, you need to set up these repository secrets:

1. **`NPM_TOKEN`** - Your NPM authentication token for publishing
2. **`DISCORD_WEBHOOK_URL`** (optional) - Discord webhook URL for release notifications

### Discord Notifications

The workflows will automatically post to Discord when:
- ✅ Releases are successful or fail
- ✅ CI builds pass or fail on the main branch

To set up Discord notifications:
1. Create a Discord webhook in your server
2. Add the webhook URL to your GitHub repository secrets as `DISCORD_WEBHOOK_URL`

## License

MIT