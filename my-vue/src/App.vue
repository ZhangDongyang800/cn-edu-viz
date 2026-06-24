<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// 表名列表
const tables = [
  '分省在校生数', '分省学位数', '分省招生数', '分省毕业生数',
  '在校生数', '分省学校数', '招生数', '教育经费', '毕业生数'
]
const activeTable = ref('在校生数')
const tableData = ref([])
const columns = ref([])
const loading = ref(false)

// 图表实例引用
let chartInstance = null

// 切换表时加载数据
watch(activeTable, () => loadData(), { immediate: true })

async function loadData() {
  loading.value = true
  try {
    const res = await fetch(`/api/data/${activeTable.value}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    tableData.value = data
    // 从第一行数据中提取列名
    columns.value = data.length > 0 ? Object.keys(data[0]) : []
    // 数据加载后渲染图表
    await nextTick()
    renderChart(data)
  } catch (e) {
    console.error('加载数据失败:', e)
    tableData.value = []
    columns.value = []
  } finally {
    loading.value = false
  }
}

// 渲染 ECharts 图表
function renderChart(data) {
  const chartDom = document.getElementById('main-chart')
  if (!chartDom) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartDom)
  }
  // 没有数据则清空
  if (!data.length) {
    chartInstance.clear()
    return
  }

  const firstCol = columns.value[0] // 地区 或 指标
  // 提取年份列（以"年"结尾的列名，排除 _c 开头的脏数据列）
  const yearCols = columns.value.filter(c => /\d{4}年/.test(c))

  // 判断是分省数据还是全国指标数据
  const isProvince = firstCol === '地区'
  const isIndicator = firstCol === '指标'

  if (isIndicator && yearCols.length > 0) {
    // 全国指标数据：折线图，每条线是一个指标
    const years = yearCols.map(c => c.replace('年', ''))
    const series = data.map(row => ({
      name: row[firstCol],
      type: 'line',
      data: yearCols.map(c => row[c] ?? null)
    }))
    chartInstance.setOption({
      title: { text: activeTable.value + '趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      grid: { left: '8%', right: '8%', bottom: '18%', top: '15%' },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value' },
      series
    }, true)
  } else if (isProvince && yearCols.length > 0) {
    // 分省数据：取最新年份做柱状图（取前20个地区）
    const latestYear = yearCols[yearCols.length - 1]
    const topData = data
      .filter(row => row[latestYear] != null && row[firstCol] !== '全国')
      .slice(0, 20)
    chartInstance.setOption({
      title: { text: `${activeTable.value} - ${latestYear}`, left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '5%', bottom: '25%', top: '15%' },
      xAxis: {
        type: 'category',
        data: topData.map(r => r[firstCol]),
        axisLabel: { rotate: 45 }
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: topData.map(r => r[latestYear])
      }]
    }, true)
  } else {
    chartInstance.clear()
  }
}

// 窗口大小变化时自适应
onMounted(() => {
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<template>
  <div class="app">
    <!-- 顶部标题栏 -->
    <header class="header">
      <h1>中国十年教育数据分析与可视化</h1>
    </header>

    <!-- 标签导航 -->
    <nav class="tabs">
      <button
        v-for="t in tables" :key="t"
        :class="['tab', { active: activeTable === t }]"
        @click="activeTable = t"
      >{{ t }}</button>
    </nav>

    <!-- 图表区域 -->
    <div id="main-chart" class="chart"></div>

    <!-- 数据表格 -->
    <div class="table-wrap">
      <div v-if="loading" class="loading">加载中...</div>
      <table v-else-if="tableData.length">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td v-for="col in columns" :key="col">{{ row[col] }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="loading">暂无数据</div>
    </div>
  </div>
</template>

<style>
/* 全局基础样式 */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Microsoft YaHei", sans-serif; background: #f0f2f5; }
</style>

<style scoped>
.app { max-width: 1200px; margin: 0 auto; padding: 20px; }

.header {
  text-align: center;
  padding: 24px 0 16px;
}
.header h1 { font-size: 24px; color: #303133; }

/* 标签导航 */
.tabs {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin: 16px 0;
}
.tab {
  padding: 6px 16px; border: 1px solid #dcdfe6; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 14px; color: #606266;
  transition: all .2s;
}
.tab:hover { color: #409eff; border-color: #c6e2ff; }
.tab.active { background: #409eff; color: #fff; border-color: #409eff; }

/* 图表容器 */
.chart { width: 100%; height: 420px; background: #fff; border-radius: 8px; margin-bottom: 16px; }

/* 表格区域 */
.table-wrap {
  background: #fff; border-radius: 8px; padding: 16px;
  overflow-x: auto;
}
.table-wrap table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table-wrap th, .table-wrap td {
  padding: 8px 12px; border-bottom: 1px solid #ebeef5; text-align: left; white-space: nowrap;
}
.table-wrap th { background: #f5f7fa; color: #333; font-weight: 600; position: sticky; top: 0; }
.table-wrap tbody tr:hover { background: #f5f7fa; }

.loading { text-align: center; padding: 40px; color: #999; }
</style>
