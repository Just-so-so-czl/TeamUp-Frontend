<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type TabKey = 'tasks' | 'members' | 'collabDocs' | 'resourceDocs' | 'mentor'

type TaskStatus = '待开始' | '进行中' | '已完成'

interface TeamTask {
  id: number
  title: string
  owner: string
  deadline: string
  priority: '高' | '中' | '低'
  status: TaskStatus
  progress: number
}

interface TeamMember {
  id: number
  name: string
  role: string
  online: boolean
  completedTasks: number
  contribution: string
}

const route = useRoute()
const router = useRouter()

const activeTab = ref<TabKey>('tasks')

const teamId = computed(() => Number(route.params.id || 0))

const teamInfo = computed(() => {
  const map: Record<number, { name: string; description: string }> = {
    1: {
      name: '软件工程课程设计组',
      description: '围绕 TeamUp 平台完成课程项目，推进需求分析、架构设计、编码联调与测试复盘。',
    },
    2: {
      name: '计算机网络冲刺组',
      description: '聚焦核心知识点与真题演练，每周协作输出复盘笔记与实验报告模板。',
    },
    3: {
      name: '算法竞赛训练营',
      description: '以专题刷题和组内讲解为主，沉淀题解模板，提升实战解题速度与稳定性。',
    },
  }
  return (
    map[teamId.value] ?? {
      name: '我的学习小组',
      description: '在这里查看小组任务、成员协作情况和学习资料。',
    }
  )
})

const tabs = [
  { key: 'tasks', label: '任务列表' },
  { key: 'members', label: '小组成员' },
  { key: 'collabDocs', label: '协作文档' },
  { key: 'resourceDocs', label: '资料文档' },
  { key: 'mentor', label: '智能导师' },
] as const

const taskList = computed<TeamTask[]>(() => [
  {
    id: 1,
    title: '完善用户与权限模块联调',
    owner: '李同学',
    deadline: '今天 22:00',
    priority: '高',
    status: '进行中',
    progress: 75,
  },
  {
    id: 2,
    title: '优化小组主页交互细节',
    owner: '王同学',
    deadline: '明天 18:00',
    priority: '中',
    status: '待开始',
    progress: 10,
  },
  {
    id: 3,
    title: '输出接口测试与回归报告',
    owner: '陈同学',
    deadline: '后天 12:00',
    priority: '中',
    status: '进行中',
    progress: 46,
  },
  {
    id: 4,
    title: '阶段答辩 PPT 与演示流程',
    owner: '张同学',
    deadline: '周五 16:00',
    priority: '低',
    status: '已完成',
    progress: 100,
  },
])

const memberList = computed<TeamMember[]>(() => [
  {
    id: 1,
    name: '张同学',
    role: '组长',
    online: true,
    completedTasks: 8,
    contribution: '需求梳理、评审与进度推进',
  },
  {
    id: 2,
    name: '李同学',
    role: '后端开发',
    online: true,
    completedTasks: 6,
    contribution: '接口开发与权限模块联调',
  },
  {
    id: 3,
    name: '王同学',
    role: '前端开发',
    online: false,
    completedTasks: 5,
    contribution: '页面实现与交互体验优化',
  },
  {
    id: 4,
    name: '陈同学',
    role: '测试',
    online: true,
    completedTasks: 4,
    contribution: '接口测试、回归验证与问题跟踪',
  },
])

const goBack = async () => {
  await router.push('/dashboard')
}
</script>

