<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const pieRef = ref(null)
const stackRef = ref(null)
let pieInst = null
let stackInst = null
const errorMsg = ref('')

// 年份选择
const yearList = ref([])
const activeYear = ref('')
let rawData = []
let yearColsCache = []

onMounted(async () => {
  try {
    errorMsg.value = ''
    const res = await fetch('/api/data/在校生数')
    rawData = await res.json()
    const cols = Object.keys(rawData[0] || {})
    yearColsCache = cols.filter(c => /\d{4}年/.test(c))
    yearList.value = yearColsCache
    activeYear.value = yearColsCache[yearColsCache.length - 1]

    renderPie()
    renderStack()

    window.addEventListener('resize', onResize)
  } catch (e) {
    console.error(e)
    errorMsg.value = '数据加载失败，请稍后重试'
  }
})

// 渲染环形图
function renderPie() {
  const year = activeYear.value
  if (!year) return

  const filtered = rawData.filter(r => r['指标'] && r[year] != null)

  if (!pieInst) pieInst = echarts.init(pieRef.value)
  pieInst.setOption({
    title: {
      text: `${year.replace('年', '')} 年结构占比`,
      left: 0,
      top: 0,
      textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      confine: true,
      formatter: (params) => `${params.name}<br/>${params.value} 万人 (${params.percent}%)`
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      left: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#475569', fontSize: 11 },
      pageIconColor: '#64748b',
      pageTextStyle: { color: '#64748b' }
    },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '45%'],
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 2
      },
      // 关闭标签和引导线，鼠标悬停时通过 tooltip 查看
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 8,
        itemStyle: {
          shadowBlur: 12,
          shadowColor: 'rgba(0,0,0,0.2)'
        }
      },
      color: [
        '#0f172a', '#1e293b', '#334155', '#475569',
        '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'
      ],
      data: filtered.map(r => ({ name: r['指标'], value: r[year] }))
    }]
  }, true)
}

// 渲染堆叠柱状图
function renderStack() {
  const years = yearColsCache.map(c => c.replace('年', ''))
  const filtered = rawData.filter(r => r['指标'])

  if (!stackInst) stackInst = echarts.init(stackRef.value)
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
      textStyle: { color: '#fff' },
      confine: true,
      formatter: (params) => {
        // 过滤 0 值，按数值降序排列
        let filtered = params.filter(p => p.value !== 0 && p.value != null)
        filtered.sort((a, b) => b.value - a.value)
        if (!filtered.length) return params[0]?.axisValue || ''

        const SHOW_TOP = 8
        const total = filtered.reduce((s, p) => s + p.value, 0)
        const topItems = filtered.slice(0, SHOW_TOP)
        const restCount = filtered.length - SHOW_TOP

        let html = `<div style="font-weight:600;margin-bottom:6px;font-size:13px">${filtered[0].axisValue}年</div>`
        topItems.forEach(p => {
          html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:12px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
            <span style="flex:1;white-space:nowrap">${p.seriesName}</span>
            <span style="font-weight:600;margin-left:12px">${p.value}</span>
          </div>`
        })
        if (restCount > 0) {
          html += `<div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#94a3b8">还有 ${restCount} 项，合计 ${total.toFixed(0)} 万人</div>`
        }
        return html
      }
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      left: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#475569', fontSize: 11 },
      pageIconColor: '#64748b',
      pageTextStyle: { color: '#64748b' }
    },
    grid: { left: 56, right: 16, bottom: 72, top: 44 },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '万人',
      nameTextStyle: { color: '#94a3b8', padding: [0, 0, 0, -32] },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b', fontSize: 11 }
    },
    color: [
      '#0f172a', '#1e293b', '#334155', '#475569',
      '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'
    ],
    series: filtered.map(r => ({
      name: r['指标'],
      type: 'bar',
      stack: 'total',
      barWidth: '45%',
      itemStyle: { borderRadius: [0, 0, 0, 0] },
      data: yearColsCache.map(c => r[c] || 0)
    }))
  }, true)
}

function onResize() { pieInst?.resize(); stackInst?.resize() }

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  pieInst?.dispose()
  stackInst?.dispose()
})
</script>

<template>
  <div>
    <!-- 异步状态通知区域 -->
    <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>

    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">结构分析</h1>
      <p class="hero-desc">拆解教育层次构成，观察各学段占比与历年堆叠演变</p>
    </header>

    <!-- 年份选择 -->
    <nav class="year-nav">
      <button
        v-for="y in yearList"
        :key="y"
        :class="['year-btn', { active: activeYear === y }]"
        @click="activeYear = y; renderPie()"
      >{{ y.replace('年', '') }}</button>
    </nav>

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

/* 错误提示样式 */
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

/* 年份选择行 */
.year-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
}
.year-btn {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: all .15s ease;
}
.year-btn:hover {
  border-color: #94a3b8;
  color: #0f172a;
}
.year-btn.active {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
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
  height: 560px;
  padding: 16px;
}

@media (max-width: 960px) {
  .grid-2 { grid-template-columns: 1fr; }
  .chart { height: 480px; }
}
@media (max-width: 640px) {
  .hero-title { font-size: 24px; }
  .chart { padding: 10px; border-radius: 8px; height: 440px; }
}
</style>
