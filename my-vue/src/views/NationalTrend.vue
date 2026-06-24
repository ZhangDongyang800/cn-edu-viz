<script setup>
import { ref, onMounted } from 'vue'
import DataChart from '../components/DataChart.vue'

const items = [
  { key: '在校生数', label: '在校生数' },
  { key: '招生数', label: '招生数' },
  { key: '毕业生数', label: '毕业生数' },
]
const active = ref('在校生数')
const chartData = ref([])
const chartColumns = ref([])

async function load() {
  const res = await fetch(`/api/data/${active.value}`)
  const data = await res.json()
  chartData.value = data
  chartColumns.value = Object.keys(data[0] || {})
}

onMounted(load)
</script>

<template>
  <div>
    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">全国趋势</h1>
      <p class="hero-desc">追踪核心指标十年变化，观察教育规模扩张与结构调整</p>
    </header>

    <!-- 子导航 -->
    <nav class="subnav">
      <button
        v-for="item in items"
        :key="item.key"
        :class="['subnav-btn', { active: active === item.key }]"
        @click="active = item.key; load()"
      >{{ item.label }}</button>
    </nav>

    <!-- 图表区 -->
    <section class="chart-wrap">
      <DataChart :data="chartData" :columns="chartColumns" :title="active" />
    </section>
  </div>
</template>

<style scoped>
/* 页面标题区 */
.hero {
  margin-bottom: 24px;
}
.hero-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
  color: #0f172a;
  margin-bottom: 8px;
}
.hero-desc {
  font-size: 15px;
  color: #64748b;
  max-width: 560px;
}

/* 子导航：药丸式切换 */
.subnav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.subnav-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all .2s ease;
  font-weight: 500;
}
.subnav-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}
.subnav-btn.active {
  color: #fff;
  background: #0f172a;
}

/* 图表容器 */
.chart-wrap {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

@media (max-width: 640px) {
  .hero-title { font-size: 24px; }
  .subnav-btn { padding: 7px 14px; font-size: 13px; }
  .chart-wrap { padding: 12px; border-radius: 8px; }
}
</style>