<template>
  <main class="team-page">
    <section class="team-hero">
      <button class="back-btn" type="button" @click="goBack">返回我的小组</button>
      <h1>{{ teamInfo.name }}</h1>
      <p>{{ teamInfo.description }}</p>
    </section>

    <section class="team-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </section>

    <section v-if="activeTab === 'tasks'" class="content-panel">
      <div class="panel-title">任务列表</div>
      <ul class="task-list">
        <li v-for="task in taskList" :key="task.id" class="task-item">
          <div class="task-head">
            <div class="task-title">{{ task.title }}</div>
            <span class="task-status" :class="task.status">{{ task.status }}</span>
          </div>
          <div class="task-meta">负责人：{{ task.owner }} · 截止时间：{{ task.deadline }} · 优先级：{{ task.priority }}</div>
          <div class="task-progress">
            <div class="track">
              <div class="bar" :style="{ width: `${task.progress}%` }"></div>
            </div>
            <span>{{ task.progress }}%</span>
          </div>
        </li>
      </ul>
    </section>

    <section v-else-if="activeTab === 'members'" class="content-panel">
      <div class="panel-title">小组成员</div>
      <ul class="member-list">
        <li v-for="member in memberList" :key="member.id" class="member-item">
          <div class="avatar">{{ member.name.slice(0, 1) }}</div>
          <div class="member-main">
            <div class="row">
              <span class="name">{{ member.name }}</span>
              <span class="role">{{ member.role }}</span>
              <span class="state" :class="{ online: member.online }">{{ member.online ? '在线' : '离线' }}</span>
            </div>
            <div class="desc">已完成任务 {{ member.completedTasks }} 个 · 贡献：{{ member.contribution }}</div>
          </div>
        </li>
      </ul>
    </section>

    <section v-else class="content-panel placeholder">
      <div class="panel-title">{{ tabs.find((t) => t.key === activeTab)?.label }}</div>
      <p>该模块 UI 下个阶段继续完善，当前先完成“任务列表”和“小组成员”详情。</p>
    </section>
  </main>
</template>

<style scoped>
.team-page {
  min-height: 100vh;
  padding: 24px 28px 30px;
  background: linear-gradient(145deg, #eefaf7 0%, #e5f5fb 55%, #f5fcfb 100%);
  color: #1f4f4f;
}

.team-hero {
  background: linear-gradient(135deg, #c5efe7 0%, #dff3fb 60%, #ebf9f8 100%);
  border: 1px solid #cde8ea;
  border-radius: 20px;
  padding: 20px 22px;
}

.back-btn {
  height: 38px;
  border: 1px solid #a9d9df;
  background: #f2fdff;
  color: #2b5e67;
  border-radius: 10px;
  padding: 0 12px;
  font-weight: 600;
  cursor: pointer;
}

.team-hero h1 {
  margin: 14px 0 0;
  font-size: 30px;
  color: #1f5656;
}

.team-hero p {
  margin: 8px 0 0;
  color: #4f7e7f;
  line-height: 1.7;
}

.team-tabs {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.tab-btn {
  height: 44px;
  border-radius: 12px;
  border: 1px solid #cde5e8;
  background: #f8fcfd;
  color: #2c6668;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #edf8fa;
}

.tab-btn.active {
  border-color: #3eb7c6;
  color: #ffffff;
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
  box-shadow: 0 8px 18px rgba(72, 177, 191, 0.28);
}

.content-panel {
  margin-top: 16px;
  border-radius: 18px;
  border: 1px solid #d4eaed;
  background: rgba(255, 255, 255, 0.95);
  padding: 18px;
  box-shadow: 0 8px 18px rgba(115, 176, 180, 0.14);
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #245656;
  margin-bottom: 12px;
}

.task-list,
.member-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item,
.member-item {
  border: 1px solid #dff0ef;
  background: #f4fcfb;
  border-radius: 12px;
  padding: 12px;
}

.task-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.task-title {
  font-size: 15px;
  font-weight: 700;
  color: #2b5152;
}

.task-status {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.task-status.待开始 {
  background: #fff4df;
  color: #9f6a1d;
}

.task-status.进行中 {
  background: #eaf6ff;
  color: #2b6ea1;
}

.task-status.已完成 {
  background: #eaf8ef;
  color: #2e8a54;
}

.task-meta {
  margin-top: 8px;
  font-size: 13px;
  color: #567f81;
}

.task-progress {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: #dceff0;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
}

.task-progress span {
  width: 40px;
  font-size: 12px;
  color: #406b6d;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #245f5f;
  background: #d1efea;
}

.member-main {
  flex: 1;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.name {
  font-size: 15px;
  font-weight: 700;
  color: #274f50;
}

.role {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e8f6fb;
  color: #2f6b78;
  border: 1px solid #bee0ea;
}

.state {
  font-size: 12px;
  color: #8a9f9f;
}

.state.online {
  color: #26a074;
}

.desc {
  margin-top: 6px;
  font-size: 13px;
  color: #567f81;
}

.placeholder p {
  margin: 0;
  color: #588284;
}

@media (max-width: 980px) {
  .team-page {
    padding: 16px;
  }

  .team-tabs {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
