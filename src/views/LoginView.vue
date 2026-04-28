<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, login } from '@/api/auth'
import type { StoredLoginUser } from '@/utils/authUser'
import { saveStoredLoginUser, saveStoredToken } from '@/utils/authUser'
import { Lock, LogIn, Mail, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0 && !loading.value)

const redirectReason = typeof route.query.reason === 'string' ? route.query.reason : ''
if (redirectReason === 'token_expired') {
  errorMessage.value = '登录已过期，请重新登录'
} else if (redirectReason === 'token_invalid') {
  errorMessage.value = '登录状态无效，请重新登录'
}

const handleLogin = async () => {
  if (!canSubmit.value) {
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await login({
      email: email.value.trim(),
      password: password.value,
    })
    const storedUser: StoredLoginUser = {
      id: data.user.id,
      name: data.user.username,
      email: data.user.email,
      avatar: data.user.avatar,
    }
    saveStoredToken(data.token)
    saveStoredLoginUser(storedUser)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.push(redirect)
  } catch (error) {
    if (error instanceof ApiError && error.errorType === 'TOKEN_EXPIRED') {
      errorMessage.value = '登录已过期，请重新登录'
    } else if (error instanceof ApiError && error.errorType === 'TOKEN_INVALID') {
      errorMessage.value = '登录状态无效，请重新登录'
    } else {
      errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <div class="decor decor-left" aria-hidden="true"></div>
    <div class="decor decor-right" aria-hidden="true"></div>

    <section class="auth-shell">
      <aside class="hero-card">
        <p class="hero-tag"><Sparkles class="i" /> TeamUp 学习协作助手</p>
        <h1>欢迎回来，继续和小组一起冲刺目标</h1>
        <p>任务同步、文档协同、知识问答都在这里。登录后马上回到你的学习战场。</p>
      </aside>

      <section class="form-card">
        <h2>邮箱登录</h2>
        <p class="sub">输入邮箱和密码，开启今天的协作节奏</p>

        <form @submit.prevent="handleLogin" class="form">
          <label for="email">邮箱</label>
          <div class="field">
            <Mail class="i" />
            <input id="email" v-model="email" type="email" required placeholder="name@teamup.com" />
          </div>

          <label for="password">密码</label>
          <div class="field">
            <Lock class="i" />
            <input id="password" v-model="password" type="password" required placeholder="请输入密码" />
          </div>

          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

          <button class="submit" type="submit" :disabled="!canSubmit">
            <span v-if="!loading">登录 <LogIn class="i" /></span>
            <span v-else>登录中...</span>
          </button>
        </form>

        <p class="switch">
          还没有账号？
          <router-link to="/register">去注册</router-link>
        </p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 20px;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, #fff5e8 0%, #e8f7ff 52%, #ecffe7 100%);
  position: relative;
  overflow: hidden;
}

.decor {
  position: absolute;
  border-radius: 999px;
  filter: blur(48px);
  opacity: 0.6;
}

.decor-left {
  width: 260px;
  height: 260px;
  left: -90px;
  top: -70px;
  background: #ffc77a;
}

.decor-right {
  width: 320px;
  height: 320px;
  right: -130px;
  bottom: -120px;
  background: #8fd8ff;
}

.auth-shell {
  width: min(980px, 100%);
  border-radius: 28px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(28, 88, 122, 0.12);
  box-shadow: 0 26px 60px rgba(28, 88, 122, 0.15);
  position: relative;
  z-index: 1;
}

.hero-card {
  background: linear-gradient(150deg, #1e8cab, #27b29d);
  color: #f3fdff;
  padding: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.hero-tag {
  display: inline-flex;
  width: fit-content;
  gap: 8px;
  align-items: center;
  border-radius: 999px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  font-size: 12px;
}

.hero-card h1 {
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1.22;
  font-weight: 700;
}

.hero-card p {
  font-size: 15px;
  line-height: 1.8;
}

.form-card {
  padding: 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-card h2 {
  color: #1f3f54;
  font-size: 26px;
  font-weight: 700;
}

.sub {
  margin-top: 8px;
  margin-bottom: 20px;
  color: #4f6a78;
  font-size: 14px;
}

.form {
  display: grid;
  gap: 12px;
}

label {
  color: #325667;
  font-size: 14px;
  font-weight: 600;
}

.field {
  display: flex;
  gap: 8px;
  align-items: center;
  border-radius: 14px;
  border: 1px solid #c9dae5;
  padding: 0 12px;
  background: #f8fbff;
}

.field:focus-within {
  border-color: #1e8cab;
  box-shadow: 0 0 0 3px rgba(30, 140, 171, 0.18);
}

input {
  border: none;
  outline: none;
  width: 100%;
  padding: 12px 0;
  font-size: 14px;
  color: #1f4154;
  background: transparent;
}

.error {
  color: #c2410c;
  font-size: 13px;
}

.submit {
  margin-top: 4px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(120deg, #ff9f45, #ff7c48);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 16px;
  cursor: pointer;
}

.submit:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.submit span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.switch {
  margin-top: 16px;
  text-align: center;
  color: #53707f;
}

.switch a {
  color: #1f7ca4;
  font-weight: 600;
}

.i {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@media (max-width: 920px) {
  .auth-shell {
    grid-template-columns: 1fr;
    max-width: 560px;
  }

  .hero-card {
    padding: 28px;
  }

  .form-card {
    padding: 28px;
  }
}
</style>


