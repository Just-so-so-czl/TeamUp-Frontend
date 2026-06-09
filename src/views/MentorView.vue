<template>
  <div class="mentor-layout">
    <aside class="sidebar-left">
      <button class="top-back" type="button" @click="handleBack">
        <span>←</span>
        <span>返回首页</span>
      </button>

      <div class="history-header">
        <h3>会话历史</h3>
        <button class="new-session-btn" type="button" :disabled="sessionLoading" @click="handleCreateSession">
          + 新建会话
        </button>
      </div>

      <div class="history-list">
        <div v-if="sessionLoading" class="history-empty">加载会话中...</div>
        <div v-else-if="sessionError" class="history-empty">{{ sessionError }}</div>
        <button
          v-for="item in sessions"
          :key="item.sessionId"
          class="history-item"
          :class="{ active: item.sessionId === sessionId }"
          type="button"
          @click="selectSession(item.sessionId)"
        >
          <div class="history-main">
            <span class="history-icon">◉</span>
            <div class="history-text">
              <div class="history-title">
                <span>{{ item.title || '智能导师对话' }}</span>
                <span>{{ formatSessionTime(item.lastMessageAt) }}</span>
              </div>
              <div class="history-desc">{{ item.messageCount }} 条消息</div>
            </div>
          </div>
        </button>
        <div v-if="!sessionLoading && !sessionError && sessions.length === 0" class="history-empty">暂无会话</div>
      </div>

      <div class="user-card">
        <img :src="currentUser.avatarUrl" :alt="currentUser.name" />
        <div class="user-info">
          <div class="name">{{ currentUser.name }}</div>
          <div class="role">{{ currentUser.email }}</div>
        </div>
      </div>
    </aside>

    <main class="chat-area">
      <div class="chat-header">
        <div class="chat-title">
          <div class="ai-avatar">AI</div>
          <div>
            <h2>智能导师</h2>
            <p>你的专属学习协作助手，支持流式回复</p>
          </div>
        </div>
      </div>

      <div class="chat-content">
        <div v-for="msg in messages" :key="msg.id" class="message-row" :class="msg.role === 'user' ? 'right' : 'left'">
          <div v-if="msg.role === 'assistant'" class="msg-avatar">AI</div>
          <div class="message" :class="msg.role === 'user' ? 'user' : 'ai'">
            <div
              class="msg-text"
              :class="{
                'user-msg-text': msg.role === 'user',
                'user-msg-code': msg.role === 'user' && msg.isLikelyLongSingleLine,
                'user-msg-expanded': msg.role === 'user' && msg.expanded,
              }"
              v-html="msg.html"
            ></div>
            <button
              v-if="msg.role === 'user' && msg.canExpand"
              class="msg-expand-btn"
              type="button"
              @click="toggleExpand(msg.id)"
            >
              {{ msg.expanded ? '收起' : '展开' }}
            </button>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <textarea
          v-model="inputText"
          placeholder="输入你的问题，按 Enter 发送"
          :disabled="loading"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <div class="input-bottom">
          <button class="send-btn" type="button" :disabled="loading" @click="sendMessage">
            {{ loading ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </main>

    <aside class="sidebar-right">
      <div class="docs-top">
        <h3>项目文档</h3>
        <button class="new-btn" type="button" @click="loadDocuments">刷新</button>
      </div>

      <div class="doc-tabs">
        <button class="tab-btn" :class="{ active: activeDocTab === 1 }" type="button" @click="switchDocTab(1)">资料文档</button>
        <button class="tab-btn" :class="{ active: activeDocTab === 2 }" type="button" @click="switchDocTab(2)">协作文档</button>
      </div>

      <div class="doc-cards">
        <div v-if="!teamId" class="doc-empty">未识别到 teamId</div>
        <div v-else-if="docLoading" class="doc-empty">加载中...</div>
        <div v-else-if="docError" class="doc-empty">{{ docError }}</div>
        <div v-else-if="documents.length === 0" class="doc-empty">暂无文档</div>
        <button v-for="doc in documents" :key="doc.documentId" class="doc-card" type="button" @click="openDocument(doc.documentId)">
          <div class="doc-icon" :class="`icon-${resolveIconType(doc.fileType)}`">{{ resolveIconType(doc.fileType).toUpperCase().slice(0, 1) }}</div>
          <div class="doc-main">
            <div class="doc-name">{{ doc.title }}</div>
            <div class="doc-sub">
              <span>{{ doc.dateLabel }}</span>
              <span>{{ doc.creatorName }}</span>
            </div>
          </div>
          <div class="doc-more">⋮</div>
        </button>
      </div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { useRoute, useRouter } from 'vue-router'
import {
  createMentorSession,
  fetchMentorHistory,
  fetchMentorSessionList,
  fetchMentorSidebarDocs,
  fetchTeamDocumentDownloadUrl,
  streamMentorChat,
  type MentorHistoryMessage,
  type MentorSessionItem,
  type MentorSidebarDocItem,
} from '@/api/auth'
import { getStoredLoginUser } from '@/utils/authUser'
import a1 from '@/assets/avatar/a1.png'
import a2 from '@/assets/avatar/a2.png'
import a3 from '@/assets/avatar/a3.png'
import a4 from '@/assets/avatar/a4.png'
import a5 from '@/assets/avatar/a5.png'
import a6 from '@/assets/avatar/a6.png'
import a7 from '@/assets/avatar/a7.png'
import a8 from '@/assets/avatar/a8.png'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  html: string
  time: string
  isLikelyLongSingleLine?: boolean
  canExpand?: boolean
  expanded?: boolean
}

const md = new MarkdownIt({ breaks: true, linkify: true })
const renderMarkdown = (text: string) => DOMPurify.sanitize(md.render(text))
const avatarMap: Record<number, string> = { 1: a1, 2: a2, 3: a3, 4: a4, 5: a5, 6: a6, 7: a7, 8: a8 }

const router = useRouter()
const route = useRoute()
const teamId = computed(() => (route.params.id ? String(route.params.id) : ''))
const loading = ref(false)
const inputText = ref('')
const sessionId = ref<string | undefined>(undefined)
const sessions = ref<MentorSessionItem[]>([])
const sessionLoading = ref(false)
const sessionError = ref('')
const activeDocTab = ref<1 | 2>(1)
const documents = ref<MentorSidebarDocItem[]>([])
const docLoading = ref(false)
const docError = ref('')

const welcomeText = '你好，我是 TeamUp 智能导师。你可以直接提问，我会流式输出建议。'
const messages = ref<ChatMessage[]>([
  { id: 'init-1', role: 'assistant', content: welcomeText, html: renderMarkdown(welcomeText), time: '刚刚' },
])

const currentUser = computed(() => {
  const user = getStoredLoginUser()
  if (!user) return { name: '未登录用户', email: 'no-email@teamup.local', avatarUrl: a1 }
  return { name: user.name, email: user.email, avatarUrl: avatarMap[user.avatar] ?? a1 }
})

const isLikelyLongSingleLine = (text: string) => {
  const trimmed = (text || '').trim()
  if (!trimmed) return false
  if (/[\r\n]/.test(trimmed)) return false
  return trimmed.length >= 80 && !/\s{2,}/.test(trimmed)
}

const shouldShowExpand = (text: string) => {
  const trimmed = (text || '').trim()
  if (!trimmed) return false
  if (isLikelyLongSingleLine(trimmed)) return true
  const lineCount = trimmed.split(/\r?\n/).length
  return lineCount > 4 || trimmed.length > 120
}

const nowLabel = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
const formatSessionTime = (value: string) => (value ? new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '')
const sessionCacheKey = computed(() => `teamup_mentor_last_session_${teamId.value}`)

const mapHistoryMessage = (item: MentorHistoryMessage): ChatMessage => {
  const role: 'user' | 'assistant' = item.senderType === 'ASSISTANT' ? 'assistant' : 'user'
  const content = item.content || ''
  return {
    id: `h-${item.messageId}`,
    role,
    content,
    html: renderMarkdown(content),
    time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : nowLabel(),
    isLikelyLongSingleLine: role === 'user' ? isLikelyLongSingleLine(content) : false,
    canExpand: role === 'user' ? shouldShowExpand(content) : false,
    expanded: false,
  }
}

const toggleExpand = (messageId: string) => {
  const index = messages.value.findIndex((msg) => msg.id === messageId)
  if (index < 0) return
  const current = messages.value[index]
  if (!current) return
  messages.value[index] = {
    ...current,
    expanded: !current.expanded,
  }
}

const handleBack = async () => {
  if (teamId.value) {
    await router.push(`/teams/${teamId.value}`)
    return
  }
  await router.push('/home')
}

const loadSessions = async () => {
  if (!teamId.value) return
  sessionLoading.value = true
  sessionError.value = ''
  try {
    console.info('[mentor] loadSessions start', { teamId: teamId.value, cacheKey: sessionCacheKey.value })
    const res = await fetchMentorSessionList(teamId.value)
    sessions.value = res.sessions || []
    console.info('[mentor] loadSessions success', {
      teamId: teamId.value,
      sessionCount: sessions.value.length,
      sessionIds: sessions.value.map((s) => s.sessionId),
    })
  } catch (e) {
    sessionError.value = '会话列表加载失败'
    console.error('loadSessions failed', e)
  } finally {
    sessionLoading.value = false
  }
}

const selectSession = async (targetSessionId: string) => {
  if (!targetSessionId) return
  sessionError.value = ''
  sessionId.value = targetSessionId
  localStorage.setItem(sessionCacheKey.value, targetSessionId)
  console.info('[mentor] selectSession start', { teamId: teamId.value, targetSessionId })
  try {
    const historyRes = await fetchMentorHistory(targetSessionId)
    console.info('[mentor] selectSession success', {
      targetSessionId,
      messageCount: historyRes.messages?.length || 0,
      firstMessageId: historyRes.messages?.[0]?.messageId,
    })
    messages.value = historyRes.messages?.length
      ? historyRes.messages.map(mapHistoryMessage)
      : [{ id: 'init-empty', role: 'assistant', content: '该会话暂无消息，可继续提问。', html: renderMarkdown('该会话暂无消息，可继续提问。'), time: '刚刚' }]
  } catch (e) {
    sessionError.value = '会话历史加载失败'
    console.error('selectSession failed', e)
  }
}

const loadLatestHistory = async () => {
  await loadSessions()
  if (sessions.value.length === 0) return
  const cached = localStorage.getItem(sessionCacheKey.value)
  const matched = cached ? sessions.value.find((s) => s.sessionId === cached) : undefined
  const firstSession = sessions.value[0]
  const target = matched?.sessionId || (firstSession ? firstSession.sessionId : '')
  console.info('[mentor] loadLatestHistory choose target', { cached, matched: matched?.sessionId, target })
  if (target) await selectSession(target)
}

const handleCreateSession = async () => {
  if (!teamId.value || sessionLoading.value) return
  sessionError.value = ''
  try {
    const created = await createMentorSession(teamId.value)
    await loadSessions()
    messages.value = [
      { id: 'init-1', role: 'assistant', content: welcomeText, html: renderMarkdown(welcomeText), time: '刚刚' },
    ]
    if (created?.sessionId) {
      await selectSession(created.sessionId)
    }
  } catch (e) {
    sessionError.value = '新建会话失败'
    console.error('createSession failed', e)
  }
}

const resolveIconType = (fileType: string) => {
  const t = (fileType || '').toLowerCase()
  if (t.includes('doc')) return 'doc'
  if (t.includes('pdf')) return 'pdf'
  if (t.includes('xls')) return 'xls'
  if (t.includes('ppt')) return 'ppt'
  return 'file'
}

const loadDocuments = async () => {
  if (!teamId.value) return
  docLoading.value = true
  docError.value = ''
  try {
    const res = await fetchMentorSidebarDocs(teamId.value, activeDocTab.value)
    documents.value = res.documents || []
  } catch {
    docError.value = '文档加载失败，请稍后重试'
  } finally {
    docLoading.value = false
  }
}

const switchDocTab = (type: 1 | 2) => {
  if (activeDocTab.value === type) return
  activeDocTab.value = type
  void loadDocuments()
}

const openDocument = async (documentId: string) => {
  try {
    const url = await fetchTeamDocumentDownloadUrl(documentId)
    window.open(url, '_blank')
  } catch {
    docError.value = '打开文档失败，请稍后重试'
  }
}

const sendMessage = async () => {
  const message = inputText.value.trim()
  if (!message || loading.value) return

  messages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: message,
    html: renderMarkdown(message),
    time: nowLabel(),
    isLikelyLongSingleLine: isLikelyLongSingleLine(message),
    canExpand: shouldShowExpand(message),
    expanded: false,
  })
  messages.value.push({ id: `a-${Date.now()}`, role: 'assistant', content: '', html: '', time: nowLabel() })
  const aiMsgIndex = messages.value.length - 1

  inputText.value = ''
  loading.value = true
  try {
    await streamMentorChat(
      { message, teamId: teamId.value || undefined, sessionId: sessionId.value },
      (chunk) => {
        const current = messages.value[aiMsgIndex]
        if (!current) return
        const content = current.content + chunk
        messages.value[aiMsgIndex] = { ...current, content, html: renderMarkdown(content) }
      },
      (meta) => {
        if (meta.sessionId) {
          sessionId.value = meta.sessionId
          localStorage.setItem(sessionCacheKey.value, meta.sessionId)
          console.info('[mentor] stream meta', { teamId: teamId.value, sessionId: meta.sessionId, traceId: meta.traceId })
        }
      },
    )
    await loadSessions()
  } catch {
    const current = messages.value[aiMsgIndex]
    if (current) {
      const content = '抱歉，AI 服务暂时不可用，请稍后重试。'
      messages.value[aiMsgIndex] = { ...current, content, html: renderMarkdown(content) }
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadLatestHistory()
  void loadDocuments()
})
</script>

