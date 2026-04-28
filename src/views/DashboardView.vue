<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import avatar1 from '@/assets/avatar/a1.png'
import avatar2 from '@/assets/avatar/a2.png'
import avatar3 from '@/assets/avatar/a3.png'
import avatar4 from '@/assets/avatar/a4.png'
import avatar5 from '@/assets/avatar/a5.png'
import avatar6 from '@/assets/avatar/a6.png'
import avatar7 from '@/assets/avatar/a7.png'
import avatar8 from '@/assets/avatar/a8.png'
import { clearAuthStorage, getStoredLoginUser } from '@/utils/authUser'
import { createTeam, fetchMyTeams, fetchMyMessages, submitJoinRequest, type MyTeam } from '@/api/auth'

interface MenuItem {
  key: string
  label: string
  icon: string
}

interface GroupMember {
  userId: string
  username: string
  roleName: string
}

interface JoinedGroup {
  id: string
  name: string
  description: string
  roleInGroup: string
  createdAt: string
  memberCount: number
  members: GroupMember[]
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

const currentUser = computed(() => {
  return getStoredLoginUser()
})

const currentAvatarSrc = computed(() => avatarMap[currentUser.value?.avatar ?? 1] ?? avatar1)

const menuItems: MenuItem[] = [
  {
    key: 'workspace',
    label: '工作台',
    icon: 'M4 5a2 2 0 0 1 2-2h5v7H4V5Zm9-2h5a2 2 0 0 1 2 2v3h-7V3ZM4 12h7v9H6a2 2 0 0 1-2-2v-7Zm9 0h7v7a2 2 0 0 1-2 2h-5v-9Z',
  },
  {
    key: 'teams',
    label: '我的小组',
    icon: 'M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8 2a3 3 0 1 0-2.9-3.8M3 20a5 5 0 0 1 10 0M14.5 20a4.5 4.5 0 0 1 6 0',
  },
  {
    key: 'docs',
    label: '协作文档',
    icon: 'M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 1v5h5M8 13h8M8 17h5',
  },
  {
    key: 'mentor',
    label: '智能导师',
    icon: 'M12 3 2 8l10 5 10-5-10-5Zm-7 8v5c0 2.8 3.1 5 7 5s7-2.2 7-5v-5',
  },
  {
    key: 'tasks',
    label: '任务调度',
    icon: 'M7 2v3M17 2v3M4 7h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 7h4v4H8z',
  },
]

const activeMenu = ref('teams')
const router = useRouter()
const settingsMenuRef = ref<HTMLElement | null>(null)
const settingsMenuVisible = ref(false)
const teamsLoading = ref(false)
const teamsError = ref('')
const joinedGroups = ref<JoinedGroup[]>([])
const pendingMessageCount = ref(0)

const formatTime = (value: string) => {
  if (!value) {
    return '--'
  }
  return value.replace('T', ' ').slice(0, 16)
}

const mapTeam = (item: MyTeam): JoinedGroup => ({
  id: item.teamId,
  name: item.teamName,
  description: item.description || '这个小组还没有填写描述，快和大家一起完善吧。',
  roleInGroup: item.userRoleName,
  createdAt: formatTime(item.createTime),
  memberCount: item.memberCount,
  members: (item.members || []).map((member) => ({
    userId: member.userId,
    username: member.username,
    roleName: member.roleName,
  })),
})

const loadMyTeams = async () => {
  if (!currentUser.value?.id) {
    joinedGroups.value = []
    teamsError.value = '未识别到当前用户，请重新登录'
    return
  }
  teamsLoading.value = true
  teamsError.value = ''
  try {
    const result = await fetchMyTeams()
    joinedGroups.value = (result.teams || []).map(mapTeam)
  } catch (error) {
    teamsError.value = error instanceof Error ? error.message : '查询我的小组失败，请稍后重试'
  } finally {
    teamsLoading.value = false
  }
}

const loadPendingMessageCount = async () => {
  try {
    const result = await fetchMyMessages()
    pendingMessageCount.value = result.pendingMessages?.length ?? 0
  } catch {
    pendingMessageCount.value = 0
  }
}

const handleMenuClick = async (key: string) => {
  activeMenu.value = key
  if (key === 'teams') {
    await loadMyTeams()
  }
}

const displayMembers = (members: GroupMember[]) => {
  const max = 4
  return {
    head: members.slice(0, max),
    hasMore: members.length > max,
  }
}

const totalMembers = computed(() => joinedGroups.value.reduce((sum, group) => sum + group.memberCount, 0))

const createModalVisible = ref(false)
const createLoading = ref(false)
const createError = ref('')
const createForm = ref({
  name: '',
  description: '',
})

const joinModalVisible = ref(false)
const joinLoading = ref(false)
const joinError = ref('')
const joinSuccess = ref('')
const toastVisible = ref(false)
const toastMessage = ref('')
const joinForm = ref({
  inviteCode: '',
  description: '',
})

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
  }
  createError.value = ''
}

