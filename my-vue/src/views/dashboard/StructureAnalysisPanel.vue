<script setup>
import { ref, onMounted, onBeforeUnmount, onActivated } from 'vue'
import * as echarts from 'echarts'
import {
  darkTooltip, scrollLegend, grayPalette,
  titleStyle, axisLineStyle, splitLineStyle, axisLabelStyle, buildTooltipHtml
} from '../../utils/echarts-config'

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
    title: { ...titleStyle, text: `${year.replace('年', '')} 年结构占比` },
    tooltip: {
      trigger: 'item',
      ...darkTooltip,
      formatter: p => `${p.name}<br/>${Number.isFinite(p.value) ? p.value.toFixed(2) : p.value} 万人 (${p.percent}%)`
    },
    legend: scrollLegend,
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true, scaleSize: 8,
        itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.2)' }
      },
      color: grayPalette,
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
    title: { ...titleStyle, text: '历年规模变化' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...darkTooltip,
      formatter: params => buildTooltipHtml(params, '万人')
    },
    legend: scrollLegend,
    // containLabel: true + 充足 bottom 空间留给滚动 legend
    grid: { containLabel: true, left: 8, right: 16, bottom: 56, top: 44 },
    xAxis: {
      type: 'category',
      data: years,
      axisLine: axisLineStyle,
      axisLabel: { ...axisLabelStyle, fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '万人',
      nameLocation: 'end',    // 单位放在 y 轴末端，避免与左上角标题重叠
      nameTextStyle: { color: '#94a3b8' },
      splitLine: splitLineStyle,
      axisLabel: { ...axisLabelStyle, fontSize: 11 }
    },
    color: grayPalette,
    series: filtered.map(r => ({
      name: r['指标'],
      type: 'bar',
      stack: 'total',
      barWidth: '45%',
      data: yearColsCache.map(c => r[c] || 0)
    }))
  }, true)
}

function onResize() { pieInst?.resize(); stackInst?.resize() }

// keep-alive 激活时 resize 图表（容器尺寸可能已变化）
onActivated(() => {
  onResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  pieInst?.dispose()
  stackInst?.dispose()
})
</script>

<template>
  <div>
    <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>

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
.chart { height: 540px; }

@media (max-width: 960px) {
  .chart { height: 460px; }
}
@media (max-width: 640px) {
  .chart { height: 420px; }
}
</style>
