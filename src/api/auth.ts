export interface Result<T> {
  code: number
  message: string
  data: T
}

export interface UserSimple {
  id: string
  email: string
  username: string
  gender: number
  avatar: number
}

export interface StoredLoginUser {
  id: string
  name: string
  email: string
  avatar: number
}

export interface LoginResponse {
  token: string
  user: UserSimple
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  confirmPassword: string
  gender: number
  avatar: number
}

export interface CreateTeamRequest {
  userId: string
  name: string
  description: string
}

export interface CreateTeamResponse {
  teamId: string
}

const API_BASE = 'http://localhost:8080'

async function request<T>(path: string, body: object): Promise<Result<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const result = (await response.json()) as Result<T>
  if (!response.ok || result.code !== 200) {
    throw new Error(result.message || '请求失败')
  }
  return result
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const result = await request<LoginResponse>('/user/login', data)
  return result.data
}

export async function register(data: RegisterRequest): Promise<void> {
  await request<null>('/user/register', data)
}

export async function createTeam(data: CreateTeamRequest): Promise<CreateTeamResponse> {
  const result = await request<CreateTeamResponse>('/team/create', data)
  return result.data
}
