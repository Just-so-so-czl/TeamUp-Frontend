<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { Mail, UserRound, Lock, VenusAndMars, Image, UserPlus } from 'lucide-vue-next'

import avatar1 from '@/assets/avatar/a1.png'
import avatar2 from '@/assets/avatar/a2.png'
import avatar3 from '@/assets/avatar/a3.png'
import avatar4 from '@/assets/avatar/a4.png'
import avatar5 from '@/assets/avatar/a5.png'
import avatar6 from '@/assets/avatar/a6.png'
import avatar7 from '@/assets/avatar/a7.png'
import avatar8 from '@/assets/avatar/a8.png'

const router = useRouter()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const gender = ref<number>(1)
const avatar = ref<number>(1)
const loading = ref(false)
const errorMessage = ref('')

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

const availableAvatars = computed(() => (gender.value === 1 ? [1, 2, 3, 4] : [5, 6, 7, 8]))
const passwordMatched = computed(() => confirmPassword.value.length > 0 && password.value === confirmPassword.value)
const canSubmit = computed(() => {
  return (
    email.value.trim().length > 0 &&
    username.value.trim().length >= 2 &&
    password.value.length >= 8 &&
    passwordMatched.value &&
    availableAvatars.value.includes(avatar.value) &&
    !loading.value
  )
})

const onGenderChange = (selectedGender: number) => {
  gender.value = selectedGender
  avatar.value = selectedGender === 1 ? 1 : 5
}

