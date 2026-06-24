<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

// 接收表格数据和列名
const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  title: { type: String, default: '' }
})

const chartRef = ref(null)
let chartInstance = null

// 数据变化时重新渲染图表
watch(() => props.data, () => render(), { deep: true })

function render() {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  if (!props.data.length) { chartInstance.clear(); return }

  const firstCol = props.columns[0]
  // 提取年份列
  const yearCols = props.columns.filter(c => /\d{4}年/.test(c))
  const isProvince = firstCol === '地区'
  const isIndicator = firstCol === '指标'

  // 统一的基础配置
  const baseTooltip = {
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderColor: 'transparent',
    textStyle: { color: '#fff' }
  }

  if (isIndicator && yearCols.length > 0) {
    // 全国指标数据：折线图
    const years = yearCols.map(c => c.replace('年', ''))
    const series = props.data.map(row => ({
      name: row[firstCol],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5 },
      data: yearCols.map(c => row[c] ?? null)
    }))

    chartInstance.setOption({
      title: {
        text: props.title + ' 趋势',
        left: 0,
        top: 0,
        textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' }
      },
      tooltip: { trigger: 'axis', ...baseTooltip },
      legend: {
        type: 'scroll',
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
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
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      // 克制的蓝灰色调色板
      color: [
        '#0f172a', '#334155', '#475569', '#64748b',
        '#94a3b8', '#cbd5e1', '#2563eb', '#7c3aed'
      ],
      series
    }, true)
  } else if (isProvince && yearCols.length > 0) {
    // 分省数据：柱状图，取最新年份前 20 个地区
    const latestYear = yearCols[yearCols.length - 1]
    const topData = props.data
      .filter(row => row[latestYear] != null && row[firstCol] !== '全国')
      .slice(0, 20)

    chartInstance.setOption({
      title: {
        text: `${props.title} - ${latestYear}`,
        left: 0,
        top: 0,
        textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' }
      },
      tooltip: {
        trigger: 'axis',
        ...baseTooltip,
        formatter: '{b}: {c}'
      },
      grid: { left: 52, right: 24, bottom: 80, top: 44 },
      xAxis: {
        type: 'category',
        data: topData.map(r => r[firstCol]),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { rotate: 45, color: '#64748b', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      series: [{
        type: 'bar',
        data: topData.map(r => r[latestYear]),
        itemStyle: {
          color: '#0f172a',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '55%',
        emphasis: {
          itemStyle: { color: '#334155' }
        }
      }]
    }, true)
  } else {
    chartInstance.clear()
  }
}

// 窗口自适应
function onResize() { chartInstance?.resize() }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div ref="chartRef" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 420px;
}
</style>
