const TOKEN_KEY = 'tc_auth_token'
const TOKEN_EXPIRY_KEY = 'tc_auth_token_expiry'

// 30 days in milliseconds (30 * 24 * 60 * 60 * 1000)
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

let unauthorizedListener: (() => void) | null = null

export function onUnauthorized(listener: () => void) {
  unauthorizedListener = listener
}

export function getAuthToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null

    const expiryRaw = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (expiryRaw) {
      const expiry = parseInt(expiryRaw, 10)
      if (!isNaN(expiry) && Date.now() > expiry) {
        // Token has passed 30 days expiration window
        clearAuthToken()
        return null
      }
    } else {
      // Migrate existing token to 30-day expiration
      const expiresAt = Date.now() + THIRTY_DAYS_MS
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString())
    }

    return token
  } catch {
    return null
  }
}

export function setAuthToken(token: string) {
  try {
    const expiresAt = Date.now() + THIRTY_DAYS_MS
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString())
  } catch (e) {
    console.error('Failed to save auth token with 30-day expiry', e)
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
  } catch (e) {
    console.error('Failed to clear auth token', e)
  }
}

export function getAuthTokenExpiry(): number | null {
  try {
    const raw = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!raw) return null
    const val = parseInt(raw, 10)
    return isNaN(val) ? null : val
  } catch {
    return null
  }
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function reportUnauthorized() {
  clearAuthToken()
  unauthorizedListener?.()
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  if (!res.ok) return false
  const data = (await res.json()) as { token: string }
  setAuthToken(data.token)
  return true
}
