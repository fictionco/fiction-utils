# Contributing Guidelines

## Code Style
- Use TypeScript with strict mode enabled
- Follow functional programming patterns where possible
- Prefer immutability and pure functions
- Use descriptive variable and function names
- Keep functions small and focused on single responsibility

## Testing
- Write comprehensive unit tests for all utilities
- Aim for 100% test coverage
- Use descriptive test names that explain the behavior
- Test edge cases and error conditions
- Use Vitest testing framework

## Documentation
- Add JSDoc comments for all public functions
- Include parameter and return type descriptions
- Provide usage examples in JSDoc
- Document any side effects or limitations

## Utility Requirements
- All utilities must be tree-shakeable
- No external runtime dependencies unless absolutely necessary
- Support Node.js 18+ and modern browsers
- Include proper TypeScript types
- Handle edge cases gracefully