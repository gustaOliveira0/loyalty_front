import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import api from './index.js'

// Reach into the registered interceptor handlers and exercise them directly.
const requestFulfilled = () => api.interceptors.request.handlers[0].fulfilled
const responseRejected = () => api.interceptors.response.handlers[0].rejected

describe('api request interceptor', () => {
  it('attaches the Bearer token when one is stored', () => {
    localStorage.setItem('token', 'abc123')
    const config = requestFulfilled()({ headers: {} })
    expect(config.headers.Authorization).toBe('Bearer abc123')
  })

  it('leaves the request untouched when there is no token', () => {
    const config = requestFulfilled()({ headers: {} })
    expect(config.headers.Authorization).toBeUndefined()
  })
})

describe('api response interceptor', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { href: '' })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clears the session and redirects to /login on 401', async () => {
    localStorage.setItem('token', 'abc123')
    localStorage.setItem('user', '{"id":1}')
    const error = { response: { status: 401 } }

    await expect(responseRejected()(error)).rejects.toBe(error)

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('re-rejects other errors without clearing the session', async () => {
    localStorage.setItem('token', 'abc123')
    const error = { response: { status: 500 } }

    await expect(responseRejected()(error)).rejects.toBe(error)

    expect(localStorage.getItem('token')).toBe('abc123')
    expect(window.location.href).toBe('')
  })
})
