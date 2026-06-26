<script setup>
import { ref, watch, onMounted, onBeforeUnmount, onActivated } from 'vue'
import * as echarts from 'echarts'
import {
  darkTooltip, mainPalette, baseGrid, titleStyle,
  axisLineStyle, splitLineStyle, axisLabelStyle, buildTooltipHtml
} from '../utils/echarts-config'

// 接收表格数据和列名
const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  title: { type: String, default: '' }
})

const chartRef = ref(null)
let chartInstance = null

// 数据变化时重新渲染图表（浅监听即可，data 是整体替换的）
watch(() => props.data, () => render())

function render() {
  if (!chartRef.value) return
  if (!chartInstance) chartInstance = echarts.init(chartRef.value)
  if (!props.data.length) { chartInstance.clear(); return }

  const firstCol = props.columns[0]
  const yearCols = props.columns.filter(c => /\d{4}年/.test(c))
  const isProvince = firstCol === '地区'
  const isIndicator = firstCol === '指标'

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

    // y 轴数值统一保留两位小数，防止出现一长串小数
    const yAxisFormatter = v => Number.isFinite(v) ? v.toFixed(2) : v

    chartInstance.setOption({
      title: { ...titleStyle, text: props.title + ' 趋势' },
      tooltip: { trigger: 'axis', ...darkTooltip, formatter: params => buildTooltipHtml(params, '万人') },
      legend: {
        type: 'scroll', bottom: 0,
        itemWidth: 12, itemHeight: 12,
        textStyle: { color: '#475569' }
      },
      grid: { ...baseGrid, bottom: 44 },
      xAxis: {
        type: 'category', data: years,
        axisLine: axisLineStyle, axisLabel: axisLabelStyle, axisTick: { show: false }
      },
      yAxis: {
        type: 'value', splitLine: splitLineStyle,
        axisLabel: { ...axisLabelStyle, formatter: yAxisFormatter }
      },
      color: mainPalette,
      series
    }, true)
  } else if (isProvince && yearCols.length > 0) {
    // 分省数据：柱状图，取最新年份按数值排序后前 20 个地区
    const latestYear = yearCols[yearCols.length - 1]
    const topData = props.data
      .filter(row => row[latestYear] != null && row[firstCol] !== '全国')
      .sort((a, b) => b[latestYear] - a[latestYear])
      .slice(0, 20)

    // 分省柱状图 tooltip 与 y 轴同样保留两位小数
    const barTooltip = params => {
      const p = params[0]
      const v = p?.value
      return `${p?.name}: ${Number.isFinite(v) ? v.toFixed(2) : v}`
    }
    const barYAxisFormatter = v => Number.isFinite(v) ? v.toFixed(2) : v

    chartInstance.setOption({
      title: { ...titleStyle, text: `${props.title} - ${latestYear}` },
      tooltip: { trigger: 'axis', ...darkTooltip, formatter: barTooltip },
      grid: { ...baseGrid, bottom: 72 },
      xAxis: {
        type: 'category',
        data: topData.map(r => r[firstCol]),
        axisLine: axisLineStyle,
        axisLabel: { ...axisLabelStyle, rotate: 35, fontSize: 11, interval: 0 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value', splitLine: splitLineStyle,
        axisLabel: { ...axisLabelStyle, formatter: barYAxisFormatter }
      },
      series: [{
        type: 'bar',
        data: topData.map(r => r[latestYear]),
        itemStyle: { color: '#0f172a', borderRadius: [4, 4, 0, 0] },
        barWidth: '55%',
        emphasis: { itemStyle: { color: '#334155' } }
      }]
    }, true)
  } else {
    chartInstance.clear()
  }
}

// 窗口自适应
function onResize() { chartInstance?.resize() }
onMounted(() => window.addEventListener('resize', onResize))
onActivated(() => onResize())  // keep-alive 激活时 resize
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div ref="chartRef" class="chart" role="img" :aria-label="title ? title + '图表' : '数据图表'"></div>
</template>

<style scoped>
.chart {
  width: 100%;
  height: 440px;
}
</style>
