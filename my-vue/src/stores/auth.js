import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 认证状态：从 localStorage 初始化，刷新后保持登录态
const token = ref(localStorage.getItem('token') || '')
const username = ref(localStorage.getItem('username') || '')

export function useAuth() {
  const router = useRouter()
  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // 登录：保存 token 与用户名到状态及本地存储
  function login(newToken, newName) {
    token.value = newToken
    username.value = newName
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newName)
  }

  // 退出：清空状态与本地存储，并跳转登录页
  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    router.push('/login')
  }

  // 返回带认证信息的请求头
  function getAuthHeaders() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return { token, username, isLoggedIn, login, logout, getAuthHeaders }
}
