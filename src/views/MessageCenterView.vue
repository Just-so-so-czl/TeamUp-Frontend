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
  background: linear-gradient(145deg, #eefaf7 0%, #e5f5fb 55%, #f5fcfb 100%);
  color: #1f4f4f;
}

.message-hero {
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

.message-hero h1 {
  margin: 14px 0 0;
  font-size: 30px;
  color: #1f5656;
}

.message-hero p {
  margin: 8px 0 0;
  color: #4f7e7f;
  line-height: 1.7;
}

.message-panel {
  margin-top: 16px;
  border-radius: 18px;
  border: 1px solid #d4eaed;
  background: rgba(255, 255, 255, 0.95);
  padding: 18px;
  box-shadow: 0 8px 18px rgba(115, 176, 180, 0.14);
}

.message-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-btn {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #bfdfe7;
  background: #f6fcfd;
  color: #2b6668;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.tab-btn.active {
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
  border-color: #3eb8c7;
  color: #fff;
}

.status-tip {
  margin-top: 14px;
  color: #537e82;
  font-size: 13px;
}

.status-tip.error {
  color: #b45309;
}

.message-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-item {
  border: 1px solid #d6ebef;
  background: #f8fdfd;
  border-radius: 12px;
  padding: 12px;
}

.message-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.message-head h3 {
  margin: 0;
  font-size: 15px;
  color: #245657;
}

.message-head span {
  font-size: 12px;
  color: #5f8a8c;
  white-space: nowrap;
}

.message-content {
  margin: 8px 0 10px;
  color: #3f6b71;
  font-size: 14px;
  line-height: 1.6;
}

.message-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.message-foot span {
  font-size: 12px;
  color: #4f7f86;
}

.process-btn {
  border: 1px solid #abd5db;
  background: #eefbfd;
  color: #2e6f79;
  border-radius: 9px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.process-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  .message-page {
    padding: 16px;
  }

  .message-tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
  }
}
</style>
