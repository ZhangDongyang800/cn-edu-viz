<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/overview', label: '数据总览' },
  { path: '/national-trend', label: '全国趋势' },
  { path: '/provincial-compare', label: '分省对比' },
  { path: '/structure-analysis', label: '结构分析' },
]
</script>

<template>
  <div class="app">
    <!-- 跳过导航链接，方便键盘用户 -->
    <a href="#main-content" class="skip-link">跳到主要内容</a>
    <!-- 顶部品牌栏 -->
    <header class="brand">
      <div class="brand-inner">
        <div class="brand-logo">EDU·VIZ</div>
        <nav class="main-nav">
          <router-link
            v-for="n in navItems"
            :key="n.path"
            :to="n.path"
            :class="['nav-link', { active: route.path === n.path }]"
          >{{ n.label }}</router-link>
        </nav>
      </div>
    </header>

    <!-- 页面内容区 -->
    <main id="main-content" class="page">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <span>中国十年教育数据分析与可视化</span>
    </footer>
  </div>
</template>

<style>
/* 全局基础样式重置 */
* { margin: 0; padding: 0; box-sizing: border-box; }

html {
  /* 使用更现代的无衬线字体栈 */
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
</style>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 品牌栏：全宽深色条 */
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

/* 主导航 */
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
/* 键盘焦点可见样式 */
.nav-link:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

/* 跳过导航链接：默认隐藏，聚焦时显示 */
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

/* 页面内容区 */
.page {
  flex: 1;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

/* 页脚 */
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
}
</style>
