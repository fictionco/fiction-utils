# @fiction/utils

A collection of well-tested TypeScript utility functions designed for
consistency and reusability.

## Features

- 🌳 **Tree-shakeable** - Import only what you need
- 📦 **ESM-only** - Modern ES modules with full tree-shaking support
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

### Import utilities (tree-shaking supported)

```typescript
// Import only what you need - unused functions will be tree-shaken by your bundler
import {
  toCamel,
  waitFor,
  uuid,
  fastHash,
  countWords,
  randomBetween,
} from "@fiction/utils";

// Or import everything (still tree-shakeable)
import * as utils from "@fiction/utils";
```

## Available Utilities

### Async Operations

```typescript
import { waitFor, throttle, debounce } from "@fiction/utils";

// Wait for a specific amount of time
await waitFor(1000); // Wait 1 second

// Throttle function calls
const throttledFn = throttle(myFunction, 100);

// Debounce function calls
const debouncedFn = debounce(myFunction, 300);
```

### Browser Utilities

```typescript
import { getAnonymousId } from "@fiction/utils";

// Get or create anonymous user ID
const { anonymousId, isNew } = getAnonymousId({
  anonIdKey: "MyAppAnonId",
  firstSessionKey: "MyAppFirstSession",
  cookieExpireDays: 365,
});
```

### Text Casing

```typescript
import { toCamel, toPascal, toSnake, toKebab } from "@fiction/utils";

toCamel("hello_world"); // 'helloWorld'
toPascal("hello-world"); // 'HelloWorld'
toSnake("helloWorld"); // 'hello_world'
toKebab("helloWorld"); // 'hello-world'
toSlug("Hello World!"); // 'hello-world'
toLabel("hello_world"); // 'Hello World'
capitalize("hello"); // 'Hello'

// Convert object keys
const obj = { user_name: "john", user_age: 30 };
convertKeyCase(obj, { mode: "camel" }); // { userName: 'john', userAge: 30 }
```

### ID Generation

```typescript
import { uuid, objectId, shortId } from "@fiction/utils";

uuid(); // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
objectId({ prefix: "usr" }); // 'usr507f1f77bcf86cd799439011'
shortId({ len: 8, withNumbers: true }); // 'a7b2x9k1'
```

### Template Parsing

```typescript
import { simpleHandlebarsParser } from "@fiction/utils";

const template = "Hello {{name}}!";
const context = { name: "World" };
simpleHandlebarsParser(template, context); // 'Hello World!'
```

### Hash Utilities

```typescript
import { fastHash, hashEqual, stringify } from "@fiction/utils";

// Generate consistent hashes for any data structure
fastHash({ name: "John", age: 30 }); // 'a1b2c3d4...'
fastHash([1, 2, 3]); // 'e5f6g7h8...'

// Compare objects by their hash
hashEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true (order independent)
hashEqual({ name: "John" }, { name: "Jane" }); // false

// Stringify with circular reference handling
stringify({ user: "data", nested: { deep: "value" } });
```

### Text/Word Counting

```typescript
import { countWords, getObjectWordCount } from "@fiction/utils";

// Count words in text, strips HTML
countWords("Hello <strong>world</strong>!"); // 2
countWords("  Multiple   spaces  "); // 2

// Count words in object text fields recursively
const obj = {
  title: "Blog Post",
  content: "This is the main content",
  tags: ["javascript", "programming"], // taxonomy fields supported
  metadata: { description: "More text here" },
};
getObjectWordCount(obj); // 11

// With custom fields and ignore options
getObjectWordCount(obj, {
  addFields: ["customField"],
  ignoreKeys: ["metadata"],
});
```

### Number Utilities

```typescript
import {
  randomBetween,
  numberFormatter,
  formatNumber,
  formatBytes,
  durationFormatter,
  isNumeric,
} from "@fiction/utils";

// Generate random numbers with decimal precision
randomBetween(1, 10, 2); // 3.47
randomBetween(1, 5, 0); // 3

// Format large numbers with abbreviations
numberFormatter(1500); // '1.5k'
numberFormatter(1000000); // '1.0m'
numberFormatter(1500000000); // '1.5b'

// Comprehensive number formatting
formatNumber(1234, "abbreviated"); // '1.2k'
formatNumber(0.75, "percent"); // '75%'
formatNumber(1234, "dollar"); // '$1,234'
formatNumber(3600, "duration"); // '1h 0m 0s'

// Format file sizes
formatBytes(1024); // '1 KB'
formatBytes(1024 * 1024); // '1 MB'

// Duration formatting
durationFormatter(90, "s"); // '1m 30s'
durationFormatter(3600, "s"); // '1h 0m 0s'

// Check if value is numeric
isNumeric("123"); // true
isNumeric("abc"); // false
```

### Object Utilities

