<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const pieRef = ref(null)
const stackRef = ref(null)
let pieInst = null
let stackInst = null

onMounted(async () => {
  const res = await fetch('/api/data/在校生数')
  const data = await res.json()
  const cols = Object.keys(data[0] || {})
  const yearCols = cols.filter(c => /\d{4}年/.test(c))
  const year = yearCols[yearCols.length - 1]
  const years = yearCols.map(c => c.replace('年', ''))

  const filtered = data.filter(r => r['指标'] && r[year] != null)

  // 环形图：结构占比
  pieInst = echarts.init(pieRef.value)
  pieInst.setOption({
    title: {
      text: `${year} 结构占比`,
      left: 0,
      top: 0,
      textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      formatter: '{b}: {c}万人 ({d}%)'
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#475569' }
    },
    series: [{
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '48%'],
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 3
      },
      label: {
        formatter: '{b}\n{d}%',
        fontSize: 12,
        color: '#334155'
      },
      labelLine: {
        lineStyle: { color: '#cbd5e1' }
      },
      // 使用一组克制的蓝灰色调
      color: [
        '#0f172a', '#334155', '#475569', '#64748b',
        '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'
      ],
      data: filtered.map(r => ({ name: r['指标'], value: r[year] }))
    }]
  })

  // 堆叠柱状图：历年规模变化
  stackInst = echarts.init(stackRef.value)
  stackInst.setOption({
    title: {
      text: '历年规模变化',
      left: 0,
      top: 0,
      textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' }
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#475569' }
    },
    grid: { left: 52, right: 24, bottom: 44, top: 44 },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '万人',
      nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, -28] },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    // 与环形图一致的配色
    color: [
      '#0f172a', '#334155', '#475569', '#64748b',
      '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'
    ],
    series: filtered.map(r => ({
      name: r['指标'],
      type: 'bar',
      stack: 'total',
      barWidth: '50%',
      itemStyle: { borderRadius: [0, 0, 0, 0] },
      data: yearCols.map(c => r[c] || 0)
    }))
  })

  window.addEventListener('resize', () => { pieInst?.resize(); stackInst?.resize() })
})
</script>

<template>
  <div>
    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">结构分析</h1>
      <p class="hero-desc">拆解教育层次构成，观察各学段占比与历年堆叠演变</p>
    </header>

    <!-- 双栏图表 -->
    <div class="grid-2">
      <div ref="pieRef" class="chart"></div>
      <div ref="stackRef" class="chart"></div>
    </div>
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

/* 双栏网格 */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.chart {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  height: 520px;
  padding: 16px;
}

@media (max-width: 960px) {
  .grid-2 { grid-template-columns: 1fr; }
  .chart { height: 460px; }
}
@media (max-width: 640px) {
  .hero-title { font-size: 24px; }
  .chart { padding: 10px; border-radius: 8px; }
}
</style>
