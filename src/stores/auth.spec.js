import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.js'
import api from '../api/index.js'

vi.mock('../api/index.js', () => ({
  default: { post: vi.fn() },
}))

const fakeAdminResponse = {
  data: { token: 'jwt-token-123', user: { id: 1, name: 'Loja', email: 'loja@x.com', role: 'admin', permissions: null } },
}
const fakeAuthResponse = fakeAdminResponse

const fakeCollaboratorResponse = {
  data: {
    token: 'collab-jwt-456',
    user: {
      id: 10, name: 'Ana', email: 'ana@loja.com', role: 'collaborator',
      permissions: {
        can_edit_customers: false, can_delete_customers: false,
        can_create_sales: true, can_manage_products: false,
        can_manage_categories: false, can_manage_credit_rules: false,
        can_view_dashboard: true, can_manage_settings: false,
      }
    }
  }
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts logged out when localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.isLoggedIn).toBe(false)
    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
  })

  describe('login', () => {
    it('stores token + user in state and localStorage', async () => {
      api.post.mockResolvedValueOnce(fakeAuthResponse)
      const store = useAuthStore()

      await store.login('loja@x.com', 'secret')

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'loja@x.com',
        password: 'secret',
      })
      expect(store.token).toBe('jwt-token-123')
      expect(store.user).toEqual(fakeAdminResponse.data.user)
      expect(store.isLoggedIn).toBe(true)
      expect(localStorage.getItem('token')).toBe('jwt-token-123')
    })

    it('propagates the error and stays logged out on failure', async () => {
      api.post.mockRejectedValueOnce(new Error('401'))
      const store = useAuthStore()

      await expect(store.login('loja@x.com', 'wrong')).rejects.toThrow()
      expect(store.isLoggedIn).toBe(false)
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('register', () => {
    it('sends the full payload and persists the session', async () => {
      api.post.mockResolvedValueOnce(fakeAuthResponse)
      const store = useAuthStore()

      await store.register('Loja', 'loja@x.com', 'secret', 'secret')

      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Loja',
        email: 'loja@x.com',
        password: 'secret',
        password_confirmation: 'secret',
      })
      expect(store.isLoggedIn).toBe(true)
    })
  })

  describe('logout', () => {
    it('clears state and localStorage', async () => {
      api.post.mockResolvedValueOnce(fakeAuthResponse)
      const store = useAuthStore()
      await store.login('loja@x.com', 'secret')

      store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(store.isLoggedIn).toBe(false)
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('admin role', () => {
    it('isAdmin is true when role is admin', async () => {
      api.post.mockResolvedValueOnce(fakeAdminResponse)
      const store = useAuthStore()
      await store.login('loja@x.com', 'secret')
      expect(store.isAdmin).toBe(true)
    })

    it('isAdmin is true when role is absent (legacy token)', () => {
      const store = useAuthStore()
      store.user = { id: 1, name: 'X', email: 'x@x.com' }
      expect(store.isAdmin).toBe(true)
    })

    it('can() always returns true for admin', async () => {
      api.post.mockResolvedValueOnce(fakeAdminResponse)
      const store = useAuthStore()
      await store.login('loja@x.com', 'secret')
      expect(store.can('can_edit_customers')).toBe(true)
      expect(store.can('can_manage_settings')).toBe(true)
      expect(store.can('can_delete_customers')).toBe(true)
    })
  })

  describe('collaborator role', () => {
    beforeEach(async () => {
      api.post.mockResolvedValueOnce(fakeCollaboratorResponse)
      const store = useAuthStore()
      await store.login('ana@loja.com', 'senha123')
      return store
    })

    it('isAdmin is false for collaborator', () => {
      const store = useAuthStore()
      expect(store.isAdmin).toBe(false)
    })

    it('can() returns true for granted permissions', () => {
      const store = useAuthStore()
      expect(store.can('can_create_sales')).toBe(true)
      expect(store.can('can_view_dashboard')).toBe(true)
    })

    it('can() returns false for denied permissions', () => {
      const store = useAuthStore()
      expect(store.can('can_edit_customers')).toBe(false)
      expect(store.can('can_delete_customers')).toBe(false)
      expect(store.can('can_manage_products')).toBe(false)
      expect(store.can('can_manage_settings')).toBe(false)
    })

    it('can() returns false for unknown permissions', () => {
      const store = useAuthStore()
      expect(store.can('nonexistent')).toBe(false)
    })

    it('stores permissions in localStorage', () => {
      const saved = JSON.parse(localStorage.getItem('user'))
      expect(saved.permissions.can_create_sales).toBe(true)
      expect(saved.permissions.can_edit_customers).toBe(false)
    })
  })
})
