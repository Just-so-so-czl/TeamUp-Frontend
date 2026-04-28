import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import TeamDetailView from '../views/TeamDetailView.vue'
import MessageCenterView from '../views/MessageCenterView.vue'
import { ApiError, fetchCurrentUser } from '@/api/auth'
import { clearAuthStorage, getStoredLoginUser, getStoredToken, saveStoredLoginUser } from '@/utils/authUser'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: '登录 - TeamUp' },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { title: '注册 - TeamUp' },
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { title: '首页 - TeamUp' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: '工作台 - TeamUp' },
    },
    {
      path: '/teams/:id',
      name: 'team-detail',
      component: TeamDetailView,
      meta: { title: '小组详情 - TeamUp' },
    },
    {
      path: '/messages',
      name: 'message-center',
      component: MessageCenterView,
      meta: { title: '消息中心 - TeamUp' },
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

router.afterEach((to) => {
  if (typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
})

router.beforeEach(async (to) => {
  const isPublicPage = to.path === '/login' || to.path === '/register'
  if (isPublicPage) {
    return true
  }

  const token = getStoredToken()
  if (!token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }
  if (!getStoredLoginUser()) {
    try {
      const user = await fetchCurrentUser()
      saveStoredLoginUser({
        id: user.id,
        name: user.username,
        email: user.email,
        avatar: user.avatar,
      })
    } catch (error) {
      clearAuthStorage()
      let reason = 'unauthorized'
      if (error instanceof ApiError) {
        if (error.errorType === 'TOKEN_EXPIRED') {
          reason = 'token_expired'
        } else if (error.errorType === 'TOKEN_INVALID') {
          reason = 'token_invalid'
        }
      }
      return {
        path: '/login',
        query: { redirect: to.fullPath, reason },
      }
    }
  }
  return true
})

export default router
