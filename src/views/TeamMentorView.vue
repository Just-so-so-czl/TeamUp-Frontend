<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Eraser, PanelRightClose, PanelRightOpen, SendHorizontal } from 'lucide-vue-next'

type ChatHistoryItem = {
  id: string
  title: string
  description: string
}

type DocItem = {
  id: string
  name: string
}

type MessageItem = {
  id: string
  role: 'assistant' | 'user'
  content: string
  time: string
}

const route = useRoute()
const router = useRouter()

const teamId = computed(() => String(route.params.id || ''))
const docsSidebarOpen = ref(true)
const composerRef = ref<HTMLTextAreaElement | null>(null)
const composerText = ref('')

const chatHistory = ref<ChatHistoryItem[]>([
  {
    id: 'ch-1',
    title: '并行矩阵乘法排障',
    description: '正在定位 MPI_Bcast 广播流程中的同步逻辑问题。',
  },
  {
    id: 'ch-2',
    title: 'ChickenStream 部署联调',
    description: '整理 SRS 集群节点、子码流和回源链路的配置方案。',
  },
  {
    id: 'ch-3',
    title: 'TeamUp 架构讨论',
    description: '围绕 Spring AI、文档理解和协作记忆结构继续细化。',
  },
])

const documents = ref<{
  referenceDocs: DocItem[]
  collaborativeDocs: DocItem[]
}>({
  referenceDocs: [
    { id: 'ref-1', name: 'LC-3 输入输出映射与 Chisel 规范说明.md' },
    { id: 'ref-2', name: '蓝桥杯 Java 17 竞赛规则.pdf' },
  ],
  collaborativeDocs: [
    { id: 'collab-1', name: 'TeamUp Sprint 1 产品待办清单' },
    { id: 'collab-2', name: 'ChickenStream 摄像头链路矩阵 v2' },
  ],
})

const activeSessionId = ref('ch-3')
const fallbackSession: ChatHistoryItem = {
  id: 'fallback',
  title: '未命名会话',
  description: '当前没有可展示的会话内容。',
}

const sessionMessages = ref<Record<string, MessageItem[]>>({
  'ch-1': [
    {
      id: 'm-11',
      role: 'assistant',
      content: '我先帮你梳理一下排查顺序：先确认广播前的数据长度一致，再检查 barrier 的位置，最后看根节点是否在第二轮前重写了缓冲区。',
      time: '09:12',
    },
    {
      id: 'm-12',
      role: 'user',
      content: '如果是根节点没有刷新缓冲区，会不会导致只有部分节点拿到旧值？',
      time: '09:14',
    },
  ],
  'ch-2': [
    {
      id: 'm-21',
      role: 'assistant',
      content: '当前更建议你把部署问题拆成三块：节点发现、回源配置、延迟观测。这样后面做日志比对会更清楚。',
      time: '14:08',
    },
    {
      id: 'm-22',
      role: 'user',
      content: '我们这周主要卡在切换节点后的延迟抖动，想先把定位步骤列出来。',
      time: '14:10',
    },
  ],
  'ch-3': [
    {
      id: 'm-31',
      role: 'assistant',
      content: '对于 TeamUp 的智能导师模块，当前更适合走“文档理解 + 协作记忆 + 任务联动”的方向，而不是直接堆完整 RAG 链路。',
      time: '16:20',
    },
    {
      id: 'm-32',
      role: 'user',
      content: '那在界面上，我希望会话、消息流和项目文档是并列的，不要让文档区太弱。',
      time: '16:22',
    },
    {
      id: 'm-33',
      role: 'assistant',
      content: '可以。左边专注会话切换，中间保留舒适的消息阅读与输入节奏，右边把资料文档和协作文档拆开展示，便于边聊边参照。',
      time: '16:24',
    },
  ],
})

const activeSession = computed(
  () =>
    chatHistory.value.find((item) => item.id === activeSessionId.value)
    ?? chatHistory.value[0]
    ?? fallbackSession,
)

const activeMessages = computed(() => sessionMessages.value[activeSessionId.value] ?? [])

const goBack = async () => {
  await router.push(`/teams/${teamId.value}`)
}

const selectSession = (sessionId: string) => {
  activeSessionId.value = sessionId
}

