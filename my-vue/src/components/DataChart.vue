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

  if (isIndicator && yearCols.length > 0) {
    // 全国指标数据：折线图
    const years = yearCols.map(c => c.replace('年', ''))
    const series = props.data.map(row => ({
      name: row[firstCol],
      type: 'line',
      data: yearCols.map(c => row[c] ?? null)
    }))
    chartInstance.setOption({
      title: { text: props.title + '趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      grid: { left: '8%', right: '8%', bottom: '18%', top: '15%' },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value' },
      series
    }, true)
  } else if (isProvince && yearCols.length > 0) {
    // 分省数据：柱状图，取最新年份前20个地区
    const latestYear = yearCols[yearCols.length - 1]
    const topData = props.data
      .filter(row => row[latestYear] != null && row[firstCol] !== '全国')
      .slice(0, 20)
    chartInstance.setOption({
      title: { text: `${props.title} - ${latestYear}`, left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '5%', bottom: '25%', top: '15%' },
      xAxis: {
        type: 'category',
        data: topData.map(r => r[firstCol]),
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: topData.map(r => r[latestYear]) }]
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
.chart { width: 100%; height: 420px; background: #fff; border-radius: 8px; }
</style>
