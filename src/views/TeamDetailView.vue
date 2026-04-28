<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import avatar1 from '@/assets/avatar/a1.png'
import avatar2 from '@/assets/avatar/a2.png'
import avatar3 from '@/assets/avatar/a3.png'
import avatar4 from '@/assets/avatar/a4.png'
import avatar5 from '@/assets/avatar/a5.png'
import avatar6 from '@/assets/avatar/a6.png'
import avatar7 from '@/assets/avatar/a7.png'
import avatar8 from '@/assets/avatar/a8.png'
import {
  approveTeamJoinRequest,
  assignTask,
  claimTask,
  completeTask,
  createTask,
  createTeamTaskList,
  deleteTeamTaskList,
  fetchTeamDetail,
  fetchTeamMembersManage,
  fetchTeamTaskLists,
  rejectTeamJoinRequest,
  removeTaskAssignee,
  removeTeamMember,
  updateTeamInfo,
  updateSelfRoleDesc,
  updateTeamTaskList,
  updateTeamMemberRole,
  type TeamMemberManageItem,
  type TeamTaskListItem,
  type TeamPendingJoinRequestItem,
} from '@/api/auth'
import { getStoredLoginUser } from '@/utils/authUser'

type TabKey = 'tasks' | 'members' | 'collabDocs' | 'resourceDocs' | 'mentor'

interface MemberDisplayItem {
  id: string
  username: string
  roleName: string
  roleDesc: string
  roleCode?: number
  avatar: number
  joinTime?: string
  isPending: boolean
  requestId?: string
}

const avatarMap: Record<number, string> = {
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
}

const roleOptions = [
  { code: 2, label: 'Leader' },
  { code: 3, label: 'Member' },
] as const

const route = useRoute()
const router = useRouter()
const activeTab = ref<TabKey>('tasks')
const teamId = computed(() => String(route.params.id || ''))
const loading = ref(false)
const taskLoading = ref(false)
const taskError = ref('')
const membersLoading = ref(false)
const errorMessage = ref('')
const membersError = ref('')
const inviteCardVisible = ref(false)
const copyTip = ref('')
const copyTipType = ref<'success' | 'error'>('success')
const processingRequestId = ref('')
const currentUserCaptain = ref(false)
const memberActionOpenUserId = ref('')
const memberActionLoadingUserId = ref('')
const removeConfirmVisible = ref(false)
const pendingRemoveMember = ref<MemberDisplayItem | null>(null)
const editTeamVisible = ref(false)
const editTeamLoading = ref(false)
const editTeamError = ref('')
const editForm = ref({
  name: '',
  description: '',
})
const selfRoleName = ref('')
const selfRoleDesc = ref('')
const selfRoleDescEdit = ref('')
const selfRoleSaving = ref(false)
const selfRoleError = ref('')
const selfRoleEditVisible = ref(false)
const taskLists = ref<TeamTaskListItem[]>([])
const expandedTaskListId = ref('')
const canCreateTaskList = ref(false)
const taskCreateVisible = ref(false)
const taskCreateLoading = ref(false)
const taskCreateError = ref('')
const taskCreateForm = ref({
  title: '',
  description: '',
  deadline: '',
})
const taskItemCreateVisible = ref(false)
const taskItemCreateLoading = ref(false)
const taskItemCreateError = ref('')
const taskAssignVisible = ref(false)
const taskAssignLoading = ref(false)
const taskAssignError = ref('')
const taskAssignForm = ref({
  taskId: '',
  taskDesc: '',
  assigneeUserId: '',
})
const taskAssignAssignees = ref<{ userId: string; username: string }[]>([])
const taskActionLoadingKey = ref('')
const taskCompleteVisible = ref(false)
const taskCompleteLoading = ref(false)
const taskCompleteError = ref('')
const taskCompleteForm = ref({
  taskId: '',
  taskDesc: '',
  completionNote: '',
})
const myTodoVisible = ref(false)
const taskItemCreateForm = ref({
  taskListId: '',
  taskListTitle: '',
  taskListDeadline: '',
  description: '',
  deadline: '',
})
const taskListEditVisible = ref(false)
const taskListEditLoading = ref(false)
const taskListEditError = ref('')
const taskListEditForm = ref({
  taskListId: '',
  title: '',
  description: '',
  deadline: '',
})
const taskListDeleteVisible = ref(false)
const taskListDeleteLoading = ref(false)
const pendingDeleteTaskList = ref<{ taskListId: string; title: string } | null>(null)

const teamInfo = ref({
  name: '我的学习小组',
  description: '在这里查看小组任务、成员协作情况和学习资料。',
  inviteCode: '--',
})

const members = ref<TeamMemberManageItem[]>([])
const pendingRequests = ref<TeamPendingJoinRequestItem[]>([])

const tabs = [
  { key: 'tasks', label: '任务列表' },
  { key: 'members', label: '小组成员' },
  { key: 'collabDocs', label: '协作文档' },
  { key: 'resourceDocs', label: '资料文档' },
  { key: 'mentor', label: '智能导师' },
] as const
const currentUser = computed(() => getStoredLoginUser())
const canManageTaskAssignee = computed(() => selfRoleName.value === 'Captain' || selfRoleName.value === 'Leader')
const assignableMembers = computed(() => members.value || [])
const hasCurrentUserClaimed = (taskItem: TeamTaskListItem['tasks'][number]) => {
  const currentUserId = currentUser.value?.id
  if (!currentUserId || !taskItem.assignees) {
    return false
  }
  return taskItem.assignees.some((item) => item.userId === currentUserId)
}
const isCurrentUserResponsible = (taskItem: TeamTaskListItem['tasks'][number]) => hasCurrentUserClaimed(taskItem)
const myTodoTasks = computed(() => {
  const result: Array<{
    taskId: string
    description: string
    teamTaskListTitle: string
    deadline: string
  }> = []
  for (const listItem of taskLists.value) {
    for (const taskItem of listItem.tasks || []) {
      if (taskItem.status !== 1 && hasCurrentUserClaimed(taskItem)) {
        result.push({
          taskId: taskItem.taskId,
          description: taskItem.description,
          teamTaskListTitle: listItem.title,
          deadline: taskItem.deadline,
        })
      }
    }
  }
  return result
})
const getTaskListProgress = (taskListItem: TeamTaskListItem) => {
  const tasks = taskListItem.tasks || []
  const total = tasks.length
  const completed = tasks.filter((item) => item.status === 1).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return {
    total,
    completed,
    percent,
  }
}
const taskListProgressMap = computed(() => {
  const map: Record<string, { total: number; completed: number; percent: number }> = {}
  for (const taskListItem of taskLists.value) {
    map[taskListItem.taskListId] = getTaskListProgress(taskListItem)
  }
  return map
})

const memberDisplayList = computed<MemberDisplayItem[]>(() => {
  const pending = pendingRequests.value.map((item) => ({
    id: item.userId,
    username: item.username,
    roleName: '待审批',
    roleDesc: item.description?.trim() || '新的入组申请，等待组长审批',
    avatar: item.avatar,
    isPending: true,
    requestId: item.requestId,
  }))
  const existed = members.value.map((item) => ({
    id: item.userId,
    username: item.username,
    roleName: item.roleName,
    roleDesc: item.roleDesc,
    roleCode: item.roleCode,
    avatar: item.avatar,
    joinTime: item.joinTime,
    isPending: false,
  }))
  return [...pending, ...existed]
})

const memberAvatarSrc = (avatar?: number) => avatarMap[avatar ?? 1] ?? avatar1

const formatTime = (value: string) => {
  if (!value) {
    return '--'
  }
  return value.replace('T', ' ').slice(0, 16)
}

const loadTeamDetail = async () => {
  if (!teamId.value) {
    errorMessage.value = '无效的小组ID'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const detail = await fetchTeamDetail(teamId.value)
    teamInfo.value = {
      name: detail.teamName,
      description: detail.description || '这个小组还没有填写描述。',
      inviteCode: detail.inviteCode || '--',
    }
    currentUserCaptain.value = !!detail.currentUserCaptain
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载小组详情失败'
  } finally {
    loading.value = false
  }
}

const openEditTeamModal = () => {
  editForm.value = {
    name: teamInfo.value.name,
    description: teamInfo.value.description || '',
  }
  editTeamError.value = ''
  editTeamVisible.value = true
}