const openCreateModal = () => {
  resetCreateForm()
  createModalVisible.value = true
}

const closeCreateModal = () => {
  if (createLoading.value) {
    return
  }
  createModalVisible.value = false
}

const resetJoinForm = () => {
  joinForm.value = {
    inviteCode: '',
    description: '',
  }
  joinError.value = ''
  joinSuccess.value = ''
}

const openJoinModal = () => {
  resetJoinForm()
  joinModalVisible.value = true
}

const closeJoinModal = () => {
  if (joinLoading.value) {
    return
  }
  joinModalVisible.value = false
}

const showToast = (message: string) => {
  toastMessage.value = message
  toastVisible.value = true
  window.setTimeout(() => {
    toastVisible.value = false
    toastMessage.value = ''
  }, 2000)
}

const goMessageCenter = async () => {
  await router.push('/messages')
}

const pendingMessageBadgeText = computed(() => {
  if (pendingMessageCount.value > 99) {
    return '99+'
  }
  return String(pendingMessageCount.value)
})

const toggleSettingsMenu = () => {
  settingsMenuVisible.value = !settingsMenuVisible.value
}

const handleLogout = async () => {
  clearAuthStorage()
  settingsMenuVisible.value = false
  await router.replace('/login')
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof Node)) {
    return
  }
  if (settingsMenuRef.value && !settingsMenuRef.value.contains(target)) {
    settingsMenuVisible.value = false
  }
}

const submitCreateTeam = async () => {
  const name = createForm.value.name.trim()
  const description = createForm.value.description.trim()
  if (name.length < 2 || name.length > 50) {
    createError.value = '小组名称长度需在2到50个字符之间'
    return
  }
  if (description.length > 300) {
    createError.value = '小组描述最多300个字符'
    return
  }
  if (!currentUser.value?.id) {
    createError.value = '未识别到当前用户，请重新登录后再试'
    return
  }

  createLoading.value = true
  createError.value = ''
  try {
    const result = await createTeam({
      name,
      description,
    })

    createModalVisible.value = false
    if (activeMenu.value === 'teams') {
      await loadMyTeams()
    }
    await router.push('/teams/' + result.teamId)
  } catch (error) {
    createError.value = error instanceof Error ? error.message : '创建小组失败，请稍后重试'
  } finally {
    createLoading.value = false
  }
}

const submitJoinTeam = async () => {
  const inviteCode = joinForm.value.inviteCode.trim()
  const description = joinForm.value.description.trim()
  if (!inviteCode) {
    joinError.value = '请输入邀请码'
    joinSuccess.value = ''
    return
  }
  if (inviteCode.length > 20) {
    joinError.value = '邀请码长度不能超过20个字符'
    joinSuccess.value = ''
    return
  }
  if (description.length > 500) {
    joinError.value = '备注最多500个字符'
    joinSuccess.value = ''
    return
  }
  if (!currentUser.value?.id) {
    joinError.value = '未识别到当前用户，请重新登录后再试'
    joinSuccess.value = ''
    return
  }

  joinLoading.value = true
  joinError.value = ''
  joinSuccess.value = ''
  try {
    await submitJoinRequest({
      inviteCode,
      description: description || undefined,
    })
    joinSuccess.value = '入组申请已发送，组长处理后会通知你'
    joinForm.value.inviteCode = ''
    joinForm.value.description = ''
    joinModalVisible.value = false
    showToast('入组申请已提交，等待组长处理')
  } catch (error) {
    joinError.value = error instanceof Error ? error.message : '加入申请提交失败，请稍后重试'
  } finally {
    joinLoading.value = false
  }
}

