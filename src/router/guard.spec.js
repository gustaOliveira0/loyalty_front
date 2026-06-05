import { describe, it, expect, beforeEach } from 'vitest'
import { navigationGuard } from './index.js'

const route = (path, meta = {}) => ({ path, meta })

const adminUser = { id: 1, role: 'admin', permissions: null }
const collaboratorUser = {
  id: 2, role: 'collaborator',
  permissions: {
    can_edit_customers: false, can_delete_customers: false,
    can_create_sales: true, can_manage_products: false,
    can_manage_categories: false, can_manage_credit_rules: false,
    can_view_dashboard: true, can_manage_settings: false,
  }
}

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

  describe('when logged in as admin', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'jwt')
      localStorage.setItem('user', JSON.stringify(adminUser))
    })

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

    it('allows adminOnly routes', () => {
      expect(navigationGuard(route('/collaborators', { adminOnly: true }))).toBeUndefined()
      expect(navigationGuard(route('/profile', { adminOnly: true }))).toBeUndefined()
    })

    it('allows permission-gated routes', () => {
      expect(navigationGuard(route('/settings', { permission: 'can_manage_settings' }))).toBeUndefined()
    })
  })

  describe('when logged in as collaborator', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'collab-jwt')
      localStorage.setItem('user', JSON.stringify(collaboratorUser))
    })

    it('blocks adminOnly routes and redirects to dashboard', () => {
      expect(navigationGuard(route('/collaborators', { adminOnly: true }))).toBe('/dashboard')
      expect(navigationGuard(route('/profile', { adminOnly: true }))).toBe('/dashboard')
    })

    it('blocks permission-gated routes the collaborator lacks', () => {
      expect(navigationGuard(route('/settings', { permission: 'can_manage_settings' }))).toBe('/dashboard')
    })

    it('allows permission-gated routes the collaborator has', () => {
      expect(navigationGuard(route('/sales', { permission: 'can_create_sales' }))).toBeUndefined()
    })

    it('allows routes with no meta restrictions', () => {
      expect(navigationGuard(route('/customers'))).toBeUndefined()
      expect(navigationGuard(route('/products'))).toBeUndefined()
    })
  })
})
