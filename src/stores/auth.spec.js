import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.js'
import api from '../api/index.js'

// The store talks to the backend through the api module; we stub it.
vi.mock('../api/index.js', () => ({
  default: { post: vi.fn() },
}))

const fakeAuthResponse = {
  data: { token: 'jwt-token-123', user: { id: 1, name: 'Loja', email: 'loja@x.com' } },
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

      expect(api.post).toHaveBeenCalledWith('api/v1/auth/login', {
        email: 'loja@x.com',
        password: 'secret',
      })
      expect(store.token).toBe('jwt-token-123')
      expect(store.user).toEqual({ id: 1, name: 'Loja', email: 'loja@x.com' })
      expect(store.isLoggedIn).toBe(true)
      expect(localStorage.getItem('token')).toBe('jwt-token-123')
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(fakeAuthResponse.data.user)
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

      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/register', {
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
})