const goTeamDetail = async (teamId: number | string) => {
  await router.push('/teams/' + teamId)
}

const activeGroups = [
  { name: '软件工程课程设计组', role: '组长', progress: '进度 78%' },
  { name: '计算机网络冲刺组', role: '开发者', progress: '进度 62%' },
  { name: '算法竞赛训练营', role: '文案', progress: '进度 49%' },
]

const pendingTasks = [
  { title: '整理数据库 ER 图', due: '截止今晚 21:00', priority: '高优先级' },
  { title: '补充接口联调文档', due: '截止明天 10:30', priority: '中优先级' },
  { title: '复盘上周冲刺会议', due: '截止明天 18:00', priority: '低优先级' },
]

const recentDocs = [
  { title: '需求评审纪要.md', updateTime: '20 分钟前更新' },
  { title: '系统架构草图.pdf', updateTime: '今天 14:22 更新' },
  { title: '任务拆分清单.docx', updateTime: '昨天 19:40 更新' },
]

onMounted(async () => {
  window.addEventListener('click', handleClickOutside)
  await loadPendingMessageCount()
  if (activeMenu.value === 'teams') {
    await loadMyTeams()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="dashboard-page">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">TU</div>
        <div class="brand-text">
          <h1>TeamUp</h1>
          <p>Study Together</p>
        </div>
      </div>

      <nav class="menu">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeMenu === item.key }"
          type="button"
          @click="handleMenuClick(item.key)"
        >
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="profile">
        <img class="avatar" :src="currentAvatarSrc" :alt="`${currentUser?.name ?? 'user'}-avatar`" />
        <div class="profile-meta">
          <div class="name">{{ currentUser?.name ?? '' }}</div>
          <div class="email">{{ currentUser?.email ?? '' }}</div>
        </div>
      </div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="group-actions">
          <button class="group-btn create-btn" type="button" @click="openCreateModal">
            <i class="fa-solid fa-plus" aria-hidden="true"></i>
            <span>创建小组</span>
          </button>
          <button class="group-btn join-btn" type="button" @click="openJoinModal">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
              <path d="M14 8l4 4-4 4" />
              <path d="M8 12h10" />
            </svg>
            <span>加入小组</span>
          </button>
        </div>
        <div class="search-wrap">
          <input type="text" placeholder="搜索小组、文档或任务..." />
        </div>
        <div ref="settingsMenuRef" class="top-actions">
          <button class="top-icon-btn" type="button" aria-label="消息" @click="goMessageCenter">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8a6 6 0 1 0-12 0v5l-2 3h16l-2-3V8Zm-7 11h2" />
            </svg>
            <span v-if="pendingMessageCount > 0" class="message-badge">{{ pendingMessageBadgeText }}</span>
          </button>
          <button class="top-icon-btn" type="button" aria-label="设置" @click.stop="toggleSettingsMenu">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="6" cy="12" r="1.8" fill="currentColor" />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              <circle cx="18" cy="12" r="1.8" fill="currentColor" />
            </svg>
          </button>
          <div v-if="settingsMenuVisible" class="settings-menu">
            <button class="settings-item danger" type="button" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </header>

      <template v-if="activeMenu === 'teams'">
        <section class="teams-overview">
          <h2>我的小组</h2>
          <p>你已加入 {{ joinedGroups.length }} 个小组，累计协作成员 {{ totalMembers }} 人次。</p>
        </section>

        <section v-if="teamsLoading" class="teams-feedback">正在加载我的小组...</section>
        <section v-else-if="teamsError" class="teams-feedback error">{{ teamsError }}</section>
        <section v-else-if="joinedGroups.length === 0" class="teams-feedback">你还没有加入任何小组，先创建一个吧。</section>

        <section v-else class="teams-grid">
          <article v-for="group in joinedGroups" :key="group.id" class="team-card clickable" @click="goTeamDetail(group.id)">
            <div class="team-header">
              <h3>{{ group.name }}</h3>
              <span class="role-tag">{{ group.roleInGroup }}</span>
            </div>
            <p class="team-desc">{{ group.description }}</p>
            <div class="team-meta">
              <span>创建时间：{{ group.createdAt }}</span>
              <span>小组成员：{{ group.memberCount }} 人</span>
            </div>
            <div class="members">
              <span v-for="member in displayMembers(group.members).head" :key="member.userId" class="member-pill">
                {{ member.roleName }} · {{ member.username }}
              </span>
              <span v-if="displayMembers(group.members).hasMore" class="member-pill">...</span>
            </div>
          </article>
        </section>
      </template>

      <template v-else>
        <section class="greeting">
          <h2>下午好，{{ currentUser?.name ?? '' }} 👋</h2>
          <p>今天有 3 个任务即将到达 Deadline，AI 导师已为你生成了最新的复习导图。</p>
        </section>

        <section class="main-grid">
          <article class="card">
            <div class="card-title">正在进行的小组</div>
            <ul>
              <li v-for="group in activeGroups" :key="group.name">
                <span class="item-name">{{ group.name }}</span>
                <span class="item-sub">{{ group.role }} · {{ group.progress }}</span>
              </li>
            </ul>
          </article>

          <article class="card">
            <div class="card-title">待处理的任务</div>
            <ul>
              <li v-for="task in pendingTasks" :key="task.title">
                <span class="item-name">{{ task.title }}</span>
                <span class="item-sub">{{ task.due }} · {{ task.priority }}</span>
              </li>
            </ul>
          </article>

          <article class="card docs-card">
            <div class="card-title">近期文档</div>
            <ul>
              <li v-for="doc in recentDocs" :key="doc.title">
                <span class="item-name">{{ doc.title }}</span>
                <span class="item-sub">{{ doc.updateTime }}</span>
              </li>
            </ul>
          </article>
        </section>
      </template>
    </main>

    <div v-if="createModalVisible" class="modal-mask" @click="closeCreateModal">
      <section class="create-modal" @click.stop>
        <h3>创建小组</h3>
        <p class="modal-sub">填写组名和描述后即可创建，系统会自动生成邀请码。</p>

        <label class="field-label" for="team-name">小组名称</label>
        <input
          id="team-name"
          v-model="createForm.name"
          class="modal-input"
          type="text"
          maxlength="50"
          placeholder="请输入小组名称"
        />

        <label class="field-label" for="team-desc">小组描述</label>
        <textarea
          id="team-desc"
          v-model="createForm.description"
          class="modal-textarea"
          maxlength="300"
          placeholder="介绍一下这个小组的学习目标和协作方向"
        ></textarea>

        <p v-if="createError" class="modal-error">{{ createError }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" type="button" :disabled="createLoading" @click="closeCreateModal">取消</button>
          <button class="modal-btn confirm" type="button" :disabled="createLoading" @click="submitCreateTeam">
            {{ createLoading ? '创建中...' : '确认创建' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="joinModalVisible" class="modal-mask" @click="closeJoinModal">
      <section class="create-modal join-modal" @click.stop>
        <h3>加入小组</h3>
        <p class="modal-sub">输入邀请码并附上备注，组长确认后你就能加入协作啦。</p>

        <label class="field-label" for="join-invite-code">邀请码</label>
        <input
          id="join-invite-code"
          v-model="joinForm.inviteCode"
          class="modal-input"
          type="text"
          maxlength="20"
          placeholder="请输入小组邀请码"
        />

        <label class="field-label" for="join-desc">申请备注</label>
        <textarea
          id="join-desc"
          v-model="joinForm.description"
          class="modal-textarea"
          maxlength="500"
          placeholder="例如：我是后端方向同学，想参与接口与数据库协作"
        ></textarea>

        <p v-if="joinError" class="modal-error">{{ joinError }}</p>
        <p v-if="joinSuccess" class="modal-success">{{ joinSuccess }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" type="button" :disabled="joinLoading" @click="closeJoinModal">取消</button>
          <button class="modal-btn confirm" type="button" :disabled="joinLoading" @click="submitJoinTeam">
            {{ joinLoading ? '提交中...' : '提交申请' }}
          </button>
        </div>
      </section>
    </div>

    <transition name="toast-fade">
      <div v-if="toastVisible" class="toast-tip">{{ toastMessage }}</div>
    </transition>

  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(140deg, #eefaf7 0%, #e5f5fb 52%, #f5fcfb 100%);
  color: #204d4c;
}

.sidebar {
  width: 270px;
  background: #f4fcfa;
  border-right: 1px solid #cfe7e3;
  display: flex;
  flex-direction: column;
  padding: 28px 18px 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 18px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #24b3a8 0%, #46c4da 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
}

.brand-text h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.1;
  font-weight: 700;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #4d7f7d;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.menu-item {
  width: 100%;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #2d6361;
  text-align: left;
  padding: 12px 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.menu-item:hover {
  background: #dcf3ef;
}

.menu-item.active {
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(63, 173, 186, 0.28);
}

.profile {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #def3ef;
  border-radius: 16px;
  padding: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #bfe8e0;
  background: #bfe8e0;
}

.name {
  font-size: 14px;
  font-weight: 700;
}

.email {
  font-size: 12px;
  color: #487875;
}

.workspace {
  flex: 1;
  padding: 28px 34px;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.group-btn {
  height: 42px;
  border-radius: 12px;
  padding: 0 14px;
  border: 1px solid #8ecfd8;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.group-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.create-btn {
  color: #fff;
  border-color: #3fb9c8;
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
}

.join-btn {
  color: #256466;
  background: #eefbfc;
}

.group-btn:hover {
  filter: brightness(1.02);
}

.search-wrap {
  width: min(420px, 100%);
  flex-shrink: 1;
}

.search-wrap input {
  width: 100%;
  border: 1px solid #bedeea;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.94);
  font-size: 14px;
  color: #245353;
}

.search-wrap input:focus {
  outline: none;
  border-color: #4dbed1;
  box-shadow: 0 0 0 3px rgba(77, 190, 209, 0.2);
}

.top-actions {
  position: relative;
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.top-actions > .top-icon-btn {
  border: 1px solid #bedeea;
  border-radius: 12px;
  background: #fff;
  color: #2d6768;
  width: 42px;
  height: 42px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.top-actions > .top-icon-btn:hover {
  background: #e9f8fc;
}

.top-actions svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.message-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid #ffffff;
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  padding: 0 4px;
  box-shadow: 0 6px 12px rgba(239, 68, 68, 0.28);
}

.settings-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 198px;
  border: 1px solid #cde8ea;
  border-radius: 16px;
  background: linear-gradient(160deg, #ffffff 0%, #f4fcfd 100%);
  box-shadow: 0 18px 34px rgba(44, 106, 112, 0.18);
  padding: 10px;
  z-index: 40;
}

.settings-item {
  width: 100%;
  min-height: 42px;
  border: 1px solid #39b5c5;
  border-radius: 12px;
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  transition: transform 0.16s ease, box-shadow 0.16s ease, filter 0.16s ease;
}

.settings-item:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
  box-shadow: 0 10px 16px rgba(67, 152, 165, 0.24);
}

.settings-item.danger {
  border-color: #39b5c5;
  color: #ffffff;
}

.greeting {
  margin-top: 22px;
  background: linear-gradient(135deg, #bfeee6 0%, #dcf4fb 100%);
  border-radius: 20px;
  padding: 24px;
  color: #1e4f4d;
}

.greeting h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
}

.greeting p {
  margin: 8px 0 0;
  font-size: 15px;
}

.teams-overview {
  margin-top: 22px;
  background: linear-gradient(135deg, #c6efe7 0%, #dff3fb 52%, #edf9f8 100%);
  border: 1px solid #cde8ea;
  border-radius: 20px;
  padding: 22px 24px;
  color: #1f5050;
}

.teams-overview h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
}

.teams-overview p {
  margin: 8px 0 0;
  font-size: 15px;
  color: #4f7e7f;
}

.teams-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.teams-feedback {
  margin-top: 18px;
  border: 1px solid #d3e9ec;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  color: #376a6f;
  font-size: 14px;
}

.teams-feedback.error {
  border-color: #f3d0c7;
  color: #b45309;
  background: #fffaf7;
}

.team-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d3e9ec;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 8px 20px rgba(98, 170, 181, 0.16);
}

.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(98, 170, 181, 0.2);
}

.team-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.team-header h3 {
  margin: 0;
  font-size: 18px;
  color: #245656;
  font-weight: 700;
}

.role-tag {
  border-radius: 999px;
  background: #edf8fb;
  border: 1px solid #bfe0ea;
  color: #2f6b78;
  font-size: 12px;
  padding: 5px 10px;
  font-weight: 700;
  white-space: nowrap;
}

.team-desc {
  margin: 12px 0;
  color: #416d72;
  font-size: 14px;
  line-height: 1.6;
}

.team-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #5c878b;
  font-size: 13px;
  margin-bottom: 12px;
}

.members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-pill {
  background: #f3fcfb;
  border: 1px solid #d5ece7;
  color: #3f6f6f;
  border-radius: 999px;
  font-size: 12px;
  padding: 6px 10px;
}

.main-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d4eaed;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 6px 20px rgba(115, 176, 180, 0.14);
}

.docs-card {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #245656;
  margin-bottom: 12px;
}

.card ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card li {
  background: #f4fcfb;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #264f4f;
}

.item-sub {
  font-size: 12px;
  color: #53817f;
}


.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 39, 53, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

.create-modal {
  width: min(520px, 100%);
  background: #ffffff;
  border: 1px solid #d1e8eb;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(32, 90, 104, 0.24);
  padding: 20px;
}

.create-modal h3 {
  margin: 0;
  color: #25595a;
  font-size: 22px;
}

.modal-sub {
  margin: 8px 0 14px;
  color: #5b8283;
  font-size: 14px;
}

.field-label {
  display: block;
  color: #316768;
  font-size: 13px;
  font-weight: 700;
  margin-top: 10px;
}

.modal-input,
.modal-textarea {
  width: 100%;
  border: 1px solid #c9e2e7;
  border-radius: 12px;
  margin-top: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: #224f50;
  background: #f9fdfd;
}

.modal-textarea {
  min-height: 110px;
  resize: vertical;
}

.modal-input:focus,
.modal-textarea:focus {
  outline: none;
  border-color: #4dbed1;
  box-shadow: 0 0 0 3px rgba(77, 190, 209, 0.2);
}

.modal-error {
  margin: 10px 0 0;
  color: #c2410c;
  font-size: 13px;
}

.modal-success {
  margin: 10px 0 0;
  color: #0f766e;
  font-size: 13px;
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  height: 38px;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}

.modal-btn.cancel {
  background: #f1fbfc;
  border-color: #b8dfe5;
  color: #2b6668;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
  color: #fff;
}

.modal-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.toast-tip {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 1500;
  max-width: min(360px, calc(100vw - 32px));
  border: 1px solid #9ed9e2;
  border-radius: 12px;
  background: linear-gradient(135deg, #edfafd 0%, #f4fbf8 100%);
  color: #1f6169;
  box-shadow: 0 12px 24px rgba(52, 130, 142, 0.2);
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 980px) {
  .dashboard-page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #cfe7e3;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .teams-grid {
    grid-template-columns: 1fr;
  }

  .docs-card {
    grid-column: auto;
  }

  .topbar {
    flex-wrap: wrap;
  }

  .group-actions {
    width: 100%;
  }

  .group-btn {
    flex: 1;
    justify-content: center;
  }

  .search-wrap {
    width: 100%;
  }

  .top-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>


















