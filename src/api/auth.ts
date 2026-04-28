export interface Result<T> {
  code: number
  message: string
  data: T
  errorType?: string
}

export class ApiError extends Error {
  code: number
  errorType?: string

  constructor(message: string, code: number, errorType?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.errorType = errorType
  }
}

export interface UserSimple {
  id: string
  email: string
  username: string
  gender: number
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
  name: string
  description: string
}

export interface CreateTeamResponse {
  teamId: string
}

export interface TeamDetail {
  teamId: string
  teamName: string
  description: string
  inviteCode: string
  createTime: string
  currentUserCaptain: boolean
}

export interface SubmitJoinRequestRequest {
  inviteCode: string
  description?: string
}

export interface TeamMemberBrief {
  userId: string
  username: string
  roleCode: number
  roleName: string
}

export interface TeamMemberManageItem {
  userId: string
  username: string
  roleCode: number
  roleName: string
  roleDesc: string
  avatar: number
  joinTime: string
}

export interface TeamPendingJoinRequestItem {
  requestId: string
  userId: string
  username: string
  avatar: number
  description?: string
  createTime: string
}

export interface TeamMembersManageResponse {
  currentUserCaptain: boolean
  currentUserRoleName: string
  currentUserRoleDesc: string
  pendingRequests: TeamPendingJoinRequestItem[]
  members: TeamMemberManageItem[]
}

export interface TeamTaskItem {
  taskId: string
  description: string
  status: number
  deadline: string
  completionNote?: string
  assignees: {
    userId: string
    username: string
  }[]
}

export interface TeamTaskListItem {
  taskListId: string
  title: string
  description?: string
  creatorId: string
  creatorName: string
  deadline: string
  tasks: TeamTaskItem[]
}

export interface TeamTaskListResponse {
  currentUserCanCreate: boolean
  taskLists: TeamTaskListItem[]
}

export interface MyTeam {
  teamId: string
  teamName: string
  description: string
  createTime: string
  memberCount: number
  userRoleCode: number
  userRoleName: string
  members: TeamMemberBrief[]
}

export interface MyTeamListResponse {
  teams: MyTeam[]
}

export interface TeamMessageItem {
  messageId: string
  title: string
  content: string
  teamName: string
  type: number
  relatedUrl?: string
  messageTime: string
  isProcessed: number
}

export interface TeamMessageListResponse {
  allMessages: TeamMessageItem[]
  pendingMessages: TeamMessageItem[]
}

const API_BASE = 'http://localhost:8080'

async function request<T>(path: string, body?: object, needAuth = false): Promise<Result<T>> {
  const token = needAuth ? sessionStorage.getItem('teamup_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = (await response.json()) as Result<T>
  if (!response.ok || result.code !== 200) {
    throw new ApiError(result.message || '请求失败', result.code ?? response.status, result.errorType)
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
  const result = await request<CreateTeamResponse>('/team/create', data, true)
  return result.data
}

export async function fetchTeamDetail(teamId: string): Promise<TeamDetail> {
  const result = await request<TeamDetail>('/team/detail', { teamId }, true)
  return result.data
}

export async function updateTeamInfo(teamId: string, name: string, description: string): Promise<void> {
  await request<null>('/team/update', { teamId, name, description }, true)
}

export async function submitJoinRequest(data: SubmitJoinRequestRequest): Promise<void> {
  await request<null>('/team-join-request/submit', data, true)
}

export async function fetchMyTeams(): Promise<MyTeamListResponse> {
  const result = await request<MyTeamListResponse>('/team-member/my-teams', {}, true)
  return result.data
}

export async function fetchCurrentUser(): Promise<UserSimple> {
  const result = await request<UserSimple>('/user/me', {}, true)
  return result.data
}

export async function fetchMyMessages(): Promise<TeamMessageListResponse> {
  const result = await request<TeamMessageListResponse>('/team-message/my-list', {}, true)
  return result.data
}

export async function processMessage(messageId: string): Promise<void> {
  await request<null>('/team-message/process', { messageId }, true)
}

export async function fetchTeamMembersManage(teamId: string): Promise<TeamMembersManageResponse> {
  const result = await request<TeamMembersManageResponse>('/team-member/team-manage-list', { teamId }, true)
  return result.data
}

export async function approveTeamJoinRequest(requestId: string): Promise<void> {
  await request<null>('/team-join-request/approve', { requestId }, true)
}

export async function rejectTeamJoinRequest(requestId: string): Promise<void> {
  await request<null>('/team-join-request/reject', { requestId }, true)
}

export async function updateTeamMemberRole(teamId: string, memberUserId: string, roleCode: number): Promise<void> {
  await request<null>('/team-member/update-role', { teamId, memberUserId, roleCode }, true)
}

export async function removeTeamMember(teamId: string, memberUserId: string): Promise<void> {
  await request<null>('/team-member/remove', { teamId, memberUserId }, true)
}

export async function updateSelfRoleDesc(teamId: string, roleDesc: string): Promise<void> {
  await request<null>('/team-member/update-self-role-desc', { teamId, roleDesc }, true)
}

export async function fetchTeamTaskLists(teamId: string): Promise<TeamTaskListResponse> {
  const result = await request<TeamTaskListResponse>('/task-list/team-list', { teamId }, true)
  return result.data
}

export async function createTeamTaskList(teamId: string, title: string, description: string, deadline: string): Promise<void> {
  await request<null>('/task-list/create', { teamId, title, description, deadline }, true)
}

export async function updateTeamTaskList(taskListId: string, title: string, description: string, deadline: string): Promise<void> {
  await request<null>('/task-list/update', { taskListId, title, description, deadline }, true)
}

export async function deleteTeamTaskList(taskListId: string): Promise<void> {
  await request<null>('/task-list/delete', { taskListId }, true)
}

export async function createTask(taskListId: string, description: string, deadline: string): Promise<void> {
  await request<null>('/task/create', { taskListId, description, deadline }, true)
}

export async function completeTask(taskId: string, completionNote: string): Promise<void> {
  await request<null>('/task/complete', { taskId, completionNote }, true)
}

export async function claimTask(taskId: string): Promise<void> {
  await request<null>('/task-assignment/claim', { taskId }, true)
}

export async function assignTask(taskId: string, assigneeUserId: string): Promise<void> {
  await request<null>('/task-assignment/assign', { taskId, assigneeUserId }, true)
}

export async function removeTaskAssignee(taskId: string, assigneeUserId: string): Promise<void> {
  await request<null>('/task-assignment/remove-assignee', { taskId, assigneeUserId }, true)
}
