import { getToken, logoutLocal } from './auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const SUCCESS_CODES = new Set([0, 200, '0', '200'])

function buildUrl(path) {
  if (path.startsWith('http')) return path
  if (!API_BASE) return path

  return `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function appendQuery(url, query) {
  if (!query || typeof query !== 'object') return

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })
}

function getErrorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) return data

  if (data && typeof data === 'object') {
    const message = data.message || data.msg || data.error
    if (typeof message === 'string' && message.trim()) return message
  }

  return `HTTP ${status}`
}

function unwrapSuccess(data) {
  if (!data || typeof data !== 'object' || !('code' in data)) {
    return data
  }

  if (SUCCESS_CODES.has(data.code)) {
    return 'data' in data ? data.data : data
  }

  throw new Error(getErrorMessage(data, data.code || 500))
}

function redirectToLogin() {
  if (window.location.pathname === '/login') return
  window.location.href = '/login'
}

async function request(method, path, { query, body, headers } = {}) {
  const url = new URL(buildUrl(path), window.location.origin)
  appendQuery(url, query)

  const normalizedMethod = method.toUpperCase()
  // const token = getToken()
  const fetchOptions = {
    method: normalizedMethod,
    headers: {
      'Content-Type': 'application/json',
      // ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  }

  if (body !== undefined && !['GET', 'HEAD'].includes(normalizedMethod)) {
    fetchOptions.body = JSON.stringify(body)
  }

  const res = await fetch(url.toString(), fetchOptions)
  const text = await res.text()
  let data

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (res.status === 401) {
    logoutLocal()
    redirectToLogin()
    throw new Error(getErrorMessage(data, 401))
  }

  if (!res.ok) {
    throw new Error(getErrorMessage(data, res.status))
  }

  return unwrapSuccess(data)
}

export const http = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, opts) => request('POST', path, opts),
  put: (path, opts) => request('PUT', path, opts),
  del: (path, opts) => request('DELETE', path, opts),
}
