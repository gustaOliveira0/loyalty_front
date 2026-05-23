import { describe, it, expect } from 'vitest'
import { navigationGuard } from './index.js'

const route = (path, { public: isPublic = false } = {}) => ({
  path,
  meta: { public: isPublic },
})

describe('navigationGuard', () => {
  describe('when logged out (no token)', () => {
    it('redirects protected routes to /login', () => {
      expect(navigationGuard(route('/dashboard'))).toBe('/login')
      expect(navigationGuard(route('/customers'))).toBe('/login')
    })

    it('allows public routes', () => {
      expect(navigationGuard(route('/login', { public: true }))).toBeUndefined()
      expect(navigationGuard(route('/register', { public: true }))).toBeUndefined()
      expect(navigationGuard(route('/cadastro/42', { public: true }))).toBeUndefined()
    })
  })

  describe('when logged in (token present)', () => {
    beforeEach(() => localStorage.setItem('token', 'jwt'))

    it('allows protected routes', () => {
      expect(navigationGuard(route('/dashboard'))).toBeUndefined()
    })

    it('bounces /login and /register to /dashboard', () => {
      expect(navigationGuard(route('/login', { public: true }))).toBe('/dashboard')
      expect(navigationGuard(route('/register', { public: true }))).toBe('/dashboard')
    })

    it('still allows the public customer registration page', () => {
      expect(navigationGuard(route('/cadastro/42', { public: true }))).toBeUndefined()
    })
  })
})
