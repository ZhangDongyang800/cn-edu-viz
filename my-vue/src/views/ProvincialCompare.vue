<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const items = [
  { key: '分省在校生数', label: '在校生数' },
  { key: '分省招生数', label: '招生数' },
  { key: '分省毕业生数', label: '毕业生数' },
  { key: '分省学位数', label: '学位数' },
  { key: '分省学校数', label: '学校数' },
  { key: '教育经费', label: '教育经费' },
]
const active = ref('分省在校生数')
const barRef = ref(null)
const mapRef = ref(null)
let barInst = null
let mapInst = null

async function load() {
  const res = await fetch(`/api/data/${active.value}`)
  const data = await res.json()
  const yearCols = Object.keys(data[0] || {}).filter(c => /\d{4}年/.test(c))
  const year = yearCols[yearCols.length - 1]
  const sorted = data
    .filter(r => r['地区'] !== '全国' && r[year] != null)
    .sort((a, b) => b[year] - a[year])
    .slice(0, 15)

  if (!barInst) barInst = echarts.init(barRef.value)
  barInst.setOption({
    title: { text: `${active.value} · ${year}`, left: 0, top: 0, textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 24, bottom: 24, top: 40 },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } } },
    yAxis: { type: 'category', data: sorted.map(r => r['地区']).reverse(), axisLine: { show: false }, axisTick: { show: false } },
    series: [{ type: 'bar', data: sorted.map(r => r[year]).reverse(), itemStyle: { color: '#1a1a1a', borderRadius: [0, 4, 4, 0] } }]
  }, true)

  if (!mapInst) mapInst = echarts.init(mapRef.value)
  mapInst.setOption({
    title: { text: '地区分布', left: 0, top: 0, textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item' },
    visualMap: {
      min: 0, max: Math.max(...sorted.map(d => d[year])),
      left: 0, bottom: 0, text: ['高', '低'], calculable: true,
      inRange: { color: ['#e8e8e8', '#1a1a1a'] },
      itemWidth: 12, itemHeight: 80,
    },
    series: [{
      type: 'map', map: 'china', roam: false,
      emphasis: { label: { show: true } },
      data: sorted.map(r => ({ name: r['地区'], value: r[year] }))
    }]
  }, true)
}

onMounted(() => {
  load()
  window.addEventListener('resize', () => { barInst?.resize(); mapInst?.resize() })
})
</script>

<template>
  <div>
    <h1 class="page-title">分省对比</h1>

    <nav class="subnav">
      <button
        v-for="item in items" :key="item.key"
        :class="['subnav-btn', { active: active === item.key }]"
        @click="active = item.key; load()"
      >{{ item.label }}</button>
    </nav>

    <div class="grid-2">
      <div ref="barRef" class="chart"></div>
      <div ref="mapRef" class="chart"></div>
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
.subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.subnav-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all .15s;
}
.subnav-btn:hover { color: #1a1a1a; background: #f0f0f0; }
.subnav-btn.active { background: #1a1a1a; color: #fff; }

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
