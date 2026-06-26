<script setup>
import { useRoute } from 'vue-router'
import { useAuth } from './stores/auth'

const route = useRoute()
const { username, isLoggedIn, logout } = useAuth()

const navItems = [
  { path: '/dashboard', label: '数据可视化' },
  { path: '/trend-prediction', label: '趋势预测' },
]
</script>

<template>
  <div class="app">
    <a href="#main-content" class="skip-link">跳到主要内容</a>
    <header class="brand">
      <div class="brand-inner">
        <div class="brand-logo">EDU·VIZ</div>
        <div class="brand-actions">
          <nav class="main-nav">
            <router-link
              v-for="n in navItems"
              :key="n.path"
              :to="n.path"
              :class="['nav-link', { active: route.path === n.path || route.path.startsWith(n.path + '/') }]"
            >{{ n.label }}</router-link>
          </nav>
          <div class="nav-right">
            <template v-if="isLoggedIn">
              <span class="user-name">{{ username }}</span>
              <button class="logout-btn" @click="logout">退出</button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <main id="main-content" class="page">
      <router-view />
    </main>

    <footer class="footer">
      <span>中国十年教育数据分析与可视化</span>
    </footer>
  </div>
</template>

<style>
/* 全局基础样式重置 */
* { margin: 0; padding: 0; box-sizing: border-box; }

html {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background: #f6f7f9;
  color: #1a1a1a;
  line-height: 1.6;
}

/* ========== 视图页面公共样式 ========== */

.hero { margin-bottom: 24px; }
.hero-title {
  font-size: 32px; font-weight: 700; letter-spacing: -0.5px;
  line-height: 1.2; color: #0f172a; margin-bottom: 8px;
}
.hero-desc { font-size: 15px; color: #64748b; max-width: 560px; }

.subnav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.subnav-btn {
  padding: 8px 20px; border: none; background: transparent;
  color: #64748b; font-size: 14px; cursor: pointer; border-radius: 8px;
  transition: color .2s ease, background-color .2s ease; font-weight: 500;
}
.subnav-btn:hover { color: #0f172a; background: #e2e8f0; }
.subnav-btn.active { color: #fff; background: #0f172a; }
.subnav-btn:focus-visible {
  outline: 2px solid #60a5fa; outline-offset: 2px;
}

.year-nav { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
.year-btn {
  padding: 5px 12px; border: 1px solid #e2e8f0; background: #fff;
  color: #475569; font-size: 13px; cursor: pointer; border-radius: 6px;
  transition: all .15s ease;
}
.year-btn:hover { border-color: #94a3b8; color: #0f172a; }
.year-btn.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.year-btn:focus-visible {
  outline: 2px solid #60a5fa; outline-offset: 2px;
}

.unit-tag { margin-left: auto; font-size: 13px; color: #64748b; font-weight: 500; align-self: center; }

.error-msg {
  background: #fef2f2; color: #dc2626;
  padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 14px;
}

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 16px;
}

.chart-wrap {
  background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;
}

@media (max-width: 960px) {
  .grid-2 { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .hero-title { font-size: 24px; }
  .subnav-btn { padding: 7px 14px; font-size: 13px; }
  .chart { padding: 10px; border-radius: 8px; }
  .chart-wrap { padding: 12px; border-radius: 8px; }
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.brand {
  background: #0f172a;
  color: #fff;
}
.brand-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #e2e8f0;
}

.main-nav {
  display: flex;
  gap: 8px;
}
.nav-link {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  color: #94a3b8;
  text-decoration: none;
  transition: color .2s ease, background-color .2s ease;
}
.nav-link:hover {
  color: #e2e8f0;
  background: rgba(255,255,255,0.06);
}
.nav-link.active {
  color: #fff;
  background: rgba(255,255,255,0.12);
  font-weight: 500;
}
.nav-link:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.brand-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-name {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: 500;
}

.logout-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  background: transparent;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: background-color .2s ease, border-color .2s ease;
}
.logout-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.4);
}
.logout-btn:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  background: #0f172a;
  color: #fff;
  padding: 8px 16px;
  border-radius: 0 0 6px 6px;
  font-size: 14px;
  z-index: 100;
  text-decoration: none;
}
.skip-link:focus {
  top: 0;
}

.page {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.footer {
  border-top: 1px solid #e5e7eb;
  background: #fff;
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #9ca3af;
}

@media (max-width: 640px) {
  .brand-inner { padding: 0 16px; }
  .page { padding: 20px 16px 32px; }
  .nav-link { padding: 6px 10px; font-size: 13px; }
  .brand-actions { gap: 12px; }
  .nav-right { gap: 10px; }
  .user-name { font-size: 12px; }
  .logout-btn { padding: 4px 10px; font-size: 12px; }
}
</style>