const closeEditTeamModal = () => {
  if (editTeamLoading.value) {
    return
  }
  editTeamVisible.value = false
}

const submitEditTeam = async () => {
  if (!teamId.value) {
    return
  }
  const name = editForm.value.name.trim()
  const description = editForm.value.description.trim()
  if (name.length < 2 || name.length > 50) {
    editTeamError.value = '小组名称长度需在2到50个字符之间'
    return
  }
  if (description.length > 300) {
    editTeamError.value = '小组描述最多300个字符'
    return
  }
  editTeamLoading.value = true
  editTeamError.value = ''
  try {
    await updateTeamInfo(teamId.value, name, description)
    editTeamVisible.value = false
    await loadTeamDetail()
  } catch (error) {
    editTeamError.value = error instanceof Error ? error.message : '更新小组信息失败'
  } finally {
    editTeamLoading.value = false
  }
}

const loadMembersManage = async () => {
  if (!teamId.value) {
    return
  }
  membersLoading.value = true
  membersError.value = ''
  try {
    const res = await fetchTeamMembersManage(teamId.value)
    members.value = res.members || []
    pendingRequests.value = res.pendingRequests || []
    currentUserCaptain.value = !!res.currentUserCaptain
    selfRoleName.value = res.currentUserRoleName || ''
    selfRoleDesc.value = res.currentUserRoleDesc || ''
    selfRoleDescEdit.value = res.currentUserRoleDesc || ''
  } catch (error) {
    membersError.value = error instanceof Error ? error.message : '加载成员列表失败'
  } finally {
    membersLoading.value = false
  }
}

const loadTaskLists = async () => {
  if (!teamId.value) {
    return
  }
  taskLoading.value = true
  taskError.value = ''
  try {
    const res = await fetchTeamTaskLists(teamId.value)
    taskLists.value = res.taskLists || []
    canCreateTaskList.value = !!res.currentUserCanCreate
    if (expandedTaskListId.value && !taskLists.value.some((item) => item.taskListId === expandedTaskListId.value)) {
      expandedTaskListId.value = ''
    }
  } catch (error) {
    taskError.value = error instanceof Error ? error.message : '加载任务清单失败'
  } finally {
    taskLoading.value = false
  }
}

const handleTabClick = async (tabKey: TabKey) => {
  activeTab.value = tabKey
  if (tabKey === 'tasks') {
    await loadTaskLists()
  }
}

const toggleTaskList = (taskListId: string) => {
  expandedTaskListId.value = expandedTaskListId.value === taskListId ? '' : taskListId
}

const openTaskCreateModal = () => {
  taskCreateForm.value = {
    title: '',
    description: '',
    deadline: '',
  }
  taskCreateError.value = ''
  taskCreateVisible.value = true
}

const closeTaskCreateModal = () => {
  if (taskCreateLoading.value) {
    return
  }
  taskCreateVisible.value = false
}

const openTaskItemCreateModal = (taskListItem: TeamTaskListItem) => {
  taskItemCreateForm.value = {
    taskListId: taskListItem.taskListId,
    taskListTitle: taskListItem.title,
    taskListDeadline: taskListItem.deadline,
    description: '',
    deadline: '',
  }
  taskItemCreateError.value = ''
  taskItemCreateVisible.value = true
}

const openTaskListEditModal = (taskListItem: TeamTaskListItem) => {
  const rawDeadline = taskListItem.deadline || ''
  const normalizedDeadline = rawDeadline.includes('T') ? rawDeadline.slice(0, 16) : rawDeadline.replace(' ', 'T').slice(0, 16)
  taskListEditForm.value = {
    taskListId: taskListItem.taskListId,
    title: taskListItem.title || '',
    description: taskListItem.description || '',
    deadline: normalizedDeadline,
  }
  taskListEditError.value = ''
  taskListEditVisible.value = true
}

const closeTaskListEditModal = () => {
  if (taskListEditLoading.value) {
    return
  }
  taskListEditVisible.value = false
}

const submitTaskListEdit = async () => {
  const taskListId = taskListEditForm.value.taskListId
  if (!taskListId) {
    return
  }
  const title = taskListEditForm.value.title.trim()
  const description = taskListEditForm.value.description.trim()
  const deadline = taskListEditForm.value.deadline.trim()
  if (title.length < 2 || title.length > 150) {
    taskListEditError.value = '清单标题长度需在2到150个字符之间'
    return
  }
  if (description.length > 1000) {
    taskListEditError.value = '清单描述最多1000个字符'
    return
  }
  if (!deadline) {
    taskListEditError.value = '请选择截止时间'
    return
  }
  taskListEditLoading.value = true
  taskListEditError.value = ''
  try {
    const submitDeadline = deadline.length === 16 ? `${deadline}:00` : deadline
    await updateTeamTaskList(taskListId, title, description, submitDeadline)
    taskListEditVisible.value = false
    await loadTaskLists()
  } catch (error) {
    taskListEditError.value = error instanceof Error ? error.message : '修改任务清单失败'
  } finally {
    taskListEditLoading.value = false
  }
}

const openTaskListDeleteModal = (taskListItem: TeamTaskListItem) => {
  pendingDeleteTaskList.value = {
    taskListId: taskListItem.taskListId,
    title: taskListItem.title,
  }
  taskListDeleteVisible.value = true
}

const closeTaskListDeleteModal = () => {
  if (taskListDeleteLoading.value) {
    return
  }
  taskListDeleteVisible.value = false
  pendingDeleteTaskList.value = null
}

const confirmTaskListDelete = async () => {
  const target = pendingDeleteTaskList.value
  if (!target?.taskListId) {
    closeTaskListDeleteModal()
    return
  }
  taskListDeleteLoading.value = true
  try {
    await deleteTeamTaskList(target.taskListId)
    if (expandedTaskListId.value === target.taskListId) {
      expandedTaskListId.value = ''
    }
    taskListDeleteVisible.value = false
    pendingDeleteTaskList.value = null
    await loadTaskLists()
  } catch (error) {
    taskError.value = error instanceof Error ? error.message : '删除任务清单失败'
  } finally {
    taskListDeleteLoading.value = false
  }
}

const closeTaskItemCreateModal = () => {
  if (taskItemCreateLoading.value) {
    return
  }
  taskItemCreateVisible.value = false
}

const submitTaskCreate = async () => {
  if (!teamId.value) {
    return
  }
  const title = taskCreateForm.value.title.trim()
  const description = taskCreateForm.value.description.trim()
  const deadline = taskCreateForm.value.deadline.trim()
  if (title.length < 2 || title.length > 150) {
    taskCreateError.value = '清单标题长度需在2到150个字符之间'
    return
  }
  if (description.length > 1000) {
    taskCreateError.value = '清单描述最多1000个字符'
    return
  }
  if (!deadline) {
    taskCreateError.value = '请选择截止时间'
    return
  }
  taskCreateLoading.value = true
  taskCreateError.value = ''
  try {
    const submitDeadline = deadline.length === 16 ? `${deadline}:00` : deadline
    await createTeamTaskList(teamId.value, title, description, submitDeadline)
    taskCreateVisible.value = false
    await loadTaskLists()
  } catch (error) {
    taskCreateError.value = error instanceof Error ? error.message : '创建任务清单失败'
  } finally {
    taskCreateLoading.value = false
  }
}

const submitTaskItemCreate = async () => {
  const taskListId = taskItemCreateForm.value.taskListId
  if (!taskListId) {
    return
  }
  const description = taskItemCreateForm.value.description.trim()
  const deadline = taskItemCreateForm.value.deadline.trim()
  const taskListDeadline = taskItemCreateForm.value.taskListDeadline
  if (!description) {
    taskItemCreateError.value = '任务描述不能为空'
    return
  }
  if (description.length > 500) {
    taskItemCreateError.value = '任务描述最多500个字符'
    return
  }
  if (!deadline) {
    taskItemCreateError.value = '请选择任务截止时间'
    return
  }
  const deadlineValue = new Date(deadline.length === 16 ? `${deadline}:00` : deadline).getTime()
  const listDeadlineValue = new Date(taskListDeadline).getTime()
  if (!Number.isNaN(deadlineValue) && !Number.isNaN(listDeadlineValue) && deadlineValue > listDeadlineValue) {
    taskItemCreateError.value = '任务截止时间不能晚于任务清单截止时间'
    return
  }
  taskItemCreateLoading.value = true
  taskItemCreateError.value = ''
  try {
    const submitDeadline = deadline.length === 16 ? `${deadline}:00` : deadline
    await createTask(taskListId, description, submitDeadline)
    taskItemCreateVisible.value = false
    await loadTaskLists()
  } catch (error) {
    taskItemCreateError.value = error instanceof Error ? error.message : '创建任务失败'
  } finally {
    taskItemCreateLoading.value = false
  }
}

