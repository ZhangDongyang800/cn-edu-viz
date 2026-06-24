<script setup>
import { ref, onMounted } from 'vue'
import DataChart from '../components/DataChart.vue'

const kpiList = ref([])
const trendData = ref([])
const trendColumns = ref([])

onMounted(async () => {
  try {
    const res = await fetch('/api/data/在校生数')
    const data = await res.json()
    const cols = Object.keys(data[0] || {}).filter(c => /\d{4}年/.test(c))
    const latest = cols[cols.length - 1]
    const prev = cols[cols.length - 2]

    // 选取核心指标，过滤掉空值过多的条目
    kpiList.value = data
      .filter(row => row[latest] != null)
      .slice(0, 6)
      .map(row => {
        const cur = row[latest] || 0
        const pre = row[prev] || 0
        return {
          name: row['指标'],
          value: cur,
          change: pre ? ((cur - pre) / pre * 100).toFixed(1) : 0,
        }
      })

    trendData.value = data
    trendColumns.value = Object.keys(data[0] || {})
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <div>
    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">中国十年教育数据总览</h1>
      <p class="hero-desc">汇聚 2014 - 2023 年核心教育指标，呈现规模、结构与趋势</p>
    </header>

    <!-- KPI 卡片行 -->
    <section class="kpi-row">
      <div v-for="k in kpiList" :key="k.name" class="kpi">
        <div class="kpi-name">{{ k.name }}</div>
        <div class="kpi-num">{{ k.value }}<span class="kpi-unit">万人</span></div>
        <div class="kpi-delta" :class="k.change >= 0 ? 'up' : 'down'">
          <span class="delta-arrow">{{ k.change >= 0 ? '+' : '-' }}</span>
          {{ Math.abs(k.change) }}%
        </div>
      </div>
    </section>

    <!-- 趋势图表 -->
    <section class="chart-section">
      <div class="section-header">
        <h2 class="section-title">全国在校生规模趋势</h2>
        <span class="section-badge">2014 - 2023</span>
      </div>
      <DataChart :data="trendData" :columns="trendColumns" title="在校生数" />
    </section>
  </div>
</template>

<style scoped>
/* 顶部标题区 */
.hero {
  margin-bottom: 32px;
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

/* KPI 行：6 列网格 */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

/* KPI 卡片：无阴影、无圆角，用顶部色块区分 */
.kpi {
  background: #fff;
  border-top: 3px solid #0f172a;
  padding: 20px;
  transition: transform .2s ease, box-shadow .2s ease;
}
.kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.kpi-name {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 10px;
  line-height: 1.3;
}
.kpi-num {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1;
  color: #0f172a;
}
.kpi-unit {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 400;
  margin-left: 4px;
}
.kpi-delta {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
.delta-arrow {
  font-size: 12px;
}
.kpi-delta.up { color: #16a34a; }
.kpi-delta.down { color: #dc2626; }

/* 图表区块 */
.chart-section {
  margin-top: 8px;
}
.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}
.section-badge {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .hero-title { font-size: 24px; }
  .kpi { padding: 16px; }
  .kpi-num { font-size: 22px; }
}
</style>
