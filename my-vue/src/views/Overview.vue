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

    kpiList.value = data.slice(0, 6).map(row => {
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
    <h1 class="page-title">数据总览</h1>

    <section class="kpi-row">
      <div v-for="k in kpiList" :key="k.name" class="kpi">
        <div class="kpi-label">{{ k.name }}</div>
        <div class="kpi-num">{{ k.value }}<span class="kpi-unit">万人</span></div>
        <div class="kpi-delta" :class="k.change >= 0 ? 'up' : 'down'">
          {{ k.change >= 0 ? '+' : '' }}{{ k.change }}%
        </div>
      </div>
    </section>

    <section class="chart-section">
      <h2 class="section-title">全国在校生规模趋势</h2>
      <DataChart :data="trendData" :columns="trendColumns" title="在校生数" />
    </section>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-bottom: 32px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}
.kpi {
  padding: 20px 0;
  border-top: 2px solid #1a1a1a;
}
.kpi-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
.kpi-num {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -1px;
  line-height: 1;
}
.kpi-unit {
  font-size: 13px;
  color: #999;
  font-weight: 400;
  margin-left: 4px;
}
.kpi-delta {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
}
.kpi-delta.up { color: #2e7d32; }
.kpi-delta.down { color: #c62828; }

.chart-section {
  margin-top: 40px;
}
.section-title {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
  color: #1a1a1a;
}

@media (max-width: 1024px) {
  .kpi-row { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .page-title { font-size: 22px; }
}
</style>
