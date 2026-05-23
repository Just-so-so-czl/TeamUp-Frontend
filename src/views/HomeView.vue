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
    <div class="bg a"></div>
    <div class="bg b"></div>

    <section class="card">
      <p class="kicker">WELCOME BACK</p>
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
  background: linear-gradient(160deg, #fff8ef 0%, #f5f3ff 54%, #eef8ff 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.bg {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.bg.a {
  width: 360px;
  height: 360px;
  left: -120px;
  top: -100px;
  background: radial-gradient(circle, rgba(236, 93, 43, 0.24) 0%, rgba(236, 93, 43, 0) 70%);
}

.bg.b {
  width: 420px;
  height: 420px;
  right: -140px;
  bottom: -140px;
  background: radial-gradient(circle, rgba(32, 124, 235, 0.2) 0%, rgba(32, 124, 235, 0) 72%);
}

.card {
  position: relative;
  z-index: 1;
  width: min(700px, 100%);
  border-radius: 30px;
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 250, 244, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.76);
  box-shadow: 0 26px 54px rgba(28, 41, 74, 0.18);
  padding: 34px;
}

.kicker {
  margin: 0 0 10px;
  color: #896783;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

h1 {
  margin: 0;
  color: #25233a;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
}

p {
  color: #5a6172;
  margin-top: 12px;
}

button {
  margin-top: 20px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(130deg, #f4a736, #e95f2b);
  color: #fff;
  font-weight: 700;
  padding: 11px 16px;
  cursor: pointer;
}
</style>
