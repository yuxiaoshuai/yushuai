const TOKEN_KEY = 'yushuai_token'
const ME_KEY = 'yushuai_me'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  if (!token) return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getMe() {
  const raw = localStorage.getItem(ME_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setMe(me) {
  if (!me) return
  localStorage.setItem(ME_KEY, JSON.stringify(me))
}

export function clearMe() {
  localStorage.removeItem(ME_KEY)
}

export function logoutLocal() {
  clearToken()
  clearMe()
}
