<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { useAuth } from '../stores/auth'
import { darkTooltip, axisLineStyle, splitLineStyle, axisLabelStyle } from '../utils/echarts-config'

const { getAuthHeaders } = useAuth()

// 参数状态
const tableList = ref([])           // 可用数据表列表
const selectedTable = ref('')       // 选中的表名
const metricList = ref([])          // 当前表的指标列表（全国表）
const provinceList = ref([])        // 当前表的省份列表（分省表）
const selectedMetric = ref('')      // 选中的指标
const selectedProvince = ref('')    // 选中的省份
const yearsAhead = ref(5)           // 预测年数
const modelChoice = ref('auto')     // 模型选择
const loading = ref(false)          // 加载状态
const errorMsg = ref('')            // 错误提示

// 图表相关
const chartRef = ref(null)
let chartInst = null

// 预测结果
const predictionResult = ref(null)
const modelInfo = ref(null)

// 当前表类型
const tableType = computed(() => {
  const table = tableList.value.find(t => t.name === selectedTable.value)
  return table?.type || ''
})

// 监听表切换事件（等 API 返回后再处理）
watch(selectedTable, () => {
  onTableChange()
})

// 当前表的单位
const unitMap = {
  '在校生数': '万人', '招生数': '万人', '毕业生数': '万人',
  '分省在校生数': '万人', '分省招生数': '万人', '分省毕业生数': '万人',
  '分省学位数': '万人', '分省学校数': '所', '教育经费': '万元',
}
const currentUnit = computed(() => unitMap[selectedTable.value] || '')

// 模型选项
const modelOptions = [
  { value: 'auto', label: '自动选择（R²择优）' },
  { value: 'linear', label: '线性回归' },
  { value: 'polynomial', label: '二次多项式回归' },
  { value: 'ewm_linear', label: '指数加权回归' },
]

// 是否可以执行预测（参数完整）
const canPredict = computed(() => {
  if (!selectedTable.value) return false
  if (tableType.value === 'national' && !selectedMetric.value) return false
  if (tableType.value === 'provincial' && !selectedProvince.value) return false
  return true
})

