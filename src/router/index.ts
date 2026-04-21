import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import TeamDetailView from '../views/TeamDetailView.vue'

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

export default router
