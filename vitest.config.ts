import { configDefaults, defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/worktrees/**', '.worktrees/**']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname)
    }
  }
})