```typescript
import {
  omit,
  removeUndefined,
  isPlainObject,
  parseObject,
  setNested,
  getNested,
  findValueByKey,
  deepMerge,
  deepMergeAll,
  getDotpathArrayIndices,
} from "@fiction/utils";

// Remove specific keys from objects
const obj = { a: 1, b: 2, c: 3 };
omit(obj, "a", "b"); // { c: 3 }

// Clean undefined/null values
removeUndefined({ a: 1, b: undefined, c: null }); // { a: 1, c: null }
removeUndefined({ a: 1, b: undefined, c: null }, { removeNull: true }); // { a: 1 }

// Check for plain objects (not arrays, dates, etc.)
isPlainObject({}); // true
isPlainObject([]); // false
isPlainObject(new Date()); // false

// Transform object values recursively
parseObject({
  obj: { a: 1, b: { c: 2 } },
  onValue: ({ value }) => (typeof value === "number" ? value * 2 : value),
}); // { a: 2, b: { c: 4 } }

// Set/get nested properties with dot notation
const data = { user: { name: "John" } };
setNested({ data, path: "user.age", value: 30 }); // { user: { name: 'John', age: 30 } }
getNested({ data, path: "user.name" }); // 'John'

// Find values by key recursively
findValueByKey({ a: { b: { target: "found" } } }, "target"); // 'found'

// Deep merge objects
deepMerge([{ a: 1 }, { b: 2 }, { a: 3 }]); // { a: 3, b: 2 }
deepMergeAll([{ items: [1] }, { items: [2] }]); // { items: [1, 2] }

// Extract array indices from dot paths
getDotpathArrayIndices("items.0.title"); // [0]
getDotpathArrayIndices("data.users.2.profile.1"); // [2, 1]
```

### Object Processing

```typescript
import { ObjectProcessor } from "@fiction/utils";

// Create a processor for transforming objects
const processor = new ObjectProcessor();

// Add processors for specific conditions
processor.addProcessor({
  condition: ({ value }) => value instanceof Date,
  action: (date: Date) => date.toISOString(),
});

processor.addProcessor({
  condition: ({ key }) => key === "password",
  action: () => "[REDACTED]",
});

// Process objects recursively
const userData = {
  name: "John",
  password: "secret123",
  created: new Date(),
  profile: {
    lastLogin: new Date(),
    settings: { password: "another-secret" },
  },
};

const processed = await processor.parseObject(userData);
// Dates converted to ISO strings, passwords redacted
```

### Shortcode Processing

```typescript
import { Shortcodes } from "@fiction/utils";

// Create shortcode processor
const processor = new Shortcodes();

// Add custom shortcodes
processor.addShortcode({
  shortcode: "user",
  handler: ({ attributes }) => `Hello ${attributes?.name || "Anonymous"}!`,
});

processor.addShortcode({
  shortcode: "upper",
  handler: ({ content }) => content?.toUpperCase() || "",
});

// Process strings with shortcodes
await processor.parseString('[@user name="John"] [@upper]welcome[/@upper]');
// Result: "Hello John! WELCOME"

// Process objects with shortcodes in strings
await processor.parseObject({
  title: "[@upper]my title[/@upper]",
  greeting: '[@user name="Jane"]',
  metadata: { author: '[@user name="Admin"]' },
});
// All shortcodes in string values are processed

// Built-in shortcodes: [@date], [@time], [@timestamp], [@cwd]
await processor.parseString("Report generated on [@date] at [@time]");
```

### UI Reset Management

```typescript
import { uiReset } from "@fiction/utils";

// Register reset callbacks for modals, dropdowns, etc.
const cleanup = uiReset.onReset(() => {
  closeModal();
  hideDropdown();
  clearTooltips();
});

// Cleanup when component unmounts (Vue example)
onUnmounted(cleanup);

// Manual reset trigger
uiReset.reset();

// Framework examples:

// Vue 3
import { onUnmounted } from 'vue';
const cleanup = uiReset.onReset(() => setShowModal(false));
onUnmounted(cleanup);

// React
import { useEffect } from 'react';
useEffect(() => {
  const cleanup = uiReset.onReset(() => setShowModal(false));
  return cleanup; // Cleanup on unmount
}, []);

// Astro/Vanilla JS
const cleanup = uiReset.onReset(() => {
  document.getElementById('modal').style.display = 'none';
});
// Call cleanup() when needed
```

**Features:**
- ✅ **Framework agnostic** - Works with Vue, React, Astro, vanilla JS
- ✅ **SSR safe** - No-op functions when `window` is undefined  
- ✅ **Standard browser APIs** - Uses `history` interception + `popstate` for route changes
- ✅ **Auto-triggers** - Escape key, window clicks, route navigation
- ✅ **Error handling** - Catches callback errors without breaking others

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

This package uses automated publishing via GitHub Actions with two workflows:

### Automatic Patch Releases (Continuous Deployment)

- **Trigger:** Every push to `main` branch
- **Process:** CI runs → Tests pass → Version bumped (patch) → Published to NPM
- **Use case:** Bug fixes, documentation updates, minor improvements

### Manual Releases (Minor/Major versions)

- **Trigger:** Manual workflow dispatch in GitHub Actions
- **Process:** Choose version bump type (patch/minor/major) → Tests pass →
  Version bumped → Tagged → Published to NPM
- **Use case:** New features (minor), breaking changes (major)

### Running Manual Release

1. Go to Actions tab in GitHub
2. Select "Manual Release" workflow
3. Click "Run workflow"
4. Choose version bump type (patch/minor/major)
5. GitHub Actions will handle the rest

### Setup GitHub Secrets

For the automated workflows to work, you need to set up these repository
secrets:

1. **`NPM_TOKEN`** - Your NPM authentication token for publishing
2. **`DISCORD_WEBHOOK_URL`** (optional) - Discord webhook URL for release
   notifications

### Discord Notifications

The workflows will automatically post to Discord when:

- ✅ Releases are successful or fail
- ✅ CI builds pass or fail on the main branch

To set up Discord notifications:

1. Create a Discord webhook in your server
2. Add the webhook URL to your GitHub repository secrets as
   `DISCORD_WEBHOOK_URL`

## License

MIT
