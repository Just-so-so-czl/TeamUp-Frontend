<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyMessages, processMessage, type TeamMessageItem } from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const activeTab = ref<'all' | 'pending'>('all')
const processingMessageId = ref('')
const allMessages = ref<TeamMessageItem[]>([])
const pendingMessages = ref<TeamMessageItem[]>([])

const formatMessageTime = (value: string) => {
  if (!value) {
    return '--'
  }
  return value.replace('T', ' ').slice(0, 16)
}

const loadMessages = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await fetchMyMessages()
    allMessages.value = result.allMessages || []
    pendingMessages.value = result.pendingMessages || []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '加载消息失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const currentMessages = computed(() => {
  return activeTab.value === 'all' ? allMessages.value : pendingMessages.value
})

const handleProcessMessage = async (item: TeamMessageItem) => {
  processingMessageId.value = item.messageId
  try {
    if (item.relatedUrl) {
      await router.push(item.relatedUrl)
    }
    await processMessage(item.messageId)
    await loadMessages()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '处理消息失败，请稍后重试'
  } finally {
    processingMessageId.value = ''
  }
}

const goDashboard = async () => {
  await router.push('/dashboard')
}

onMounted(async () => {
  await loadMessages()
})
</script>

<template>
  <main class="message-page">
    <div class="bg a"></div>
    <div class="bg b"></div>

    <section class="message-hero">
      <button class="back-btn" type="button" @click="goDashboard">返回工作台</button>
      <h1>消息中心</h1>
      <p>查看小组通知与待处理事项，保持协作节奏同步。</p>
    </section>

    <section class="message-panel">
      <div class="message-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'all' }" type="button" @click="activeTab = 'all'">
          全部消息（{{ allMessages.length }}）
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'pending' }" type="button" @click="activeTab = 'pending'">
          待处理（{{ pendingMessages.length }}）
        </button>
      </div>

      <p v-if="loading" class="status-tip">正在加载消息...</p>
      <p v-else-if="errorMessage" class="status-tip error">{{ errorMessage }}</p>
      <p v-else-if="currentMessages.length === 0" class="status-tip">暂无消息</p>

      <div v-else class="message-list">
        <article v-for="item in currentMessages" :key="item.messageId" class="message-item">
          <div class="message-head">
            <h3>{{ item.title }}</h3>
            <span>{{ formatMessageTime(item.messageTime) }}</span>
          </div>
          <p class="message-content">{{ item.content }}</p>
          <div class="message-foot">
            <span>小组：{{ item.teamName }}</span>
            <button
              class="process-btn"
              type="button"
              :disabled="item.isProcessed === 1 || processingMessageId === item.messageId"
              @click="handleProcessMessage(item)"
            >
              {{ item.isProcessed === 1 ? '已处理' : processingMessageId === item.messageId ? '处理中...' : '去处理' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.message-page {
  min-height: 100vh;
  padding: 24px 28px 30px;
  background: linear-gradient(145deg, #fff8ef 0%, #f4f3ff 55%, #eef8ff 100%);
  color: #25273a;
  position: relative;
  overflow: hidden;
}
.bg { position: absolute; border-radius: 50%; pointer-events: none; }
.bg.a { width: 320px; height: 320px; left: -120px; top: -100px; background: radial-gradient(circle, rgba(232, 93, 42, 0.2) 0%, rgba(232, 93, 42, 0) 70%); }
.bg.b { width: 380px; height: 380px; right: -140px; bottom: -140px; background: radial-gradient(circle, rgba(31, 124, 240, 0.18) 0%, rgba(31, 124, 240, 0) 72%); }
.message-hero {
  position: relative;
  z-index: 1;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 251, 246, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 18px 36px rgba(30, 43, 82, 0.14);
}
.back-btn {
  height: 38px;
  border: 1px solid #e7ddce;
  background: #fff;
  color: #5a556f;
  border-radius: 12px;
  padding: 0 12px;
  font-weight: 700;
  cursor: pointer;
}
.message-hero h1 { margin: 14px 0 0; font-size: 32px; color: #29253f; }
.message-hero p { margin: 8px 0 0; color: #646d7f; line-height: 1.7; }
.message-panel {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.76);
  background: rgba(255, 255, 255, 0.9);
  padding: 18px;
  box-shadow: 0 14px 28px rgba(33, 45, 81, 0.12);
}
.message-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
.tab-btn {
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e4d9cc;
  background: #fff;
  color: #5a5968;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.tab-btn.active {
  background: linear-gradient(135deg, #f4a736 0%, #e85d2a 100%);
  border-color: transparent;
  color: #fff;
}
.status-tip { margin-top: 14px; color: #6a7284; font-size: 13px; }
.status-tip.error { color: #b45309; }
.message-list { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.message-item {
  border: 1px solid #eee6da;
  background: linear-gradient(160deg, #fff 0%, #fffbf7 100%);
  border-radius: 14px;
  padding: 12px;
}
.message-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.message-head h3 { margin: 0; font-size: 15px; color: #2a2a3f; }
.message-head span { font-size: 12px; color: #7a8090; white-space: nowrap; }
.message-content { margin: 8px 0 10px; color: #555e71; font-size: 14px; line-height: 1.6; }
.message-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.message-foot span { font-size: 12px; color: #6c7284; }
.process-btn {
  border: 1px solid #e7dcca;
  background: #fff;
  color: #5f5a77;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.process-btn:disabled { opacity: 0.65; cursor: not-allowed; }
@media (max-width: 980px) {
  .message-page { padding: 16px; }
  .message-tabs { flex-direction: column; }
  .tab-btn { width: 100%; }
}
</style>
