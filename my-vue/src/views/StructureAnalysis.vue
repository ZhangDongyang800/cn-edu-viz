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

  // 环形图
  pieInst = echarts.init(pieRef.value)
  pieInst.setOption({
    title: { text: `${year} 结构占比`, left: 0, top: 0, textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}万人 ({d}%)' },
    series: [{
      type: 'pie', radius: ['45%', '75%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%', fontSize: 12 },
      data: filtered.map(r => ({ name: r['指标'], value: r[year] }))
    }]
  })

  // 堆叠图
  stackInst = echarts.init(stackRef.value)
  stackInst.setOption({
    title: { text: '历年规模变化', left: 0, top: 0, textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { type: 'scroll', bottom: 0, itemWidth: 10, itemHeight: 10 },
    grid: { left: 48, right: 24, bottom: 40, top: 40 },
    xAxis: { type: 'category', data: years, axisLine: { lineStyle: { color: '#ddd' } } },
    yAxis: { type: 'value', name: '万人', splitLine: { lineStyle: { color: '#f0f0f0' } } },
    series: filtered.map(r => ({
      name: r['指标'], type: 'bar', stack: 'total',
      data: yearCols.map(c => r[c] || 0)
    }))
  })

  window.addEventListener('resize', () => { pieInst?.resize(); stackInst?.resize() })
})
</script>

<template>
  <div>
    <h1 class="page-title">结构分析</h1>
    <div class="grid-2">
      <div ref="pieRef" class="chart"></div>
      <div ref="stackRef" class="chart"></div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-bottom: 24px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart {
  background: #fff;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  height: 480px;
}
@media (max-width: 900px) {
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
