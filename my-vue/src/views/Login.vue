<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { login } = useAuth()

// 登录/注册模式切换
const isRegister = ref(false)

// 表单数据
const usernameInput = ref('')
const passwordInput = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

// 切换模式时清空表单
function toggleMode() {
  isRegister.value = !isRegister.value
  errorMsg.value = ''
  usernameInput.value = ''
  passwordInput.value = ''
  confirmPassword.value = ''
}

// 提交登录
async function handleLogin() {
  errorMsg.value = ''
  if (!usernameInput.value || !passwordInput.value) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || '登录失败')
    }
    const data = await res.json()
    login(data.token, data.username || usernameInput.value)
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 提交注册
async function handleRegister() {
  errorMsg.value = ''
  if (!usernameInput.value || !passwordInput.value) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  if (usernameInput.value.length < 2) {
    errorMsg.value = '用户名至少 2 个字符'
    return
  }
  if (passwordInput.value.length < 4) {
    errorMsg.value = '密码至少 4 个字符'
    return
  }
  if (passwordInput.value !== confirmPassword.value) {
    errorMsg.value = '两次密码输入不一致'
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || '注册失败')
    }
    const data = await res.json()
    // 注册成功直接登录
    login(data.token, data.username || usernameInput.value)
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 统一提交
function handleSubmit() {
  isRegister.value ? handleRegister() : handleLogin()
}
</script>

<template>
  <div class="login-page">
    <div class="login-card chart">
      <header class="login-head">
        <h1 class="login-logo">EDU·VIZ</h1>
        <p class="login-sub">中国十年教育数据分析与可视化</p>
      </header>

      <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field-label" for="username">用户名</label>
          <input
            id="username"
            v-model="usernameInput"
            class="field-input"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>
        <div class="field">
          <label class="field-label" for="password">密码</label>
          <input
            id="password"
            v-model="passwordInput"
            class="field-input"
            type="password"
            :placeholder="isRegister ? '至少 4 个字符' : '请输入密码'"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
          />
        </div>
        <!-- 注册模式下显示确认密码 -->
        <div v-if="isRegister" class="field">
          <label class="field-label" for="confirm">确认密码</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            class="field-input"
            type="password"
            placeholder="请再次输入密码"
            autocomplete="new-password"
          />
        </div>
        <button class="login-btn" type="submit" :disabled="loading">
          {{ loading ? (isRegister ? '注册中…' : '登录中…') : (isRegister ? '注册' : '登录') }}
        </button>
      </form>

      <!-- 登录/注册切换 -->
      <div class="login-switch">
        <span v-if="isRegister">已有账号？</span>
        <span v-else>没有账号？</span>
        <button class="switch-btn" @click="toggleMode">
          {{ isRegister ? '去登录' : '去注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 36px 32px;
}

.login-head {
  text-align: center;
  margin-bottom: 28px;
}
.login-logo {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #0f172a;
}
.login-sub {
  margin-top: 8px;
  font-size: 13px;
  color: #64748b;
}

.login-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.field-input {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.field-input::placeholder { color: #94a3b8; }
.field-input:focus {
  outline: none;
  border-color: #0f172a;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.08);
}
.field-input:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.login-btn {
  margin-top: 4px;
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  background: #0f172a;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color .2s ease;
}
.login-btn:hover:not(:disabled) { background: #1e293b; }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.login-btn:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

/* 登录/注册切换链接 */
.login-switch {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}
.switch-btn {
  background: none;
  border: none;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.switch-btn:hover { color: #1e293b; }

@media (max-width: 640px) {
  .login-card { padding: 28px 20px; }
  .login-logo { font-size: 24px; }
}
</style>