<style scoped>
* { box-sizing: border-box; }
.mentor-layout { display: flex; height: 100vh; background: #f6f8fc; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #1f2a44; overflow: hidden; }
.sidebar-left { width: 306px; background: rgba(255, 255, 255, 0.9); border-right: 1px solid #eef1f7; padding: 22px; display: flex; flex-direction: column; }
.top-back { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 13px; margin-bottom: 22px; border: none; background: transparent; padding: 0; text-align: left; cursor: pointer; }
.history-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.history-header h3 { margin: 0; font-size: 22px; }
.new-session-btn { border: none; border-radius: 12px; background: #e9efff; color: #4f7cff; font-size: 13px; font-weight: 600; padding: 8px 12px; cursor: pointer; }
.new-session-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.history-list { flex: 1; margin-top: 16px; overflow-y: auto; }
.history-item { width: 100%; text-align: left; border: none; padding: 14px; border-radius: 14px; margin-bottom: 10px; background: transparent; cursor: pointer; }
.history-main { display: flex; gap: 10px; align-items: flex-start; }
.history-icon { color: #8f9bb5; font-size: 12px; margin-top: 2px; }
.history-text { min-width: 0; flex: 1; }
.history-item.active { background: #eef4ff; }
.history-title { display: flex; justify-content: space-between; gap: 8px; font-weight: 600; margin-bottom: 7px; font-size: 13px; }
.history-title span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-title span:last-child { flex-shrink: 0; color: #94a0b8; font-size: 12px; }
.history-desc, .history-empty { font-size: 12px; color: #8d96a8; line-height: 1.6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-card { display: flex; align-items: center; gap: 12px; padding-top: 8px; }
.user-card img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.name { font-weight: 600; font-size: 13px; }
.role { color: #94a0b8; margin-top: 4px; font-size: 12px; }
.chat-area { flex: 1; display: flex; flex-direction: column; padding: 22px; }
.chat-header { background: white; border-radius: 16px; padding: 22px 27px; box-shadow: 0 6px 30px rgba(40, 70, 120, 0.04); }
.chat-title { display: flex; align-items: center; gap: 14px; }
.ai-avatar, .msg-avatar { background: #eef4ff; color: #4f7cff; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.ai-avatar { width: 50px; height: 50px; border-radius: 50%; font-size: 16px; }
.chat-title h2 { margin: 0; font-size: 27px; }
.chat-title p { margin-top: 6px; color: #8f98ac; font-size: 13px; }
.chat-content { flex: 1; overflow-y: auto; padding: 25px 9px; }
.message-row { display: flex; margin-bottom: 16px; }
.message-row.right { justify-content: flex-end; }
.msg-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; font-size: 12px; }
.message { max-width: 72%; padding: 14px; border-radius: 14px; box-shadow: 0 6px 20px rgba(40, 70, 120, 0.04); }
.message.ai { background: white; }
.message.user { background: #edf4ff; max-width: min(520px, 70%); }
.msg-text { line-height: 1.8; color: #2b3550; font-size: 13px; }
.msg-text :deep(p) { margin: 0 0 8px; }
.msg-text :deep(ul), .msg-text :deep(ol) { margin: 0 0 8px 18px; padding: 0; }
.msg-text :deep(code) { background: #f2f5ff; padding: 2px 4px; border-radius: 4px; }
.msg-text :deep(pre) { background: #f5f7fd; padding: 10px; border-radius: 8px; overflow-x: auto; }
.user-msg-text {
  max-height: 7.2em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  word-break: break-word;
}
.user-msg-text :deep(p:last-child) { margin-bottom: 0; }
.user-msg-expanded {
  max-height: none;
  overflow: visible;
  display: block;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}
.user-msg-code {
  display: block;
  max-width: 100%;
  max-height: 4.2em;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  word-break: normal;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}
.user-msg-code::-webkit-scrollbar { height: 6px; }
.user-msg-code::-webkit-scrollbar-thumb { background: rgba(126, 145, 185, 0.45); border-radius: 999px; }
.user-msg-code :deep(*) { white-space: nowrap !important; word-break: normal !important; }
.user-msg-code :deep(p) { margin: 0; display: inline; }
.user-msg-code :deep(code) {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
}
.user-msg-code.user-msg-expanded {
  max-height: none;
  overflow-x: auto;
}
.msg-expand-btn {
  margin-top: 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: #4f7cff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.msg-expand-btn:hover {
  color: #345fd6;
  text-decoration: underline;
}
.msg-time { margin-top: 10px; color: #9aa3b6; font-size: 12px; }
.chat-input { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 6px 30px rgba(40, 70, 120, 0.04); }
.chat-input textarea { width: 100%; height: 81px; border: none; resize: none; outline: none; font-size: 14px; font-family: inherit; }
.input-bottom { display: flex; justify-content: flex-end; margin-top: 14px; }
.send-btn { border: none; border-radius: 12px; background: linear-gradient(135deg, #9bb5ff, #6e8dff); color: white; font-size: 14px; padding: 10px 16px; cursor: pointer; }
.send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.sidebar-right { width: 320px; background: #f6f7fb; border-left: 1px solid #eef1f7; padding: 18px 14px; overflow-y: auto; }
.docs-top { display: flex; align-items: center; justify-content: space-between; }
.docs-top h3 { margin: 0; font-size: 30px; font-weight: 700; color: #202c46; }
.new-btn { border: none; border-radius: 14px; background: #e9efff; color: #4f7cff; font-size: 13px; font-weight: 600; padding: 7px 12px; cursor: pointer; }
.doc-tabs { display: flex; margin-top: 16px; border-bottom: 1px solid #e4e8f2; }
.tab-btn { flex: 1; padding: 12px 0; border: none; background: transparent; color: #7f8aa4; font-size: 16px; font-weight: 600; cursor: pointer; position: relative; }
.tab-btn.active { color: #4f7cff; }
.tab-btn.active::after { content: ""; position: absolute; left: 18%; right: 18%; bottom: -1px; height: 3px; border-radius: 2px; background: #4f7cff; }
.doc-cards { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.doc-empty { color: #8d96a8; font-size: 13px; background: #fff; border: 1px dashed #dce4f7; border-radius: 12px; padding: 12px; }
.doc-card { width: 100%; display: flex; align-items: center; gap: 12px; border: 1px solid #eef1f7; border-radius: 14px; padding: 12px; background: #fff; text-align: left; cursor: pointer; }
.doc-card:hover { border-color: #d4def8; box-shadow: 0 4px 12px rgba(79, 124, 255, 0.08); }
.doc-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; }
.icon-doc { background: #5a8cff; }
.icon-pdf { background: #f35c5c; }
.icon-xls { background: #45b86f; }
.icon-ppt { background: #f2a34b; }
.icon-file { background: #8c77f0; }
.doc-main { flex: 1; min-width: 0; }
.doc-name { font-size: 14px; color: #293552; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doc-sub { margin-top: 4px; display: flex; gap: 14px; color: #9aa3b7; font-size: 12px; }
.doc-more { color: #b5bed2; font-size: 18px; line-height: 1; }
@media (max-width: 1400px) { .sidebar-right { display: none; } }
@media (max-width: 1000px) { .sidebar-left { display: none; } }
</style>
