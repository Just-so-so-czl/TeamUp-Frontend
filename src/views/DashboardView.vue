<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import avatar1 from '@/assets/avatar/a1.png'
import avatar2 from '@/assets/avatar/a2.png'
import avatar3 from '@/assets/avatar/a3.png'
import avatar4 from '@/assets/avatar/a4.png'
import avatar5 from '@/assets/avatar/a5.png'
import avatar6 from '@/assets/avatar/a6.png'
import avatar7 from '@/assets/avatar/a7.png'
import avatar8 from '@/assets/avatar/a8.png'
import { getStoredLoginUser } from '@/utils/authUser'
import { createTeam } from '@/api/auth'

interface MenuItem {
  key: string
  label: string
  icon: string
}

interface GroupMember {
  id: number | string
  name: string
  role: string
}

interface JoinedGroup {
  id: number | string
  name: string
  description: string
  roleInGroup: string
  createdAt: string
  members: GroupMember[]
}

const LOCAL_GROUPS_KEY = 'teamup_local_created_groups'

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
  const fallbackUser = {
    id: '',
    name: 'TeamUp 用户',
    email: 'guest@teamup.edu.cn',
    avatar: 1,
  }
  return getStoredLoginUser() ?? fallbackUser
})

const currentAvatarSrc = computed(() => avatarMap[currentUser.value.avatar] ?? avatar1)

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

const defaultJoinedGroups: JoinedGroup[] = [
  {
    id: 1,
    name: '软件工程课程设计组',
    description: '围绕 TeamUp 平台完成课程项目，进行需求分析、接口开发与联调测试。',
    roleInGroup: '组长',
    createdAt: '2026-03-02',
    members: [
      { id: 1, name: '张同学', role: '组长' },
      { id: 2, name: '李同学', role: '后端开发' },
      { id: 3, name: '王同学', role: '前端开发' },
      { id: 4, name: '陈同学', role: '测试' },
    ],
  },
  {
    id: 2,
    name: '计算机网络冲刺组',
    description: '每周集中复盘真题与实验报告，整理错题并进行组内讲解。',
    roleInGroup: '开发者',
    createdAt: '2026-02-18',
    members: [
      { id: 5, name: '张同学', role: '开发者' },
      { id: 6, name: '周同学', role: '资料整理' },
      { id: 7, name: '吴同学', role: '讲解负责人' },
    ],
  },
  {
    id: 3,
    name: '算法竞赛训练营',
    description: '按专题刷题并沉淀题解文档，配合周赛节奏进行训练。',
    roleInGroup: '文案',
    createdAt: '2026-01-09',
    members: [
      { id: 8, name: '张同学', role: '文案' },
      { id: 9, name: '赵同学', role: '算法手' },
      { id: 10, name: '孙同学', role: '代码审阅' },
      { id: 11, name: '钱同学', role: '资料官' },
    ],
  },
]

const loadLocalCreatedGroups = (): JoinedGroup[] => {
  const raw = localStorage.getItem(LOCAL_GROUPS_KEY)
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as JoinedGroup[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
  } catch {
    return []
  }
}

const mergeGroups = (base: JoinedGroup[], local: JoinedGroup[]): JoinedGroup[] => {
  const map = new Map<string, JoinedGroup>()
  base.forEach((item) => map.set(String(item.id), item))
  local.forEach((item) => map.set(String(item.id), item))
  return Array.from(map.values())
}

const joinedGroups = ref<JoinedGroup[]>(mergeGroups(defaultJoinedGroups, loadLocalCreatedGroups()))

const persistLocalCreatedGroups = () => {
  const localGroups = joinedGroups.value.filter((item) => !defaultJoinedGroups.some((base) => base.id === item.id))
  localStorage.setItem(LOCAL_GROUPS_KEY, JSON.stringify(localGroups))
}

const totalMembers = computed(() => {
  return joinedGroups.value.reduce((sum, group) => sum + group.members.length, 0)
})

const createModalVisible = ref(false)
const createLoading = ref(false)
const createError = ref('')
const createForm = ref({
  name: '',
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
  if (!currentUser.value.id) {
    createError.value = '未识别到当前用户，请重新登录后再试'
    return
  }

  createLoading.value = true
  createError.value = ''
  try {
    const result = await createTeam({
      userId: currentUser.value.id,
      name,
      description,
    })

    const today = new Date()
    const createdAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    joinedGroups.value.unshift({
      id: result.teamId,
      name,
      description: description || '这个小组还没有填写描述，快补充你们的学习目标吧。',
      roleInGroup: '组长',
      createdAt,
      members: [
        {
          id: currentUser.value.id,
          name: currentUser.value.name,
          role: '组长',
        },
      ],
    })
    persistLocalCreatedGroups()

    createModalVisible.value = false
    await router.push('/teams/' + result.teamId)
  } catch (error) {
    createError.value = error instanceof Error ? error.message : '创建小组失败，请稍后重试'
  } finally {
    createLoading.value = false
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
          @click="activeMenu = item.key"
        >
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="profile">
        <img class="avatar" :src="currentAvatarSrc" :alt="`${currentUser.name}-avatar`" />
        <div class="profile-meta">
          <div class="name">{{ currentUser.name }}</div>
          <div class="email">{{ currentUser.email }}</div>
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
          <button class="group-btn join-btn" type="button">
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
        <div class="top-actions">
          <button type="button" aria-label="消息">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8a6 6 0 1 0-12 0v5l-2 3h16l-2-3V8Zm-7 11h2" />
            </svg>
          </button>
          <button type="button" aria-label="设置">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="6" cy="12" r="1.8" fill="currentColor" />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              <circle cx="18" cy="12" r="1.8" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      <template v-if="activeMenu === 'teams'">
        <section class="teams-overview">
          <h2>我的小组</h2>
          <p>你已加入 {{ joinedGroups.length }} 个小组，累计协作成员 {{ totalMembers }} 人次。</p>
        </section>

        <section class="teams-grid">
          <article v-for="group in joinedGroups" :key="group.id" class="team-card clickable" @click="goTeamDetail(group.id)">
            <div class="team-header">
              <h3>{{ group.name }}</h3>
              <span class="role-tag">{{ group.roleInGroup }}</span>
            </div>
            <p class="team-desc">{{ group.description }}</p>
            <div class="team-meta">
              <span>创建时间：{{ group.createdAt }}</span>
              <span>小组成员：{{ group.members.length }} 人</span>
            </div>
            <div class="members">
              <span v-for="member in group.members" :key="member.id" class="member-pill">
                {{ member.name }} · {{ member.role }}
              </span>
            </div>
          </article>
        </section>
      </template>

      <template v-else>
        <section class="greeting">
          <h2>下午好，{{ currentUser.name }} 👋</h2>
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
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.top-actions button {
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
}

.top-actions button:hover {
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

















