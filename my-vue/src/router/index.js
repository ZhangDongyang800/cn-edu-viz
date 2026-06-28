import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import TrendPrediction from '../views/TrendPrediction.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  // 旧路由重定向到 /dashboard
  { path: '/overview', redirect: '/dashboard' },
  { path: '/national-trend', redirect: '/dashboard' },
  { path: '/provincial-compare', redirect: '/dashboard' },
  { path: '/structure-analysis', redirect: '/dashboard' },
  { path: '/trend-prediction', name: 'TrendPrediction', component: TrendPrediction },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, guestOnly: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  if (!isLoggedIn && !to.meta.public) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (isLoggedIn && to.meta.guestOnly) {
    return { path: '/dashboard' }
  }

  return true
})

export default router
