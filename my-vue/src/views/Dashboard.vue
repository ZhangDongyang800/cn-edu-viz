<script setup>
import { computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import OverviewPanel from './dashboard/OverviewPanel.vue'
import NationalTrendPanel from './dashboard/NationalTrendPanel.vue'
import ProvincialComparePanel from './dashboard/ProvincialComparePanel.vue'
import StructureAnalysisPanel from './dashboard/StructureAnalysisPanel.vue'

const route = useRoute()
const router = useRouter()

// 标签页配置（markRaw 避免组件被响应式代理）
const tabs = [
  { key: 'overview', label: '数据总览', component: markRaw(OverviewPanel) },
  { key: 'national-trend', label: '全国趋势', component: markRaw(NationalTrendPanel) },
  { key: 'provincial-compare', label: '分省对比', component: markRaw(ProvincialComparePanel) },
  { key: 'structure-analysis', label: '结构分析', component: markRaw(StructureAnalysisPanel) },
]

// 当前激活的标签：从 URL query 读取，默认 'overview'
const activeTab = computed(() => {
  const tab = route.query.tab
  return tabs.find(t => t.key === tab) ? tab : 'overview'
})

// 当前渲染的面板组件
const currentPanel = computed(() => {
  return tabs.find(t => t.key === activeTab.value)?.component
})

// 切换标签（更新 URL query）
function switchTab(key) {
  router.replace({ query: { tab: key } })
}
</script>

<template>
  <div>
    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">中国十年教育数据可视化</h1>
      <p class="hero-desc">汇聚 2014 - 2024 年核心教育指标，多维度呈现教育规模、结构与趋势</p>
    </header>

    <!-- 标签页导航 -->
    <nav class="tab-nav">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="['tab-btn', { active: activeTab === t.key }]"
        @click="switchTab(t.key)"
      >{{ t.label }}</button>
    </nav>

    <!-- 动态面板（keep-alive 缓存） -->
    <keep-alive>
      <component :is="currentPanel" />
    </keep-alive>
  </div>
</template>

<style scoped>
/* 标签页导航 */
.tab-nav {
  display: flex; gap: 4px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}
.tab-btn {
  padding: 10px 20px; border: none; background: transparent;
  color: #64748b; font-size: 14px; cursor: pointer; font-weight: 500;
  border-bottom: 2px solid transparent; margin-bottom: -2px;
  transition: color .2s ease, border-color .2s ease;
}
.tab-btn:hover { color: #0f172a; }
.tab-btn.active { color: #0f172a; border-bottom-color: #0f172a; }
.tab-btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }

@media (max-width: 640px) {
  .tab-btn { padding: 8px 14px; font-size: 13px; }
}
</style>