const handleRegister = async () => {
  if (!canSubmit.value) {
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    await register({
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      gender: gender.value,
      avatar: avatar.value,
    })
    await router.push('/login')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <div class="decor decor-left" aria-hidden="true"></div>
    <div class="decor decor-right" aria-hidden="true"></div>

    <section class="auth-shell register-shell">
      <section class="form-card">
        <h2>创建 TeamUp 账号</h2>
        <p class="sub">填写信息，加入你的学习协作小组</p>

        <form class="form" @submit.prevent="handleRegister">
          <label for="email">邮箱</label>
          <div class="field">
            <Mail class="i" />
            <input id="email" v-model="email" type="email" required placeholder="name@teamup.com" />
          </div>

          <label for="username">用户名</label>
          <div class="field">
            <UserRound class="i" />
            <input id="username" v-model="username" type="text" required minlength="2" maxlength="20" placeholder="请输入用户名" />
          </div>

          <label for="password">密码</label>
          <div class="field">
            <Lock class="i" />
            <input id="password" v-model="password" type="password" required minlength="8" placeholder="8-32位密码" />
          </div>

          <label for="confirmPassword">确认密码</label>
          <div class="field">
            <Lock class="i" />
            <input id="confirmPassword" v-model="confirmPassword" type="password" required minlength="8" placeholder="请再次输入密码" />
          </div>
          <p v-if="confirmPassword" :class="passwordMatched ? 'hint-ok' : 'hint-err'">
            {{ passwordMatched ? '两次密码一致' : '两次密码不一致' }}
          </p>

          <label>性别</label>
          <div class="chips">
            <button type="button" class="chip" :class="{ active: gender === 1 }" @click="onGenderChange(1)">
              <VenusAndMars class="i" /> 男生
            </button>
            <button type="button" class="chip" :class="{ active: gender === 2 }" @click="onGenderChange(2)">
              <VenusAndMars class="i" /> 女生
            </button>
          </div>

          <label>头像选择</label>
          <div class="avatar-grid">
            <button
              v-for="item in availableAvatars"
              :key="item"
              class="avatar-btn"
              type="button"
              :class="{ active: avatar === item }"
              @click="avatar = item"
            >
              <img :src="avatarMap[item]" :alt="`avatar-${item}`" />
              <span><Image class="i" /> a{{ item }}</span>
            </button>
          </div>

          <p v-if="errorMessage" class="hint-err">{{ errorMessage }}</p>

          <button class="submit" type="submit" :disabled="!canSubmit">
            <span v-if="!loading">注册 <UserPlus class="i" /></span>
            <span v-else>注册中...</span>
          </button>
        </form>

        <p class="switch">
          已有账号？
          <router-link to="/login">去登录</router-link>
        </p>
      </section>

      <aside class="hero-card">
        <p class="hero-tag">TeamUp · 协作更有温度</p>
        <h1>从今天开始，和伙伴一起更高效地学习</h1>
        <p>创建账号后，你可以管理小组任务、实时协作文档，并获得智能导师支持。</p>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 20px;
  display: grid;
  place-items: center;
  background: linear-gradient(170deg, #fff4e2 0%, #e9f8ff 56%, #ecffe9 100%);
  position: relative;
  overflow: hidden;
}

.decor {
  position: absolute;
  border-radius: 999px;
  filter: blur(48px);
  opacity: 0.58;
}

.decor-left {
  width: 250px;
  height: 250px;
  left: -100px;
  top: -80px;
  background: #ffc280;
}

.decor-right {
  width: 300px;
  height: 300px;
  right: -120px;
  bottom: -100px;
  background: #9cd8ff;
}

.auth-shell {
  width: min(1040px, 100%);
  border-radius: 28px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(28, 88, 122, 0.14);
  box-shadow: 0 24px 60px rgba(28, 88, 122, 0.15);
  position: relative;
  z-index: 1;
}

.register-shell .form-card {
  order: 1;
}

.form-card {
  padding: 34px;
}

.form-card h2 {
  color: #1f4055;
  font-size: 26px;
  font-weight: 700;
}

.sub {
  margin-top: 8px;
  margin-bottom: 18px;
  color: #4f6a79;
  font-size: 14px;
}

.form {
  display: grid;
  gap: 11px;
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
  border: 1px solid #ccdae2;
  background: #f8fbff;
  padding: 0 12px;
}

.field:focus-within {
  border-color: #1f86aa;
  box-shadow: 0 0 0 3px rgba(31, 134, 170, 0.18);
}

input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  padding: 11px 0;
  font-size: 14px;
  color: #1f4154;
}

.chips {
  display: flex;
  gap: 10px;
}

.chip {
  border: 1px solid #d1dee8;
  background: #f8fbff;
  border-radius: 999px;
  padding: 8px 14px;
  color: #345465;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip.active {
  border-color: #1f86aa;
  color: #1b7598;
  background: #e9f7ff;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.avatar-btn {
  border: 1px solid #d2dfe9;
  border-radius: 14px;
  background: #f9fcff;
  padding: 8px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  justify-items: center;
}

.avatar-btn img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-btn span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #557181;
}

.avatar-btn.active {
  border-color: #ff8b54;
  background: #fff2e9;
}

.hint-ok {
  color: #15803d;
  font-size: 13px;
}

.hint-err {
  color: #c2410c;
  font-size: 13px;
}

.submit {
  margin-top: 4px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(120deg, #ff9f45, #ff7b46);
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
  margin-top: 14px;
  text-align: center;
  color: #53707f;
}

.switch a {
  color: #1f7ca4;
  font-weight: 600;
}

.hero-card {
  background: linear-gradient(150deg, #1f90af, #26b297);
  color: #f3fdff;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}

.hero-tag {
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  padding: 8px 12px;
  font-size: 12px;
}

.hero-card h1 {
  font-size: clamp(28px, 2.8vw, 34px);
  line-height: 1.22;
  font-weight: 700;
}

.hero-card p {
  font-size: 15px;
  line-height: 1.8;
}

.i {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

@media (max-width: 980px) {
  .auth-shell {
    grid-template-columns: 1fr;
    max-width: 620px;
  }

  .hero-card {
    order: 0;
    padding: 28px;
  }

  .form-card {
    order: 1;
    padding: 28px;
  }
}

@media (max-width: 520px) {
  .avatar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
