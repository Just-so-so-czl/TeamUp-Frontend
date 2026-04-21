import type { StoredLoginUser } from '@/api/auth'

const USER_STORAGE_KEY = 'teamup_user'
const TOKEN_STORAGE_KEY = 'teamup_token'

interface LegacyStoredUser {
  id?: number | string
  name?: string
  username?: string
  email?: string
  avatar?: number
}

export function getStoredLoginUser(): StoredLoginUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY)
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
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}
