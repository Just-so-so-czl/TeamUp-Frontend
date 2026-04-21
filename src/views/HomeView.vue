<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearAuthStorage, getStoredLoginUser } from '@/utils/authUser'

const router = useRouter()

const user = computed(() => getStoredLoginUser())

const logout = async () => {
  clearAuthStorage()
  await router.push('/login')
}
</script>

<template>
  <main class="home-page">
    <section class="card">
      <h1>登录成功，欢迎来到 TeamUp</h1>
      <p v-if="user">当前用户：{{ user.name }}（{{ user.email }}）</p>
      <p v-else>未读取到本地用户信息</p>
      <button @click="logout">退出登录</button>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #fff5e8, #eaf8ff, #ecffe8);
  padding: 20px;
}

.card {
  width: min(680px, 100%);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(28, 88, 122, 0.14);
  box-shadow: 0 22px 48px rgba(28, 88, 122, 0.14);
  padding: 30px;
}

h1 {
  color: #1f4154;
  font-size: 30px;
  font-weight: 700;
}

p {
  color: #4d6878;
  margin-top: 12px;
}

button {
  margin-top: 18px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(120deg, #ff9f45, #ff7c48);
  color: #fff;
  font-weight: 600;
  padding: 10px 14px;
  cursor: pointer;
}
</style>
