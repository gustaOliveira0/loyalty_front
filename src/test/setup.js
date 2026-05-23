import { beforeEach, vi } from 'vitest'

// jsdom provides localStorage, but we reset it before every test so specs
// never leak auth state into each other.
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
