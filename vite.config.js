/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
  },
  test: {
    // Browser-like globals (document, localStorage, window) for component tests.
    environment: 'jsdom',
    // Use describe/it/expect without importing them in every file.
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,mjs}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/main.js', 'src/test/**'],
    },
  },
})
