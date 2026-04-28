const USER_STORAGE_KEY = 'teamup_user'
const TOKEN_STORAGE_KEY = 'teamup_token'

export interface StoredLoginUser {
  id: string
  name: string
  email: string
  avatar: number
}

interface LegacyStoredUser {
  id?: number | string
  name?: string
  username?: string
  email?: string
  avatar?: number
}

export function getStoredLoginUser(): StoredLoginUser | null {
  const raw = sessionStorage.getItem(USER_STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as LegacyStoredUser
    const name = parsed.name?.trim() || parsed.username?.trim()
    if (!name || !parsed.email) {
      return null
    }
    const idText = String(parsed.id ?? '').trim()
    if (!idText) {
      return null
    }
    return {
      id: idText,
      name,
      email: parsed.email,
      avatar: Number(parsed.avatar ?? 1),
    }
  } catch {
    return null
  }
}

export function saveStoredLoginUser(user: StoredLoginUser): void {
  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY)
}

export function saveStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearAuthStorage(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(USER_STORAGE_KEY)
}
