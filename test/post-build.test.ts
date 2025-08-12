import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

describe('post-build verification', () => {
  const distPath = resolve(process.cwd(), 'dist')
  
  beforeAll(() => {
    // Ensure build has been run
    if (!existsSync(distPath)) {
      console.log('Building package...')
      execSync('pnpm build', { stdio: 'inherit' })
    }
  })

  describe('build output structure', () => {
    it('should generate expected ESM-only output files', () => {
      // Check main entry files
      expect(existsSync(resolve(distPath, 'index.js'))).toBe(true)
      expect(existsSync(resolve(distPath, 'index.d.ts'))).toBe(true)
      
      // Check source maps
      expect(existsSync(resolve(distPath, 'index.js.map'))).toBe(true)
      
      // Should NOT have CommonJS files
      expect(existsSync(resolve(distPath, 'index.cjs'))).toBe(false)
      expect(existsSync(resolve(distPath, 'index.cjs.map'))).toBe(false)
    })

    it('should not generate individual module files (single entry point)', () => {
      // Verify we don't have separate module files
      const files = ['async.js', 'browser.js', 'casing.js', 'hash.js', 'id.js', 'number.js', 'parse.js', 'wordCount.js']
      for (const file of files) {
        expect(existsSync(resolve(distPath, file))).toBe(false)
      }
    })
  })

  describe('ESM build verification', () => {
    it('should have proper ESM syntax in index.js', () => {
      const content = readFileSync(resolve(distPath, 'index.js'), 'utf-8')
      
      // Check for ESM exports (at the end of the file)
      expect(content).toMatch(/export\s+{[\s\S]+}/)
      
      // The build may include bundled dependencies with module.exports, 
      // but our own code should use ESM exports at the end
      expect(content).toMatch(/export\s*{[\s\S]*toCamel[\s\S]*}/)
    })

    it('should export all expected utilities', () => {
      const content = readFileSync(resolve(distPath, 'index.js'), 'utf-8')
      
      const expectedExports = [
        'waitFor',
        'throttle',
        'debounce',
        'getAnonymousId',
        'toCamel',
        'toPascal',
        'toSnake',
        'toKebab',
        'toSlug',
        'toLabel',
        'capitalize',
        'convertKeyCase',
        'uuid',
        'objectId',
        'shortId',
        'simpleHandlebarsParser',
        'fastHash',
        'hashEqual',
        'stringify',
        'countWords',
        'getObjectWordCount',
        'randomBetween',
        'numberFormatter',
        'formatNumber',
        'formatBytes',
        'durationFormatter',
        'isNumeric',
      ]
      
      for (const exportName of expectedExports) {
        expect(content).toContain(exportName)
      }
    })
  })

  describe('TypeScript definitions verification', () => {
    it('should generate comprehensive type definitions', () => {
      const content = readFileSync(resolve(distPath, 'index.d.ts'), 'utf-8')
      
      // Check for key interface/type exports (may be declared as 'declare interface')
      expect(content).toMatch(/(export\s+)?(declare\s+)?interface\s+AnonymousIdConfig/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?interface\s+AnonymousIdResult/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?interface\s+NumberFormatterOptions/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?type\s+HashObject/)
      
      // Check for function declarations (may be 'declare function' or 'export declare function')
      expect(content).toMatch(/(export\s+)?(declare\s+)?function\s+waitFor/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?function\s+toCamel/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?function\s+uuid/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?function\s+fastHash/)
      expect(content).toMatch(/(export\s+)?(declare\s+)?function\s+randomBetween/)
    })

    it('should export all utility functions with types', () => {
      const content = readFileSync(resolve(distPath, 'index.d.ts'), 'utf-8')
      
      const functionDeclarations = content.match(/export\s+declare\s+function\s+(\w+)/g) || []
      
      // Should have all our utility functions
      expect(functionDeclarations.length).toBeGreaterThan(20)
    })
  })

  describe('package.json exports verification', () => {
    it('should be importable as ESM only', async () => {
      // Create a test file that imports the built package
      const testImport = `
        import * as utils from './dist/index.js'
        if (typeof utils.uuid !== 'function') throw new Error('uuid not exported')
        if (typeof utils.toCamel !== 'function') throw new Error('toCamel not exported')
        console.log('ESM import successful')
      `
      
      const testFile = resolve(process.cwd(), 'test-esm-import.mjs')
      const fs = await import('node:fs')
      fs.writeFileSync(testFile, testImport)
      
      try {
        execSync(`node ${testFile}`, { stdio: 'pipe' })
      } finally {
        fs.unlinkSync(testFile)
      }
    })

    it('should NOT have CommonJS exports', () => {
      const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
      
      // Should not have require export
      expect(packageJson.exports['.'].require).toBeUndefined()
      
      // Should only have ESM exports
      expect(packageJson.exports['.'].import).toBeDefined()
      expect(packageJson.exports['.'].types).toBeDefined()
    })
  })

  describe('tree-shaking verification', () => {
    it('should have preserveModules disabled for proper tree-shaking', () => {
      const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf-8')
      expect(viteConfig).toContain('preserveModules: false')
    })

    it('should use single entry point for tree-shaking', () => {
      const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
      
      // Should only have one export entry
      expect(Object.keys(packageJson.exports)).toHaveLength(1)
      expect(packageJson.exports['.']).toBeDefined()
      
      // Should not have subpath exports
      expect(packageJson.exports['./async']).toBeUndefined()
      expect(packageJson.exports['./casing']).toBeUndefined()
    })

    it('should only build ESM format', () => {
      const viteConfig = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf-8')
      expect(viteConfig).toMatch(/formats:\s*\[\s*'es'\s*\]/)
    })
  })

  describe('source maps verification', () => {
    it('should generate valid source map for ESM only', () => {
      const esmMap = JSON.parse(readFileSync(resolve(distPath, 'index.js.map'), 'utf-8'))
      
      // Check source map structure
      expect(esmMap.version).toBe(3)
      expect(esmMap.sources).toBeInstanceOf(Array)
      expect(esmMap.mappings).toBeTruthy()
      
      // Should not have CJS source map
      expect(existsSync(resolve(distPath, 'index.cjs.map'))).toBe(false)
    })
  })

  describe('modern JavaScript verification', () => {
    it('should use modern JS features without transpilation for legacy', () => {
      const content = readFileSync(resolve(distPath, 'index.js'), 'utf-8')
      
      // Should use modern arrow functions
      expect(content).toContain('=>')
      
      // Should use modern spread syntax
      expect(content).toContain('...')
      
      // Should use const/let (not var for our code)
      expect(content).toMatch(/\b(const|let)\s+/)
    })

    it('should target modern Node.js (18+) in package.json', () => {
      const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
      
      expect(packageJson.engines.node).toBe('>=18')
      expect(packageJson.type).toBe('module')
    })
  })
})