const resizeComposer = async () => {
  await nextTick()
  const textarea = composerRef.value
  if (!textarea) {
    return
  }
  textarea.style.height = '0px'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`
}

watch(composerText, () => {
  void resizeComposer()
})

const clearComposer = () => {
  composerText.value = ''
}

const sendMessage = () => {
  const content = composerText.value.trim()
  if (!content) {
    return
  }

  const nextMessages = [...activeMessages.value]
  nextMessages.push({
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    time: '刚刚',
  })
  nextMessages.push({
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '这是用于界面演示的样例回复。后续接入真实接口后，这里可以结合会话历史与右侧文档上下文生成正式回答。',
    time: '刚刚',
  })

  sessionMessages.value = {
    ...sessionMessages.value,
    [activeSessionId.value]: nextMessages,
  }

  composerText.value = ''
}

const toggleDocsSidebar = () => {
  docsSidebarOpen.value = !docsSidebarOpen.value
}
</script>

<template>
  <div class="mentor-page">
    <section class="mentor-layout" :class="{ collapsed: !docsSidebarOpen }">
      <aside class="history-panel surface-panel">
        <div class="history-topbar">
          <button class="back-button" type="button" @click="goBack">返回小组详情</button>
          <span class="team-chip">小组 ID：{{ teamId }}</span>
        </div>

        <div class="panel-head history-head">
          <p class="panel-eyebrow">智能导师</p>
          <h1 class="history-title-main">项目协作对话</h1>
          <p class="panel-desc">
            在这里查看历史会话、继续提问，并随时参照当前项目文档内容。
          </p>
        </div>

        <div class="history-list">
          <button
            v-for="item in chatHistory"
            :key="item.id"
            type="button"
            class="history-item"
            :class="{ active: activeSessionId === item.id }"
            @click="selectSession(item.id)"
          >
            <div class="history-item-title" :title="item.title">{{ item.title }}</div>
            <div class="history-description" :title="item.description">{{ item.description }}</div>
          </button>
        </div>
      </aside>

      <main class="chat-panel surface-panel">
        <div class="panel-head chat-head">
          <div>
            <p class="panel-eyebrow">当前主题</p>
            <h2 class="chat-title" :title="activeSession.title">{{ activeSession.title }}</h2>
            <p class="panel-desc chat-desc" :title="activeSession.description">
              {{ activeSession.description }}
            </p>
          </div>
          <div class="chat-state">对话中</div>
        </div>

        <div class="message-stream">
          <article
            v-for="message in activeMessages"
            :key="message.id"
            class="message-row"
            :class="message.role"
          >
            <div class="message-bubble">
              <div class="message-meta">
                <span class="message-role">{{ message.role === 'assistant' ? '智能导师' : '我' }}</span>
                <span class="message-time">{{ message.time }}</span>
              </div>
              <p class="message-content">{{ message.content }}</p>
            </div>
          </article>
        </div>

        <div class="composer-wrap">
          <div class="composer-box">
            <label class="composer-label" for="mentor-composer">输入对话内容</label>
            <textarea
              id="mentor-composer"
              ref="composerRef"
              v-model="composerText"
              class="composer-input"
              rows="3"
              placeholder="例如：请根据现有资料文档，帮我提炼这周需要推进的三项核心任务。"
              @input="resizeComposer"
            />
            <div class="composer-footer">
              <p class="composer-tip">当前是 UI 演示版本，消息与文档均为样例数据。</p>
              <div class="composer-actions">
                <button class="action-button ghost" type="button" @click="clearComposer">
                  <Eraser :size="16" />
                  <span>清空</span>
                </button>
                <button class="action-button primary" type="button" @click="sendMessage">
                  <SendHorizontal :size="16" />
                  <span>发送</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="docs-panel surface-panel" :class="{ shut: !docsSidebarOpen }">
        <div class="docs-toolbar">
          <button class="toggle-button" type="button" @click="toggleDocsSidebar">
            <component :is="docsSidebarOpen ? PanelRightClose : PanelRightOpen" :size="18" />
            <span>{{ docsSidebarOpen ? '收起文档栏' : '展开文档栏' }}</span>
          </button>
        </div>

        <div v-if="docsSidebarOpen" class="docs-content">
          <div class="panel-head docs-head">
            <div>
              <p class="panel-eyebrow">项目文档</p>
              <h2 class="panel-title">文档管理</h2>
              <p class="panel-desc">严格区分资料文档和协作文档，保持检索和浏览的清晰度。</p>
            </div>
          </div>

          <section class="doc-group">
            <div class="doc-group-head">
              <h3>资料文档</h3>
              <span>{{ documents.referenceDocs.length }}</span>
            </div>
            <ul class="doc-list">
              <li v-for="doc in documents.referenceDocs" :key="doc.id" class="doc-item reference">
                <span class="doc-name" :title="doc.name">{{ doc.name }}</span>
              </li>
            </ul>
          </section>

          <section class="doc-group">
            <div class="doc-group-head">
              <h3>协作文档</h3>
              <span>{{ documents.collaborativeDocs.length }}</span>
            </div>
            <ul class="doc-list">
              <li v-for="doc in documents.collaborativeDocs" :key="doc.id" class="doc-item collaborative">
                <span class="doc-name" :title="doc.name">{{ doc.name }}</span>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.mentor-page {
  --mentor-bg: #f4ede4;
  --mentor-surface: rgba(255, 251, 247, 0.94);
  --mentor-surface-strong: rgba(255, 255, 255, 0.98);
  --mentor-border: #d9cfc4;
  --mentor-border-strong: #9a8470;
  --mentor-text: #2f241d;
  --mentor-text-secondary: #6c5b50;
  --mentor-text-muted: #8d7a6d;
  --mentor-fill-hover: #f7efe7;
  --mentor-fill-active: #efe1d3;
  --mentor-accent: #8b5e3c;
  --mentor-accent-soft: #c99262;
  --mentor-gold: #d8b07a;
  --mentor-green: #7e9b7b;
  --mentor-radius-xl: 28px;
  --mentor-radius-lg: 22px;
  --mentor-radius-md: 16px;
  min-height: 100vh;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(201, 146, 98, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(126, 155, 123, 0.12), transparent 22%),
    linear-gradient(180deg, #f8f2ea 0%, var(--mentor-bg) 100%);
  color: var(--mentor-text);
  font-family: 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.surface-panel {
  min-width: 0;
  height: 100%;
  border-radius: var(--mentor-radius-xl);
  overflow: hidden;
  background: var(--mentor-surface);
  border: 1px solid var(--mentor-border);
  box-shadow: 0 20px 40px rgba(78, 55, 35, 0.06);
}

.mentor-layout {
  max-width: 1680px;
  margin: 0 auto;
  min-height: calc(100vh - 40px);
  display: grid;
  grid-template-columns: 304px minmax(0, 1fr) 300px;
  gap: 18px;
}

.mentor-layout.collapsed {
  grid-template-columns: 304px minmax(0, 1fr) 82px;
}

.history-panel,
.docs-panel {
  display: flex;
  flex-direction: column;
}

.history-topbar {
  padding: 18px 18px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(180deg, rgba(255, 248, 242, 0.98) 0%, rgba(255, 248, 242, 0.75) 100%);
}

.back-button,
.toggle-button,
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.back-button,
.toggle-button,
.action-button.ghost {
  border: 1px solid var(--mentor-border);
  background: #fffdfb;
  color: var(--mentor-text);
}

.back-button:hover,
.toggle-button:hover,
.action-button.ghost:hover {
  background: var(--mentor-fill-hover);
  border-color: var(--mentor-border-strong);
}

.back-button,
.action-button {
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
}

.back-button {
  width: 100%;
  justify-content: center;
}

.back-button:focus-visible,
.toggle-button:focus-visible,
.action-button:focus-visible,
.history-item:focus-visible,
.composer-input:focus-visible {
  outline: 2px solid var(--mentor-accent-soft);
  outline-offset: 2px;
}

.team-chip,
.chat-state,
.doc-group-head span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(216, 176, 122, 0.14);
  border: 1px solid rgba(216, 176, 122, 0.35);
  color: #7b5b34;
  font-size: 12px;
  font-weight: 700;
}

.panel-head {
  padding: 24px 24px 18px;
  border-bottom: 1px solid rgba(217, 207, 196, 0.8);
  background: linear-gradient(180deg, var(--mentor-surface-strong) 0%, rgba(255, 249, 243, 0.92) 100%);
}

.history-head {
  padding-top: 20px;
}

.panel-eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--mentor-text-muted);
}

.history-title-main,
.chat-title,
.panel-title {
  margin: 0;
  color: var(--mentor-text);
  font-family: 'Source Han Serif SC', 'Songti SC', serif;
  font-weight: 700;
}

.history-title-main {
  font-size: clamp(28px, 2.6vw, 38px);
  line-height: 1.08;
}

.panel-title {
  font-size: 24px;
  line-height: 1.25;
}

.chat-title {
  font-size: 30px;
  line-height: 1.18;
}

.panel-desc,
.composer-tip {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--mentor-text-secondary);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  width: 100%;
  text-align: left;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: transparent;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.history-item:hover {
  background: var(--mentor-fill-hover);
  border-color: rgba(154, 132, 112, 0.35);
}

.history-item.active {
  background: linear-gradient(135deg, rgba(201, 146, 98, 0.14) 0%, rgba(216, 176, 122, 0.18) 100%);
  border-color: rgba(139, 94, 60, 0.42);
}

.history-item-title,
.doc-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  color: var(--mentor-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-description {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--mentor-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chat-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.chat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.chat-desc {
  max-width: 760px;
}

.chat-state {
  background: rgba(126, 155, 123, 0.14);
  border-color: rgba(126, 155, 123, 0.36);
  color: #557154;
}

.message-stream {
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background:
    linear-gradient(180deg, rgba(251, 247, 242, 0.68) 0%, rgba(255, 252, 249, 0.96) 100%);
}

.message-row {
  display: flex;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  width: min(100%, 780px);
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(217, 207, 196, 0.9);
  background: #fffdfb;
}

.message-row.user .message-bubble {
  background: linear-gradient(135deg, rgba(201, 146, 98, 0.12) 0%, rgba(255, 248, 242, 0.98) 100%);
  border-color: rgba(201, 146, 98, 0.3);
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.message-role,
.message-time {
  font-size: 12px;
  color: var(--mentor-text-muted);
}

.message-role {
  font-weight: 700;
}

.message-content {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.85;
  color: var(--mentor-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.composer-wrap {
  padding: 20px 24px 24px;
  border-top: 1px solid rgba(217, 207, 196, 0.8);
  background: rgba(255, 252, 249, 0.98);
}

.composer-box {
  border: 1px solid rgba(217, 207, 196, 0.9);
  border-radius: var(--mentor-radius-lg);
  padding: 18px;
  background: #fffdfb;
}

.composer-label {
  display: block;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--mentor-text);
}

.composer-input {
  width: 100%;
  min-height: 88px;
  max-height: 220px;
  resize: none;
  border: 1px solid rgba(217, 207, 196, 0.95);
  border-radius: 16px;
  background: #fffaf6;
  padding: 14px 16px;
  font: inherit;
  font-size: 14px;
  line-height: 1.8;
  color: var(--mentor-text);
  overflow-y: auto;
}

.composer-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-button.primary {
  border: 1px solid var(--mentor-accent);
  background: linear-gradient(135deg, var(--mentor-accent) 0%, #a06d44 100%);
  color: #ffffff;
}

.action-button.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(139, 94, 60, 0.18);
}

.docs-panel.shut {
  overflow: visible;
}

.docs-toolbar {
  padding: 14px;
  border-bottom: 1px solid rgba(217, 207, 196, 0.8);
  background: linear-gradient(180deg, rgba(255, 250, 246, 0.98) 0%, rgba(255, 248, 242, 0.9) 100%);
}

.toggle-button {
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
}

.docs-content {
  flex: 1;
  overflow-y: auto;
}

.docs-head {
  border-bottom: none;
  padding-bottom: 8px;
}

.doc-group {
  padding: 0 18px 18px;
}

.doc-group + .doc-group {
  padding-top: 6px;
}

.doc-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.doc-group-head h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  color: var(--mentor-text);
}

.doc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doc-item {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.doc-item.reference {
  background: rgba(216, 176, 122, 0.08);
}

.doc-item.collaborative {
  background: rgba(126, 155, 123, 0.08);
}

.doc-item:hover {
  border-color: rgba(154, 132, 112, 0.35);
}

@media (max-width: 1280px) {
  .mentor-layout {
    grid-template-columns: 288px minmax(0, 1fr) 286px;
  }

  .mentor-layout.collapsed {
    grid-template-columns: 288px minmax(0, 1fr) 82px;
  }
}

@media (max-width: 980px) {
  .mentor-page {
    padding: 14px;
  }

  .mentor-layout,
  .mentor-layout.collapsed {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .surface-panel {
    height: auto;
    min-height: 280px;
  }

  .chat-head,
  .composer-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .composer-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>