const openTaskAssignModal = (
  taskId: string,
  taskDesc: string,
  assignees: { userId: string; username: string }[],
) => {
  taskAssignForm.value = {
    taskId,
    taskDesc,
    assigneeUserId: '',
  }
  taskAssignAssignees.value = [...(assignees || [])]
  taskAssignError.value = ''
  taskAssignVisible.value = true
}

const closeTaskAssignModal = () => {
  if (taskAssignLoading.value) {
    return
  }
  taskAssignVisible.value = false
}

const syncTaskAssignAssignees = () => {
  const taskId = taskAssignForm.value.taskId
  if (!taskId) {
    taskAssignAssignees.value = []
    return
  }
  for (const taskListItem of taskLists.value) {
    const targetTask = (taskListItem.tasks || []).find((item) => item.taskId === taskId)
    if (targetTask) {
      taskAssignAssignees.value = [...(targetTask.assignees || [])]
      return
    }
  }
  taskAssignAssignees.value = []
}

const handleAddTaskAssignee = async () => {
  const taskId = taskAssignForm.value.taskId
  const assigneeUserId = taskAssignForm.value.assigneeUserId
  if (!taskId || !assigneeUserId) {
    taskAssignError.value = '请选择要新增的成员'
    return
  }
  taskAssignLoading.value = true
  taskAssignError.value = ''
  try {
    await assignTask(taskId, assigneeUserId)
    taskAssignForm.value.assigneeUserId = ''
    await loadTaskLists()
    syncTaskAssignAssignees()
  } catch (error) {
    taskAssignError.value = error instanceof Error ? error.message : '新增负责人失败'
  } finally {
    taskAssignLoading.value = false
  }
}

const handleRemoveTaskAssigneeInModal = async (assigneeUserId: string) => {
  const taskId = taskAssignForm.value.taskId
  if (!taskId || !assigneeUserId) {
    return
  }
  taskAssignLoading.value = true
  taskAssignError.value = ''
  try {
    await removeTaskAssignee(taskId, assigneeUserId)
    await loadTaskLists()
    syncTaskAssignAssignees()
  } catch (error) {
    taskAssignError.value = error instanceof Error ? error.message : '移除负责人失败'
  } finally {
    taskAssignLoading.value = false
  }
}

const handleClaimTask = async (taskId: string) => {
  if (!taskId) {
    return
  }
  taskActionLoadingKey.value = `claim-${taskId}`
  try {
    await claimTask(taskId)
    await loadTaskLists()
  } catch (error) {
    taskError.value = error instanceof Error ? error.message : '任务认领失败'
  } finally {
    taskActionLoadingKey.value = ''
  }
}

const handleTaskCheckClick = (taskItem: TeamTaskListItem['tasks'][number]) => {
  if (!isCurrentUserResponsible(taskItem)) {
    return
  }
  if (taskItem.status === 1) {
    return
  }
  openTaskCompleteModal(taskItem.taskId, taskItem.description)
}

const openTaskCompleteModal = (taskId: string, taskDesc: string) => {
  taskCompleteForm.value = {
    taskId,
    taskDesc,
    completionNote: '',
  }
  taskCompleteError.value = ''
  taskCompleteVisible.value = true
}

const closeTaskCompleteModal = () => {
  if (taskCompleteLoading.value) {
    return
  }
  taskCompleteVisible.value = false
}

const submitTaskComplete = async () => {
  const taskId = taskCompleteForm.value.taskId
  if (!taskId) {
    return
  }
  const completionNote = taskCompleteForm.value.completionNote.trim()
  if (completionNote.length > 100) {
    taskCompleteError.value = '完成备注最多100个字符'
    return
  }
  taskCompleteLoading.value = true
  taskCompleteError.value = ''
  try {
    await completeTask(taskId, completionNote)
    taskCompleteVisible.value = false
    await loadTaskLists()
  } catch (error) {
    taskCompleteError.value = error instanceof Error ? error.message : '完成任务失败'
  } finally {
    taskCompleteLoading.value = false
  }
}

const openMyTodoModal = async () => {
  await loadTaskLists()
  myTodoVisible.value = true
}

const closeMyTodoModal = () => {
  myTodoVisible.value = false
}

const submitSelfRoleDesc = async () => {
  if (!teamId.value) {
    return
  }
  const desc = selfRoleDescEdit.value.trim()
  if (desc.length > 80) {
    selfRoleError.value = '角色描述最多80个字符'
    return
  }
  selfRoleSaving.value = true
  selfRoleError.value = ''
  try {
    await updateSelfRoleDesc(teamId.value, desc)
    selfRoleDesc.value = desc
    selfRoleEditVisible.value = false
  } catch (error) {
    selfRoleError.value = error instanceof Error ? error.message : '更新角色描述失败'
  } finally {
    selfRoleSaving.value = false
  }
}

const startEditSelfRoleDesc = () => {
  selfRoleDescEdit.value = selfRoleDesc.value || ''
  selfRoleError.value = ''
  selfRoleEditVisible.value = true
}

const cancelEditSelfRoleDesc = () => {
  selfRoleDescEdit.value = selfRoleDesc.value || ''
  selfRoleError.value = ''
  selfRoleEditVisible.value = false
}

const copyInviteCode = async () => {
  if (!teamInfo.value.inviteCode || teamInfo.value.inviteCode === '--') {
    copyTipType.value = 'error'
    copyTip.value = '暂无可复制的邀请码'
    return
  }
  try {
    await navigator.clipboard.writeText(teamInfo.value.inviteCode)
    copyTipType.value = 'success'
    copyTip.value = '邀请码已复制'
  } catch {
    copyTipType.value = 'error'
    copyTip.value = '复制失败，请手动复制'
  }
  window.setTimeout(() => {
    copyTip.value = ''
  }, 1800)
}

const toggleInviteCard = () => {
  inviteCardVisible.value = !inviteCardVisible.value
}

const closeInviteCard = () => {
  inviteCardVisible.value = false
}

const handleApprove = async (requestId?: string) => {
  if (!requestId || processingRequestId.value) {
    return
  }
  processingRequestId.value = requestId
  try {
    await approveTeamJoinRequest(requestId)
    await loadMembersManage()
  } catch (error) {
    membersError.value = error instanceof Error ? error.message : '同意申请失败'
  } finally {
    processingRequestId.value = ''
  }
}

const handleReject = async (requestId?: string) => {
  if (!requestId || processingRequestId.value) {
    return
  }
  processingRequestId.value = requestId
  try {
    await rejectTeamJoinRequest(requestId)
    await loadMembersManage()
  } catch (error) {
    membersError.value = error instanceof Error ? error.message : '拒绝申请失败'
  } finally {
    processingRequestId.value = ''
  }
}

const toggleMemberActionMenu = (memberUserId: string) => {
  memberActionOpenUserId.value = memberActionOpenUserId.value === memberUserId ? '' : memberUserId
}

const closeMemberActionMenu = () => {
  memberActionOpenUserId.value = ''
}

const handleUpdateMemberRole = async (member: MemberDisplayItem, roleCode: number) => {
  if (member.isPending || !teamId.value || !member.id) {
    return
  }
  if (member.roleCode === roleCode) {
    closeMemberActionMenu()
    return
  }
  memberActionLoadingUserId.value = member.id
  try {
    await updateTeamMemberRole(teamId.value, member.id, roleCode)
    closeMemberActionMenu()
    await loadMembersManage()
  } catch (error) {
    membersError.value = error instanceof Error ? error.message : '设置角色失败'
  } finally {
    memberActionLoadingUserId.value = ''
  }
}

