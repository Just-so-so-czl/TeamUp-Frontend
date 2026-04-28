<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStoredToken } from '@/utils/authUser'

interface WsNotifyPayload {
  type?: string
  title?: string
  content?: string
}

const route = useRoute()
const router = useRouter()
const wsClient = ref<WebSocket | null>(null)
const realtimeNoticeVisible = ref(false)
const realtimeNoticeTitle = ref('')
const realtimeNoticeContent = ref('')
let realtimeNoticeTimer: number | undefined

const isPublicRoute = (path: string) => path === '/login' || path === '/register'

const clearRealtimeNoticeTimer = () => {
  if (realtimeNoticeTimer) {
    window.clearTimeout(realtimeNoticeTimer)
    realtimeNoticeTimer = undefined
  }
}

const showRealtimeNotice = (title: string, content: string) => {
  clearRealtimeNoticeTimer()
  realtimeNoticeTitle.value = title || '新消息提醒'
  realtimeNoticeContent.value = content || '你有一条新的小组消息，请及时查看。'
  realtimeNoticeVisible.value = true
  realtimeNoticeTimer = window.setTimeout(() => {
    realtimeNoticeVisible.value = false
  }, 5200)
}

const closeRealtimeNotice = () => {
  clearRealtimeNoticeTimer()
  realtimeNoticeVisible.value = false
}

const closeRealtimeSocket = () => {
  const client = wsClient.value
  wsClient.value = null
  if (!client) {
    return
  }
  if (client.readyState === WebSocket.OPEN || client.readyState === WebSocket.CONNECTING) {
    client.close()
  }
}

const connectRealtimeSocket = () => {
  const token = getStoredToken()
  if (!token || isPublicRoute(route.path)) {
    closeRealtimeSocket()
    return
  }
  if (wsClient.value && (wsClient.value.readyState === WebSocket.OPEN || wsClient.value.readyState === WebSocket.CONNECTING)) {
    return
  }
  const wsUrl = `ws://localhost:8080/ws-notify?token=${encodeURIComponent(token)}`
  const client = new WebSocket(wsUrl)
  wsClient.value = client
  client.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as WsNotifyPayload
      if (payload.type === 'NEW_TEAM_MESSAGE' && !isPublicRoute(route.path)) {
        showRealtimeNotice(payload.title ?? '新的入组申请', payload.content ?? '你有新的小组消息')
      }
    } catch {
      // ignore invalid payload
    }
  }
  client.onclose = () => {
    if (wsClient.value === client) {
      wsClient.value = null
    }
  }
}

const syncRealtimeByRoute = () => {
  if (isPublicRoute(route.path)) {
    closeRealtimeSocket()
    closeRealtimeNotice()
    return
  }
  connectRealtimeSocket()
}

const goMessageFromNotice = async () => {
  closeRealtimeNotice()
  await router.push('/messages')
}

watch(
  () => route.path,
  () => {
    syncRealtimeByRoute()
  },
)

onMounted(() => {
  syncRealtimeByRoute()
})

onBeforeUnmount(() => {
  closeRealtimeSocket()
  closeRealtimeNotice()
})
</script>

<template>
  <router-view />
  <transition name="notice-fade">
    <div
      v-if="realtimeNoticeVisible"
      class="realtime-notice"
      role="button"
      tabindex="0"
      @click="goMessageFromNotice"
    >
      <div class="notice-label">消息提醒</div>
      <div class="notice-title">{{ realtimeNoticeTitle }}</div>
      <p class="notice-content">{{ realtimeNoticeContent }}</p>
      <div class="notice-action">点击查看消息中心</div>
    </div>
  </transition>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.realtime-notice {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1600;
  width: min(380px, calc(100vw - 30px));
  border-radius: 16px;
  border: 1px solid #a9dde8;
  background: linear-gradient(145deg, #f3fbff 0%, #f0fbf7 100%);
  box-shadow: 0 18px 36px rgba(44, 124, 136, 0.24);
  padding: 14px 16px;
  cursor: pointer;
}

.notice-label {
  display: inline-block;
  border-radius: 999px;
  border: 1px solid #b6dce8;
  background: #ffffff;
  color: #3b7583;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
}

.notice-title {
  margin-top: 8px;
  color: #1f5d66;
  font-size: 15px;
  font-weight: 800;
}

.notice-content {
  margin: 6px 0 8px;
  color: #3f6f77;
  font-size: 13px;
  line-height: 1.5;
}

.notice-action {
  color: #2c8290;
  font-size: 12px;
  font-weight: 700;
}

.notice-fade-enter-active,
.notice-fade-leave-active {
  transition: opacity 1.8s ease, transform 1.8s ease;
}

.notice-fade-enter-from,
.notice-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