// 加载可用数据表
async function loadTables() {
  try {
    errorMsg.value = ''
    const res = await fetch('/api/analysis/available-tables', {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('获取数据表失败')
    tableList.value = await res.json()
    // 默认选中第一个全国表（API 返回后再设置）
    const nationalTable = tableList.value.find(t => t.type === 'national')
    if (nationalTable) {
      selectedTable.value = nationalTable.name
    }
  } catch (e) {
    console.error(e)
    errorMsg.value = '获取数据表失败，请确认后端和分析服务正在运行'
  }
}

// 表切换时更新指标/省份列表
function onTableChange() {
  const table = tableList.value.find(t => t.name === selectedTable.value)
  if (!table) return

  if (table.type === 'national') {
    metricList.value = table.metrics || []
    provinceList.value = []
    selectedMetric.value = metricList.value[0] || ''
    selectedProvince.value = ''
  } else {
    metricList.value = []
    provinceList.value = table.provinces || []
    selectedMetric.value = ''
    selectedProvince.value = provinceList.value[0] || ''
  }

  // 清空之前的预测结果
  predictionResult.value = null
  modelInfo.value = null
}

// 执行预测
async function runPrediction() {
  if (!canPredict.value) return
  loading.value = true
  errorMsg.value = ''

  try {
    const body = {
      table: selectedTable.value,
      years_ahead: yearsAhead.value,
      model: modelChoice.value,
    }
    if (tableType.value === 'national' && selectedMetric.value) {
      body.metric = selectedMetric.value
    }
    if (tableType.value === 'provincial' && selectedProvince.value) {
      body.province = selectedProvince.value
    }

    const res = await fetch('/api/analysis/trend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || '预测失败')
    }

    const data = await res.json()
    predictionResult.value = data
    modelInfo.value = data.model_info
    renderChart(data)
  } catch (e) {
    console.error(e)
    errorMsg.value = e.message || '预测请求失败'
  } finally {
    loading.value = false
  }
}

// 渲染预测图表
function renderChart(data) {
  if (!chartRef.value) return
  if (!chartInst) chartInst = echarts.init(chartRef.value)

  // 按年份升序排序（数据库列顺序是倒序的）
  const history = [...data.history].sort((a, b) => a.year - b.year)
  if (history.length === 0) return  // 空历史数据时直接退出，避免后续访问报错
  const historyYears = history.map(p => p.year)
  const predYears = data.prediction.map(p => p.year)
  const allYears = [...historyYears, ...predYears]

  // 历史数据（预测年部分补 null）
  const historyValues = [
    ...history.map(p => p.value),
    ...predYears.map(() => null),
  ]

  // 预测数据（历史年部分补 null，最后一年接上）
  const predValues = [
    ...historyYears.slice(0, -1).map(() => null),
    history[history.length - 1].value,  // 衔接点
    ...data.prediction.map(p => p.value),
  ]

  // 置信区间上界/下界
  const upperValues = [
    ...historyYears.slice(0, -1).map(() => null),
    history[history.length - 1].value,
    ...data.prediction.map(p => p.upper),
  ]
  const lowerValues = [
    ...historyYears.slice(0, -1).map(() => null),
    history[history.length - 1].value,
    ...data.prediction.map(p => p.lower),
  ]
  // 堆叠面积：基底=下界，厚度=上界-下界，渲染出上下界之间的置信带
  const bandThickness = upperValues.map((u, i) =>
    u != null && lowerValues[i] != null ? u - lowerValues[i] : null
  )

  // 构建标题
  let title = selectedTable.value
  if (selectedMetric.value) title += ` · ${selectedMetric.value}`
  if (selectedProvince.value) title += ` · ${selectedProvince.value}`

  const boundaryYear = historyYears[historyYears.length - 1]
  const fmt = v => Number.isFinite(v) ? v.toFixed(2) : v

  chartInst.setOption({
    title: {
      text: title + ' 趋势预测',
      left: 0, top: 0,
      textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' },
    },
    tooltip: {
      trigger: 'axis',
      ...darkTooltip,
      formatter: (params) => {
        const year = Number(params[0].axisValue)
        const idx = allYears.indexOf(year)
        const upper = idx >= 0 ? upperValues[idx] : null
        const lower = idx >= 0 ? lowerValues[idx] : null
        let html = `<div style="font-weight:600;margin-bottom:6px;font-size:13px">${params[0].axisValue}年</div>`
        params.forEach(p => {
          if (p.value == null) return
          if (!p.seriesName) return
          if (p.seriesName === '置信区间') {
            if (upper != null && lower != null) {
              html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:12px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                <span style="flex:1">置信区间</span>
                <span style="font-weight:600">[${fmt(lower)}, ${fmt(upper)}]${currentUnit.value ? ' ' + currentUnit.value : ''}</span>
              </div>`
            }
            return
          }
          html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:12px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            <span style="flex:1">${p.seriesName}</span>
            <span style="font-weight:600">${fmt(p.value)}${currentUnit.value ? ' ' + currentUnit.value : ''}</span>
          </div>`
        })
        return html
      },
    },
    legend: {
      bottom: 0,
      itemWidth: 12, itemHeight: 12,
      textStyle: { color: '#475569' },
    },
    // containLabel: true 防止 y 轴数值和单位标签被裁剪
    grid: { containLabel: true, left: 16, right: 24, bottom: 44, top: 44 },
    xAxis: {
      type: 'category',
      data: allYears.map(String),
      axisLine: axisLineStyle,
      axisLabel: axisLabelStyle,
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: currentUnit.value,
      nameTextStyle: { color: '#94a3b8' },
      splitLine: splitLineStyle,
      axisLabel: { ...axisLabelStyle, formatter: fmt },
    },
    series: [
      {
        name: '历史数据',
        type: 'line',
        data: historyValues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
      },
      {
        name: '预测数据',
        type: 'line',
        data: predValues,
        smooth: true,
        symbol: 'emptyCircle',
        symbolSize: 8,
        lineStyle: { width: 2.5, type: 'dashed', color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
      },
      // 置信区间基底（透明，不显示在 legend/tooltip）
      {
        name: '',
        type: 'line',
        data: lowerValues,
        smooth: true,
        stack: 'confidence',
        lineStyle: { opacity: 0 },
        symbol: 'none',
        areaStyle: { color: 'transparent' },
        emphasis: { disabled: true },
        tooltip: { show: false },
      },
      // 置信区间填充带
      {
        name: '置信区间',
        type: 'line',
        data: bandThickness,
        smooth: true,
        stack: 'confidence',
        lineStyle: { opacity: 0 },
        symbol: 'none',
        areaStyle: { color: 'rgba(245,158,11,0.15)' },
        emphasis: { disabled: true },
      },
      // 历史与预测分界竖线
      {
        name: '分界线',
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#94a3b8', type: 'dashed', width: 1.5 },
          data: [{ xAxis: String(boundaryYear) }],
          label: { show: true, formatter: '预测起点', color: '#94a3b8', fontSize: 11 },
        },
        data: [],
      },
    ],
  }, true)
}

// 窗口自适应
function onResize() { chartInst?.resize() }
onMounted(() => {
  loadTables()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInst?.dispose()
})
</script>

<template>
  <div>
    <!-- 异步状态通知区域 -->
    <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>

    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">趋势预测</h1>
      <p class="hero-desc">基于历史数据的时序建模，预测教育指标未来走势</p>
    </header>

    <!-- 参数面板 + 图表 双栏布局 -->
    <div class="pred-layout">
      <!-- 左侧参数面板 -->
      <aside class="pred-panel">
        <div class="pred-field">
          <label class="pred-label">数据表</label>
          <select v-model="selectedTable" class="pred-select">
            <option v-for="t in tableList" :key="t.name" :value="t.name">{{ t.name }}</option>
          </select>
        </div>

        <!-- 全国表：指标选择 -->
        <div v-if="tableType === 'national'" class="pred-field">
          <label class="pred-label">指标</label>
          <select v-model="selectedMetric" class="pred-select">
            <option v-for="m in metricList" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>

        <!-- 分省表：省份选择 -->
        <div v-if="tableType === 'provincial'" class="pred-field">
          <label class="pred-label">省份</label>
          <select v-model="selectedProvince" class="pred-select">
            <option v-for="p in provinceList" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <div class="pred-field">
          <label class="pred-label">预测年数</label>
          <input v-model.number="yearsAhead" type="number" min="1" max="10" class="pred-input" />
        </div>

        <div class="pred-field">
          <label class="pred-label">预测模型</label>
          <select v-model="modelChoice" class="pred-select">
            <option v-for="opt in modelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <button
          class="pred-btn"
          :disabled="loading || !canPredict"
          @click="runPrediction"
        >{{ loading ? '预测中...' : '开始预测' }}</button>

        <!-- 模型信息 -->
        <div v-if="modelInfo" class="pred-info">
          <h3 class="pred-info-title">模型信息</h3>
          <div class="pred-info-row">
            <span>模型</span>
            <span>{{ modelOptions.find(o => o.value === modelInfo.name)?.label || modelInfo.name }}</span>
          </div>
          <div v-if="modelInfo.r_squared != null" class="pred-info-row">
            <span>R²</span>
            <span>{{ modelInfo.r_squared }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧图表 -->
      <section class="pred-chart-area">
        <div ref="chartRef" class="chart pred-chart"></div>
        <div v-if="!predictionResult" class="pred-empty">选择参数后点击「开始预测」查看趋势</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 双栏布局 */
.pred-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  align-items: start;
}

/* 参数面板 */
.pred-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.pred-field {
  margin-bottom: 16px;
}

.pred-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.pred-select,
.pred-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  transition: border-color .15s;
}

.pred-select:focus,
.pred-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}

.pred-btn {
  width: 100%;
  padding: 10px;
  background: #0f172a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color .2s;
}

.pred-btn:hover:not(:disabled) {
  background: #1e293b;
}

.pred-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模型信息 */
.pred-info {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.pred-info-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 10px;
}

.pred-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
  margin-bottom: 6px;
}

.pred-info-row span:last-child {
  font-weight: 500;
  color: #0f172a;
}

/* 图表区域 */
.pred-chart-area {
  position: relative;
}

.pred-chart {
  height: 480px;
}

.pred-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #94a3b8;
  font-size: 14px;
  pointer-events: none;
}

@media (max-width: 960px) {
  .pred-layout {
    grid-template-columns: 1fr;
  }
  .pred-chart { height: 400px; }
}

@media (max-width: 640px) {
  .pred-panel { padding: 16px; }
  .pred-chart { height: 360px; }
}
</style>