const handleRemoveMember = async (member: MemberDisplayItem) => {
  if (member.isPending || !teamId.value || !member.id) {
    return
  }
  pendingRemoveMember.value = member
  removeConfirmVisible.value = true
}

const cancelRemoveMember = () => {
  removeConfirmVisible.value = false
  pendingRemoveMember.value = null
}

const confirmRemoveMember = async () => {
  const member = pendingRemoveMember.value
  if (!member || member.isPending || !teamId.value || !member.id) {
    cancelRemoveMember()
    return
  }
  memberActionLoadingUserId.value = member.id
  try {
    await removeTeamMember(teamId.value, member.id)
    closeMemberActionMenu()
    cancelRemoveMember()
    await loadMembersManage()
  } catch (error) {
    membersError.value = error instanceof Error ? error.message : '移除成员失败'
  } finally {
    memberActionLoadingUserId.value = ''
  }
}

const goBack = async () => {
  await router.push('/dashboard')
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) {
    return
  }
  if (!target.closest('.member-menu-wrap')) {
    closeMemberActionMenu()
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  const tabFromQuery = route.query.tab
  if (typeof tabFromQuery === 'string' && (tabFromQuery === 'members' || tabFromQuery === 'tasks')) {
    activeTab.value = tabFromQuery
  }
  await Promise.all([loadTeamDetail(), loadMembersManage(), loadTaskLists()])
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <main class="team-page">
    <section class="team-hero">
      <div class="hero-actions">
        <button class="back-btn" type="button" @click="goBack">返回我的小组</button>
      </div>

      <div class="hero-main split">
        <div class="hero-meta left">
          <div class="hero-title-row">

            <div class="hero-title-value">{{ teamInfo.name }}</div>
          </div>
          <p class="hero-desc">{{ teamInfo.description }}</p>
          <div class="hero-actions">
            <button class="hero-action-btn invite-trigger-btn" type="button" @click="toggleInviteCard">
              {{ inviteCardVisible ? '收起邀请码' : '邀请码' }}
            </button>
            <button
              v-if="currentUserCaptain"
              class="hero-action-btn edit-team-btn"
              type="button"
              @click="openEditTeamModal"
            >
              编辑小组信息
            </button>
          </div>
        </div>
        <div class="hero-meta right">
          <div class="hero-title-row">

            <div class="hero-title-value">I'm {{ selfRoleName || '--' }}</div>
          </div>
          <p class="hero-desc">
            {{ selfRoleDesc || '还没有填写角色描述，点击修改来补充你的职责吧~' }}
          </p>
          <div class="hero-actions">
            <button class="hero-action-btn self-role-edit-btn" type="button" @click="startEditSelfRoleDesc">
              修改描述
            </button>
          </div>
        </div>
      </div>

      <p v-if="loading" class="status-tip">正在加载小组信息...</p>
      <p v-if="errorMessage" class="status-tip error">{{ errorMessage }}</p>
    </section>

    <section class="team-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="handleTabClick(tab.key)"
      >
        {{ tab.label }}
      </button>
    </section>

    <section v-if="activeTab === 'tasks'" class="content-panel">
      <div class="panel-head">
        <div class="panel-title">任务列表</div>
        <div class="task-header-actions">
          <button class="my-todo-btn" type="button" @click="openMyTodoModal">查看我的待办</button>
          <button
            v-if="canCreateTaskList"
            class="create-task-list-btn"
            type="button"
            @click="openTaskCreateModal"
          >
            创建任务清单
          </button>
        </div>
      </div>
      <p v-if="taskLoading" class="member-tip">正在加载任务清单...</p>
      <p v-else-if="taskError" class="member-tip error">{{ taskError }}</p>
      <p v-else-if="taskLists.length === 0" class="member-tip">当前小组还没有任务清单</p>
      <ul v-else class="task-list">
        <li v-for="taskListItem in taskLists" :key="taskListItem.taskListId" class="task-item">
          <div class="task-list-top">
            <button class="task-list-head" type="button" @click="toggleTaskList(taskListItem.taskListId)">
              <div class="task-list-info">
                <div class="task-title">{{ taskListItem.title }}</div>
                <div class="task-desc-row">
                  <div class="task-desc">{{ taskListItem.description || '暂无清单描述' }}</div>
                  <div class="task-meta">
                    创建者：{{ taskListItem.creatorName }} · DDL：{{ formatTime(taskListItem.deadline) }}
                  </div>
                </div>

              </div>
              <div class="task-list-progress-col">
                <div class="task-progress">
                  <div class="task-progress-text">
                    进度：{{ taskListProgressMap[taskListItem.taskListId]?.completed || 0 }}/{{ taskListProgressMap[taskListItem.taskListId]?.total || 0 }}
                    （{{ taskListProgressMap[taskListItem.taskListId]?.percent || 0 }}%）
                  </div>
                  <div class="task-progress-track">
                    <div
                      class="task-progress-fill"
                      :style="{ width: `${taskListProgressMap[taskListItem.taskListId]?.percent || 0}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <span class="task-list-arrow" :class="{ expanded: expandedTaskListId === taskListItem.taskListId }">⌄</span>
            </button>
            <div v-if="canCreateTaskList" class="task-list-actions">
              <button class="task-add-btn" type="button" @click="openTaskItemCreateModal(taskListItem)" title="新增任务">+</button>
              <button class="task-edit-btn" type="button" @click="openTaskListEditModal(taskListItem)" title="修改清单">
                ✍
              </button>
              <button class="task-delete-btn" type="button" @click="openTaskListDeleteModal(taskListItem)" title="删除清单">
                −
              </button>

            </div>
          </div>
          <div v-if="expandedTaskListId === taskListItem.taskListId" class="task-detail-wrap">
            <p v-if="!taskListItem.tasks || taskListItem.tasks.length === 0" class="task-empty-tip">该清单下暂无任务</p>
            <ul v-else class="task-detail-list">
              <li
                v-for="taskItem in taskListItem.tasks"
                :key="taskItem.taskId"
                class="task-detail-item"
                :class="{ mine: isCurrentUserResponsible(taskItem) }"
              >
                <div class="task-detail-main">
                  <div class="task-detail-desc-col">
                    <button
                      v-if="isCurrentUserResponsible(taskItem)"
                      class="task-complete-check"
                      :class="{ checked: taskItem.status === 1 }"
                      type="button"
                      :disabled="taskItem.status === 1"
                      @click="handleTaskCheckClick(taskItem)"
                    >
                      <span>{{ taskItem.status === 1 ? '✓' : '' }}</span>
                    </button>
                    <span class="task-detail-status" :class="{ done: taskItem.status === 1 }">
                      {{ taskItem.status === 1 ? '已完成' : '待办' }}
                    </span>
                    <span class="task-detail-desc">{{ taskItem.description }}</span>
                  </div>
                  <span class="task-detail-deadline">
                    {{ taskItem.status !== 1 ? `DDL · ${formatTime(taskItem.deadline)}` : `完成于 · ${formatTime(taskItem.deadline)}` }}
                  </span>
                  <div class="task-assignee-line">
                    负责人：
                    <span v-if="!taskItem.assignees || taskItem.assignees.length === 0">未分配</span>
                    <span v-else>{{ taskItem.assignees.map((item) => item.username).join('、') }}</span>
                  </div>
                  <div class="task-item-actions">
                    <button
                      class="task-item-btn claim"
                      type="button"
                      :disabled="taskActionLoadingKey === `claim-${taskItem.taskId}` || hasCurrentUserClaimed(taskItem)"
                      @click="handleClaimTask(taskItem.taskId)"
                    >
                      {{
                        hasCurrentUserClaimed(taskItem)
                          ? '已认领'
                          : (taskActionLoadingKey === `claim-${taskItem.taskId}` ? '认领中...' : '认领任务')
                      }}
                    </button>
                    <button
                      v-if="canManageTaskAssignee"
                      class="task-item-btn assign"
                      type="button"
                      @click="openTaskAssignModal(taskItem.taskId, taskItem.description, taskItem.assignees || [])"
                    >
                      人员分配
                    </button>
                  </div>
                </div>
                <div v-if="taskItem.status === 1" class="task-completion-line">
                  完成备注：{{ taskItem.completionNote || '无' }}
                </div>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </section>

    <section v-else-if="activeTab === 'members'" class="content-panel">
      <div class="panel-title">小组成员</div>
      <p v-if="membersLoading" class="member-tip">正在加载成员列表...</p>
      <p v-else-if="membersError" class="member-tip error">{{ membersError }}</p>
      <p v-else-if="memberDisplayList.length === 0" class="member-tip">当前暂无成员数据</p>

      <ul v-else class="member-list">
        <li
          v-for="member in memberDisplayList"
          :key="`${member.isPending ? 'pending' : 'member'}-${member.id}-${member.requestId || ''}`"
          class="member-item"
          :class="{ pending: member.isPending }"
        >
          <img class="member-avatar" :src="memberAvatarSrc(member.avatar)" :alt="`${member.username}-avatar`" />
          <div class="member-main">
            <div class="row">
              <span class="name">{{ member.username }}</span>
              <span class="role" :class="{ pending: member.isPending }">{{ member.roleName }}</span>
            </div>
            <div class="desc">{{ member.roleDesc }}</div>
            <div v-if="!member.isPending" class="request-meta">加入时间 · {{ formatTime(member.joinTime || '') }}</div>
            <div v-if="member.isPending" class="request-meta">
              新成员申请 · {{ formatTime(pendingRequests.find((p) => p.requestId === member.requestId)?.createTime || '') }}
            </div>
          </div>
          <div v-if="member.isPending" class="review-actions">
            <button
              class="review-btn accept"
              type="button"
              :disabled="processingRequestId === member.requestId"
              @click="handleApprove(member.requestId)"
            >
              同意
            </button>
            <button
              class="review-btn reject"
              type="button"
              :disabled="processingRequestId === member.requestId"
              @click="handleReject(member.requestId)"
            >
              拒绝
            </button>
          </div>
          <div
            v-else-if="currentUserCaptain && member.roleCode !== 1"
            class="member-menu-wrap"
          >
            <button class="member-menu-btn" type="button" @click.stop="toggleMemberActionMenu(member.id)">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="6" cy="12" r="1.8" fill="currentColor" />
                <circle cx="12" cy="12" r="1.8" fill="currentColor" />
                <circle cx="18" cy="12" r="1.8" fill="currentColor" />
              </svg>
            </button>
            <div v-if="memberActionOpenUserId === member.id" class="member-menu-panel">
              <button
                v-for="option in roleOptions"
                :key="option.code"
                class="member-menu-item"
                type="button"
                :disabled="memberActionLoadingUserId === member.id"
                @click.stop="handleUpdateMemberRole(member, option.code)"
              >
                设为 {{ option.label }}
              </button>
              <button
                class="member-menu-item danger"
                type="button"
                :disabled="memberActionLoadingUserId === member.id"
                @click.stop="handleRemoveMember(member)"
              >
                踢出小组
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <section v-else class="content-panel placeholder">
      <div class="panel-title">{{ tabs.find((t) => t.key === activeTab)?.label }}</div>
      <p>该模块 UI 下个阶段继续完善，当前先完成“任务列表”和“小组成员”详情。</p>
    </section>

    <div v-if="inviteCardVisible" class="invite-modal-mask" @click="closeInviteCard">
      <aside class="invite-card invite-modal-card" @click.stop>
        <div class="invite-head">
          <span class="invite-label">小组邀请码</span>
          <button class="invite-close-btn" type="button" @click="closeInviteCard">关闭</button>
        </div>
        <div class="invite-code">{{ teamInfo.inviteCode }}</div>
        <button class="copy-btn" type="button" @click="copyInviteCode">复制邀请码</button>
        <p v-if="copyTip" class="copy-tip" :class="copyTipType">{{ copyTip }}</p>
      </aside>
    </div>

    <div v-if="removeConfirmVisible" class="remove-member-mask" @click="cancelRemoveMember">
      <section class="remove-member-modal" @click.stop>
        <h3>移出小组成员</h3>
        <p>
          确定将
          <span class="target-name">{{ pendingRemoveMember?.username || '该成员' }}</span>
          移出当前小组吗？
        </p>
        <div class="remove-member-actions">
          <button class="remove-cancel-btn" type="button" @click="cancelRemoveMember">再想想</button>
          <button
            class="remove-confirm-btn"
            type="button"
            :disabled="!pendingRemoveMember || memberActionLoadingUserId === pendingRemoveMember.id"
            @click="confirmRemoveMember"
          >
            {{ memberActionLoadingUserId === pendingRemoveMember?.id ? '处理中...' : '确认移出' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="editTeamVisible" class="edit-team-mask" @click="closeEditTeamModal">
      <section class="edit-team-modal" @click.stop>
        <h3>编辑小组信息</h3>
        <label class="edit-label" for="team-edit-name">小组名称</label>
        <input
          id="team-edit-name"
          v-model="editForm.name"
          class="edit-input"
          type="text"
          maxlength="50"
          placeholder="请输入小组名称"
        />

        <label class="edit-label" for="team-edit-desc">小组描述</label>
        <textarea
          id="team-edit-desc"
          v-model="editForm.description"
          class="edit-textarea"
          maxlength="300"
          placeholder="介绍一下小组目标和分工"
        ></textarea>

        <p v-if="editTeamError" class="edit-error">{{ editTeamError }}</p>

        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="editTeamLoading" @click="closeEditTeamModal">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="editTeamLoading" @click="submitEditTeam">
            {{ editTeamLoading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="taskCreateVisible" class="edit-team-mask" @click="closeTaskCreateModal">
      <section class="edit-team-modal" @click.stop>
        <h3>创建任务清单</h3>
        <label class="edit-label" for="task-list-title">清单标题</label>
        <input
          id="task-list-title"
          v-model="taskCreateForm.title"
          class="edit-input"
          type="text"
          maxlength="150"
          placeholder="请输入任务清单标题"
        />

        <label class="edit-label" for="task-list-desc">清单描述</label>
        <textarea
          id="task-list-desc"
          v-model="taskCreateForm.description"
          class="edit-textarea"
          maxlength="1000"
          placeholder="请输入任务清单描述"
        ></textarea>

        <label class="edit-label" for="task-list-deadline">截止时间</label>
        <input id="task-list-deadline" v-model="taskCreateForm.deadline" class="edit-input" type="datetime-local" />

        <p v-if="taskCreateError" class="edit-error">{{ taskCreateError }}</p>

        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="taskCreateLoading" @click="closeTaskCreateModal">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="taskCreateLoading" @click="submitTaskCreate">
            {{ taskCreateLoading ? '创建中...' : '确认创建' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="taskItemCreateVisible" class="edit-team-mask" @click="closeTaskItemCreateModal">
      <section class="edit-team-modal" @click.stop>
        <h3>新增任务</h3>
        <p class="task-modal-tip">
          当前清单：{{ taskItemCreateForm.taskListTitle }} · 最晚DDL：{{ formatTime(taskItemCreateForm.taskListDeadline) }}
        </p>
        <label class="edit-label" for="task-item-desc">任务描述</label>
        <textarea
          id="task-item-desc"
          v-model="taskItemCreateForm.description"
          class="edit-textarea"
          maxlength="500"
          placeholder="请输入任务描述"
        ></textarea>

        <label class="edit-label" for="task-item-deadline">任务截止时间</label>
        <input id="task-item-deadline" v-model="taskItemCreateForm.deadline" class="edit-input" type="datetime-local" />

        <p v-if="taskItemCreateError" class="edit-error">{{ taskItemCreateError }}</p>

        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="taskItemCreateLoading" @click="closeTaskItemCreateModal">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="taskItemCreateLoading" @click="submitTaskItemCreate">
            {{ taskItemCreateLoading ? '创建中...' : '确认创建' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="taskListEditVisible" class="edit-team-mask" @click="closeTaskListEditModal">
      <section class="edit-team-modal" @click.stop>
        <h3>修改任务清单</h3>
        <label class="edit-label" for="task-list-edit-title">清单标题</label>
        <input
          id="task-list-edit-title"
          v-model="taskListEditForm.title"
          class="edit-input"
          type="text"
          maxlength="150"
          placeholder="请输入任务清单标题"
        />

        <label class="edit-label" for="task-list-edit-desc">清单描述</label>
        <textarea
          id="task-list-edit-desc"
          v-model="taskListEditForm.description"
          class="edit-textarea"
          maxlength="1000"
          placeholder="请输入任务清单描述"
        ></textarea>

        <label class="edit-label" for="task-list-edit-deadline">截止时间</label>
        <input id="task-list-edit-deadline" v-model="taskListEditForm.deadline" class="edit-input" type="datetime-local" />

        <p v-if="taskListEditError" class="edit-error">{{ taskListEditError }}</p>

        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="taskListEditLoading" @click="closeTaskListEditModal">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="taskListEditLoading" @click="submitTaskListEdit">
            {{ taskListEditLoading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="taskListDeleteVisible" class="remove-member-mask" @click="closeTaskListDeleteModal">
      <section class="remove-member-modal" @click.stop>
        <h3>删除任务清单</h3>
        <p>
          确定删除清单
          <span class="target-name">{{ pendingDeleteTaskList?.title || '该清单' }}</span>
          吗？该清单下任务也会一并删除。
        </p>
        <div class="remove-member-actions">
          <button class="remove-cancel-btn" type="button" :disabled="taskListDeleteLoading" @click="closeTaskListDeleteModal">取消</button>
          <button class="remove-confirm-btn" type="button" :disabled="taskListDeleteLoading" @click="confirmTaskListDelete">
            {{ taskListDeleteLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="taskAssignVisible" class="edit-team-mask" @click="closeTaskAssignModal">
      <section class="edit-team-modal" @click.stop>
        <h3>人员分配</h3>
        <p class="task-modal-tip">任务：{{ taskAssignForm.taskDesc }}</p>

        <label class="edit-label">当前负责人</label>
        <div class="task-assignee-actions modal">
          <span v-if="taskAssignAssignees.length === 0" class="task-assignee-empty">当前还没有负责人</span>
          <div
            v-for="assignee in taskAssignAssignees"
            :key="`modal-${taskAssignForm.taskId}-${assignee.userId}`"
            class="task-assignee-chip"
          >
            <span class="task-assignee-chip-name">{{ assignee.username }}</span>
            <button
              class="task-assignee-chip-close"
              type="button"
              :disabled="taskAssignLoading"
              @click="handleRemoveTaskAssigneeInModal(assignee.userId)"
            >
              ×
            </button>
          </div>
        </div>

        <label class="edit-label" for="task-assign-member">添加组员</label>
        <select id="task-assign-member" v-model="taskAssignForm.assigneeUserId" class="edit-input">
          <option value="">请选择要添加的成员</option>
          <option v-for="member in assignableMembers" :key="member.userId" :value="member.userId">
            {{ member.username }}（{{ member.roleName }}）
          </option>
        </select>

        <p v-if="taskAssignError" class="edit-error">{{ taskAssignError }}</p>

        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="taskAssignLoading" @click="closeTaskAssignModal">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="taskAssignLoading" @click="handleAddTaskAssignee">
            {{ taskAssignLoading ? '处理中...' : '新增负责人' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="selfRoleEditVisible" class="edit-team-mask" @click="cancelEditSelfRoleDesc">
      <section class="edit-team-modal" @click.stop>
        <h3>修改角色描述</h3>
        <label class="edit-label" for="self-role-desc-modal">角色描述</label>
        <textarea
          id="self-role-desc-modal"
          v-model="selfRoleDescEdit"
          class="edit-textarea"
          maxlength="80"
          placeholder="填写你的组内职责描述"
        ></textarea>
        <p v-if="selfRoleError" class="edit-error">{{ selfRoleError }}</p>
        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="selfRoleSaving" @click="cancelEditSelfRoleDesc">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="selfRoleSaving" @click="submitSelfRoleDesc">
            {{ selfRoleSaving ? '保存中...' : '保存描述' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="taskCompleteVisible" class="edit-team-mask task-complete-mask" @click="closeTaskCompleteModal">
      <section class="edit-team-modal" @click.stop>
        <h3>确认完成任务</h3>
        <p class="task-modal-tip">任务：{{ taskCompleteForm.taskDesc }}</p>
        <label class="edit-label" for="task-completion-note">完成备注（可选）</label>
        <textarea
          id="task-completion-note"
          v-model="taskCompleteForm.completionNote"
          class="edit-textarea"
          maxlength="100"
          placeholder="可填写任务完成说明"
        ></textarea>
        <p v-if="taskCompleteError" class="edit-error">{{ taskCompleteError }}</p>
        <div class="edit-team-actions">
          <button class="edit-cancel-btn" type="button" :disabled="taskCompleteLoading" @click="closeTaskCompleteModal">取消</button>
          <button class="edit-confirm-btn" type="button" :disabled="taskCompleteLoading" @click="submitTaskComplete">
            {{ taskCompleteLoading ? '提交中...' : '确认完成' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="myTodoVisible" class="edit-team-mask" @click="closeMyTodoModal">
      <section class="edit-team-modal" @click.stop>
        <h3>我的待办</h3>
        <p v-if="myTodoTasks.length === 0" class="task-modal-tip">当前没有未完成的任务，继续保持～</p>
        <ul v-else class="my-todo-list">
          <li v-for="todo in myTodoTasks" :key="todo.taskId" class="my-todo-item">
            <button class="task-complete-check" type="button" @click="openTaskCompleteModal(todo.taskId, todo.description)">
              <span></span>
            </button>
            <div class="my-todo-main">
              <div class="my-todo-desc">{{ todo.description }}</div>
              <div class="my-todo-meta">{{ todo.teamTaskListTitle }} · DDL {{ formatTime(todo.deadline) }}</div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<style scoped>
.team-page { min-height: 100vh; padding: 24px 28px 30px; background: linear-gradient(145deg, #eefaf7 0%, #e5f5fb 55%, #f5fcfb 100%); color: #1f4f4f; }
.team-hero { background: linear-gradient(135deg, #c5efe7 0%, #dff3fb 60%, #ebf9f8 100%); border: 1px solid #cde8ea; border-radius: 20px; padding: 16px 18px; }
.hero-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.back-btn { height: 34px; border-radius: 10px; border: 1px solid #8ecfd8; background: linear-gradient(135deg, #eefbfc 0%, #e6f7fb 100%); color: #2b6770; padding: 0 12px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: filter 0.16s ease, transform 0.16s ease; }
.hero-main { margin-top: 12px; }
.hero-main.split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.hero-meta.left, .hero-meta.right {
  border: 1px solid #cde8ea;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.55);
  padding: 12px;
  display: grid;
  grid-template-rows: minmax(56px, auto) minmax(34px, auto) minmax(38px, auto);
  row-gap: 8px;
  align-content: start;
}
.hero-title-row { display: flex; align-items: center; gap: 10px; min-height: 56px; }
.hero-title-row h2 { margin: 0; font-size: 14px; color: #5a8f91; font-weight: 600; }
.hero-title-value { margin: 0; font-size: 34px; color: #1f5656; font-weight: 700; line-height: 1.1; }
.hero-desc { margin: 0; min-height: 34px; padding: 0; font-size: 14px; color: #2b6668; line-height: 1.65; display: flex; align-items: center; }
.hero-actions { min-height: 38px; margin-top: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hero-action-btn { height: 34px; border-radius: 10px; border: 1px solid #8ecfd8; background: linear-gradient(135deg, #eefbfc 0%, #e6f7fb 100%); color: #2b6770; padding: 0 12px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: filter 0.16s ease, transform 0.16s ease; }
.hero-action-btn:hover, .back-btn:hover { filter: brightness(1.02); transform: translateY(-1px); }
.invite-card { width: 336px; border-radius: 16px; padding: 12px; border: 1px solid #9cd7e1; background: linear-gradient(#f8feff, #f8feff) padding-box, linear-gradient(135deg, #89dce8, #7fd7bf) border-box; box-shadow: 0 10px 24px rgba(67, 158, 171, 0.18); display: flex; flex-direction: column; gap: 10px; }
.invite-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.invite-label { color: #2f6a75; font-size: 13px; font-weight: 700; }
.invite-close-btn { height: 28px; border-radius: 8px; border: 1px solid #bee0e6; background: #f3fcfd; color: #2e6b73; padding: 0 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
.invite-code { font-size: 24px; line-height: 1.15; font-weight: 900; letter-spacing: 2px; color: #0f766e; background: #effbff; border: 1px dashed #9ad0de; border-radius: 12px; padding: 12px; text-align: center; }
.copy-btn { height: 36px; border-radius: 10px; border: 1px solid #41b7c8; background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%); color: #fff; padding: 0 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: transform 0.16s ease, filter 0.16s ease; }
.copy-btn:hover { transform: translateY(-1px); filter: brightness(1.02); }
.copy-tip { margin: 0; font-size: 12px; font-weight: 600; }
.copy-tip.success { color: #0f766e; }
.copy-tip.error { color: #b45309; }
.invite-modal-mask { position: fixed; inset: 0; background: rgba(20, 52, 61, 0.35); display: flex; align-items: center; justify-content: center; z-index: 1300; padding: 16px; }
.invite-modal-card { width: min(360px, 100%); }
.status-tip { margin-top: 8px; font-size: 13px; color: #447a81; }
.status-tip.error { color: #b45309; }
.team-tabs { margin-top: 16px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.tab-btn { height: 44px; border-radius: 12px; border: 1px solid #cde5e8; background: #f8fcfd; color: #2c6668; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
.tab-btn:hover { background: #edf8fa; }
.tab-btn.active { border-color: #3eb7c6; color: #ffffff; background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%); box-shadow: 0 8px 18px rgba(72, 177, 191, 0.28); }
.content-panel { margin-top: 16px; border-radius: 18px; border: 1px solid #d4eaed; background: rgba(255, 255, 255, 0.95); padding: 18px; box-shadow: 0 8px 18px rgba(115, 176, 180, 0.14); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.panel-title { font-size: 18px; font-weight: 700; color: #245656; margin-bottom: 12px; }
.panel-head .panel-title { margin-bottom: 0; }
.task-header-actions { display: flex; align-items: center; gap: 8px; }
.my-todo-btn { height: 34px; border-radius: 10px; border: 1px solid #8ecfd8; background: linear-gradient(135deg, #eefbfc 0%, #e6f7fb 100%); color: #2b6770; padding: 0 12px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.my-todo-btn:hover { filter: brightness(1.02); transform: translateY(-1px); }
.create-task-list-btn { height: 34px; border-radius: 10px; border: 1px solid #35b4be; background: linear-gradient(135deg, #29b6b0 0%, #45c0d3 100%); color: #fff; padding: 0 12px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.create-task-list-btn:hover { filter: brightness(1.02); transform: translateY(-1px); }
.task-list, .member-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.task-item, .member-item { border: 1px solid #dff0ef; background: #f4fcfb; border-radius: 12px; padding: 12px; }
.task-list-top { display: flex; align-items: flex-start; gap: 10px; }
.task-list-head { width: 100%; border: 0; background: transparent; padding: 0; text-align: left; display: grid; grid-template-columns: minmax(0, 1fr) 220px 20px; align-items: flex-start; gap: 12px; cursor: pointer; }
.task-list-info { min-width: 0; }
.task-list-progress-col { width: 220px; }
.task-list-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-top: 2px; }
.task-edit-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid #8ecfd8;
  background: linear-gradient(135deg, #eefbfc 0%, #e6f7fb 100%);
  color: #2b6770;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.task-delete-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid #f1bcb1;
  background: linear-gradient(135deg, #fff1ec 0%, #ffe8e0 100%);
  color: #b42318;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.task-add-btn { width: 30px; height: 30px; border-radius: 10px; border: 1px solid #35b4be; background: linear-gradient(135deg, #29b6b0 0%, #45c0d3 100%); color: #fff; font-size: 18px; line-height: 1; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
.task-add-btn:hover, .task-edit-btn:hover, .task-delete-btn:hover { filter: brightness(1.02); transform: translateY(-1px); }
.task-title { font-size: 15px; font-weight: 700; color: #2b5152; }
.task-meta { font-size: 13px; color: #567f81; }
.task-desc { margin-top: 6px; color: #5d8488; font-size: 13px; line-height: 1.5; }
.task-desc-row { margin-top: 6px; display: flex; align-items: center; justify-content: flex-start; gap: 24px; }
.task-desc-row .task-desc { margin-top: 0; min-width: 0; flex: 0 1 56%; }
.task-desc-row .task-meta { margin-top: 0; white-space: nowrap; flex-shrink: 0; }
.task-progress { margin-top: 2px; }
.task-progress-text { font-size: 12px; color: #4f7a80; }
.task-progress-track {
  margin-top: 6px;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  border: 1px solid #cfe6ea;
  background: #ecf8fa;
  overflow: hidden;
}
.task-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #36b8b6 0%, #5ac6dc 100%);
  transition: width 0.2s ease;
}
.task-list-arrow { color: #2d6c73; font-size: 18px; line-height: 1; transition: transform 0.2s ease; }
.task-list-arrow.expanded { transform: rotate(180deg); }
.task-detail-wrap { margin-top: 10px; border-top: 1px dashed #c8e5e8; padding-top: 10px; }
.task-empty-tip { margin: 0; color: #5b8387; font-size: 13px; }
.task-detail-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.task-detail-item { border: 1px solid #d8ecee; border-radius: 10px; background: #fbffff; padding: 10px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; position: relative; }
.task-detail-item.mine { border-color: #7fcfdb; background: linear-gradient(145deg, #ecfbff 0%, #f4fffc 100%); box-shadow: 0 8px 16px rgba(72, 173, 189, 0.18); }
.task-detail-main {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  justify-content: start;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.task-detail-desc-col { display: flex; align-items: center; gap: 8px; min-width: 0; }
.task-complete-check {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1px solid #7cc8d4;
  background: #f5feff;
  color: #1f8b8f;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.task-complete-check:hover { background: #e6fbff; transform: translateY(-1px); }
.task-complete-check.checked {
  border-color: #6ec7a7;
  background: linear-gradient(145deg, #e7fbf2 0%, #f2fff9 100%);
  color: #2e8a54;
  cursor: default;
}
.task-complete-check:disabled { transform: none; }
.task-detail-status { font-size: 12px; border-radius: 999px; padding: 3px 8px; color: #9f6a1d; background: #fff4df; border: 1px solid #f2d9ab; white-space: nowrap; }
.task-detail-status.done { color: #2e8a54; background: #eaf8ef; border-color: #bde4ca; }
.task-detail-desc { color: #2d5d60; font-size: 13px; line-height: 1.45; word-break: break-word; }
.task-detail-deadline { color: #4c7c82; font-size: 12px; white-space: nowrap; text-align: center; justify-self: center; width: 100%; padding: 0 6px; }
.task-assignee-line { color: #4f7d82; font-size: 12px; line-height: 1.5; white-space: nowrap; text-align: center; justify-self: center; width: 100%; padding: 0 6px; }
.task-completion-line { color: #4f7d82; font-size: 12px; line-height: 1.5; white-space: nowrap; }
.task-assignee-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.task-assignee-actions.modal { margin-top: 6px; }
.task-assignee-empty { color: #5c8488; font-size: 13px; }
.task-assignee-chip {
  position: relative;
  min-width: 76px;
  border: 1px solid #b9ddea;
  border-radius: 12px;
  background: linear-gradient(160deg, #f4fbfd 0%, #eaf6fb 100%);
  color: #2f6b78;
  padding: 9px 24px 7px 10px;
  box-shadow: 0 4px 10px rgba(97, 159, 170, 0.12);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
.task-assignee-chip:hover { transform: translateY(-1px); box-shadow: 0 8px 14px rgba(97, 159, 170, 0.18); }
.task-assignee-chip-name { font-size: 12px; font-weight: 700; line-height: 1.2; }
.task-assignee-chip-close {
  position: absolute;
  top: 4px;
  right: 6px;
  width: 15px;
  height: 15px;
  border: none;
  border-radius: 50%;
  background: #f0f7fa;
  color: #8ba1a6;
  font-size: 10px;
  font-weight: 700;
  line-height: 15px;
  padding: 0;
  cursor: pointer;
  transition: all 0.16s ease;
}
.task-assignee-chip-close:hover { background: #ffeff0; color: #af4a3b; transform: scale(1.06); }
.task-assignee-chip-close:disabled { opacity: 0.6; cursor: not-allowed; }
.task-assignee-remove-btn {
  height: 30px;
  border-radius: 9px;
  border: 1px solid #f0c2b8;
  background: linear-gradient(135deg, #fff5f1 0%, #fff9f7 100%);
  color: #9a3f2e;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease;
}
.task-assignee-remove-btn:hover { transform: translateY(-1px); filter: brightness(1.02); box-shadow: 0 8px 14px rgba(184, 95, 75, 0.14); }
.task-assignee-remove-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
.task-item-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
.task-item-btn {
  height: 32px;
  border-radius: 10px;
  border: 1px solid #8ecfd8;
  background: linear-gradient(135deg, #eefbfc 0%, #e6f7fb 100%);
  color: #2b6770;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease;
}
.task-item-btn.assign {
  border-color: #35b4be;
  background: linear-gradient(135deg, #29b6b0 0%, #45c0d3 100%);
  color: #fff;
}
.task-item-btn:hover { transform: translateY(-1px); filter: brightness(1.02); box-shadow: 0 8px 14px rgba(78, 139, 150, 0.14); }
.task-item-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
.task-modal-tip { margin: 10px 0 0; color: #4e7a80; font-size: 13px; }
.my-todo-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.my-todo-item { border: 1px solid #d6ecef; border-radius: 12px; background: #f8fdfd; padding: 10px; display: flex; align-items: flex-start; gap: 10px; }
.my-todo-main { min-width: 0; }
.my-todo-desc { color: #245f61; font-size: 14px; font-weight: 700; line-height: 1.45; }
.my-todo-meta { margin-top: 4px; color: #5c8589; font-size: 12px; }
.member-tip { margin: 8px 0 0; color: #4b787d; font-size: 13px; }
.member-tip.error { color: #b45309; }
.member-item { display: flex; align-items: center; gap: 12px; }
.member-item.pending { border-color: #7dcfe0; background: linear-gradient(135deg, #ecfbfe 0%, #f4fcf8 100%); box-shadow: 0 8px 16px rgba(95, 173, 187, 0.18); }
.member-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #bfe8e0; background: #bfe8e0; flex-shrink: 0; }
.member-main { flex: 1; min-width: 0; }
.row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.name { font-size: 15px; font-weight: 700; color: #274f50; }
.role { font-size: 12px; padding: 4px 8px; border-radius: 999px; background: #e8f6fb; color: #2f6b78; border: 1px solid #bee0ea; }
.role.pending { background: #fff5df; color: #9f6a1d; border-color: #f5d8aa; }
.desc { margin-top: 6px; font-size: 13px; color: #567f81; line-height: 1.5; }
.request-meta { margin-top: 4px; font-size: 12px; color: #3a7f88; }
.review-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.review-btn { height: 34px; border-radius: 10px; padding: 0 14px; border: 1px solid transparent; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 12px rgba(78, 139, 150, 0.12); transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease; }
.review-btn.accept { color: #fff; border-color: #35b4be; background: linear-gradient(135deg, #29b6b0 0%, #45c0d3 100%); }
.review-btn.reject { color: #8f3b2a; border-color: #efc8bc; background: linear-gradient(135deg, #fff5f1 0%, #fff9f7 100%); }
.review-btn:hover { transform: translateY(-1px); filter: brightness(1.02); box-shadow: 0 8px 14px rgba(78, 139, 150, 0.18); }
.review-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
.member-menu-wrap { margin-left: auto; position: relative; }
.member-menu-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #b8dfe5; background: #f1fbfc; color: #2f6b74; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.member-menu-btn svg { width: 18px; height: 18px; }
.member-menu-panel { position: absolute; top: calc(100% + 8px); right: 0; min-width: 150px; padding: 8px; border-radius: 12px; border: 1px solid #cde8ea; background: #ffffff; box-shadow: 0 16px 28px rgba(48, 118, 124, 0.2); z-index: 20; display: flex; flex-direction: column; gap: 6px; }
.member-menu-item { height: 34px; border-radius: 8px; border: 1px solid #d7eaed; background: #f7fcfd; color: #2d666d; font-size: 13px; font-weight: 700; cursor: pointer; }
.member-menu-item:hover { background: #edf9fb; }
.member-menu-item.danger { border-color: #f2c8bf; background: #fff6f4; color: #9a3f2e; }
.member-menu-item:disabled { opacity: 0.65; cursor: not-allowed; }
.remove-member-mask { position: fixed; inset: 0; background: rgba(20, 52, 61, 0.38); display: flex; align-items: center; justify-content: center; z-index: 1400; padding: 16px; }
.remove-member-modal { width: min(430px, 100%); border-radius: 18px; border: 1px solid #cde8ea; background: linear-gradient(160deg, #ffffff 0%, #f4fcfd 100%); box-shadow: 0 20px 36px rgba(44, 106, 112, 0.2); padding: 18px; }
.remove-member-modal h3 { margin: 0; font-size: 21px; color: #245657; }
.remove-member-modal p { margin: 10px 0 0; font-size: 14px; color: #4f7f86; line-height: 1.6; }
.target-name { color: #9a3f2e; font-weight: 700; }
.remove-member-actions { margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px; }
.remove-cancel-btn, .remove-confirm-btn { height: 38px; border-radius: 10px; padding: 0 14px; border: 1px solid transparent; font-size: 14px; font-weight: 700; cursor: pointer; transition: transform 0.16s ease, filter 0.16s ease, box-shadow 0.16s ease; }
.remove-cancel-btn { background: #f1fbfc; border-color: #b8dfe5; color: #2b6668; }
.remove-confirm-btn { border-color: #f1bcb1; background: linear-gradient(135deg, #fff1ec 0%, #ffe8e0 100%); color: #9a3f2e; box-shadow: 0 8px 14px rgba(184, 95, 75, 0.14); }
.remove-cancel-btn:hover, .remove-confirm-btn:hover { transform: translateY(-1px); filter: brightness(1.02); }
.remove-confirm-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; box-shadow: none; }
.edit-team-mask { position: fixed; inset: 0; background: rgba(20, 52, 61, 0.38); display: flex; align-items: center; justify-content: center; z-index: 1450; padding: 16px; }
.task-complete-mask { z-index: 1600; }
.edit-team-modal { width: min(480px, 100%); border-radius: 18px; border: 1px solid #cde8ea; background: linear-gradient(160deg, #ffffff 0%, #f4fcfd 100%); box-shadow: 0 20px 36px rgba(44, 106, 112, 0.2); padding: 18px; }
.edit-team-modal h3 { margin: 0; font-size: 21px; color: #245657; }
.edit-label { display: block; margin-top: 12px; color: #316768; font-size: 13px; font-weight: 700; }
.edit-input, .edit-textarea { width: 100%; border: 1px solid #c9e2e7; border-radius: 12px; margin-top: 6px; padding: 10px 12px; font-size: 14px; color: #224f50; background: #f9fdfd; }
.edit-textarea { min-height: 110px; resize: vertical; }
.edit-input:focus, .edit-textarea:focus { outline: none; border-color: #4dbed1; box-shadow: 0 0 0 3px rgba(77, 190, 209, 0.2); }
.edit-error { margin: 10px 0 0; color: #c2410c; font-size: 13px; }
.edit-team-actions { margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px; }
.edit-cancel-btn, .edit-confirm-btn { height: 38px; border-radius: 10px; padding: 0 14px; border: 1px solid transparent; font-size: 14px; font-weight: 700; cursor: pointer; }
.edit-cancel-btn { background: #f1fbfc; border-color: #b8dfe5; color: #2b6668; }
.edit-confirm-btn { background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%); color: #fff; }
.edit-cancel-btn:disabled, .edit-confirm-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.placeholder p { margin: 0; color: #588284; }

@media (max-width: 980px) {
  .team-page { padding: 16px; }
  .team-tabs { grid-template-columns: 1fr 1fr; }
  .hero-main.split { grid-template-columns: 1fr; }
  .task-list-head { grid-template-columns: 1fr; }
  .task-list-progress-col { width: 100%; }
  .task-desc-row { flex-direction: column; align-items: flex-start; gap: 4px; }
  .task-detail-main { grid-template-columns: 1fr; align-items: flex-start; }
  .task-item-actions { justify-content: flex-start; }
  .member-item { align-items: flex-start; }
  .review-actions { width: 100%; margin-left: 0; justify-content: flex-end; }
}
</style>
