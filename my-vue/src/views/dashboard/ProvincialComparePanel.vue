<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onActivated } from 'vue'
import * as echarts from 'echarts'
import {
  darkTooltip, titleStyle, splitLineStyle, axisLabelStyle
} from '../../utils/echarts-config'

const items = [
  { key: '分省在校生数', label: '在校生数', unit: '万人' },
  { key: '分省招生数', label: '招生数', unit: '万人' },
  { key: '分省毕业生数', label: '毕业生数', unit: '万人' },
  { key: '分省学位数', label: '学位数', unit: '万人' },
  { key: '分省学校数', label: '学校数', unit: '所' },
  { key: '教育经费', label: '教育经费', unit: '万元' },
]
const active = ref('分省在校生数')
const barRef = ref(null)
const mapRef = ref(null)
let barInst = null
let mapInst = null
let chinaGeoLoaded = false

// 当前指标的单位
const currentUnit = computed(() => items.find(i => i.key === active.value)?.unit || '')

// 年份选择相关
const yearList = ref([])       // 可选年份列表
const activeYear = ref('')     // 当前选中年份
let rawData = []               // 缓存原始数据
const provinceCount = ref(0)   // 省份数量（响应式，驱动柱状图高度）
const errorMsg = ref('')       // 错误提示

// 柱状图动态高度：根据省份数量计算，避免标签挤压
const barChartHeight = computed(() => {
  // 每个省份至少 22px 高度，最低 480px
  return Math.max(480, provinceCount.value * 22) + 'px'
})

// 加载中国地图 GeoJSON 并注册
async function loadChinaMap() {
  if (chinaGeoLoaded) return
  try {
    const res = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    echarts.registerMap('china', await res.json())
    chinaGeoLoaded = true
  } catch (e) {
    console.error('加载中国地图 GeoJSON 失败:', e)
  }
}

// 渲染图表（数据已就绪时调用）
function renderCharts() {
  const year = activeYear.value
  if (!year) return

  // 过滤全国行，保留所有省份，按数值降序排列
  const sorted = rawData
    .filter(r => r['地区'] !== '全国' && r[year] != null)
    .sort((a, b) => b[year] - a[year])

  const regions = sorted.map(r => r['地区']).reverse()
  const values = sorted.map(r => r[year]).reverse()
  const mapData = sorted.map(r => ({ name: r['地区'], value: r[year] }))

  // 横向柱状图
  if (!barInst) barInst = echarts.init(barRef.value)
  barInst.setOption({
    title: { ...titleStyle, text: `${active.value} · ${year}（${currentUnit.value}）` },
    tooltip: {
      trigger: 'axis',
      ...darkTooltip,
      formatter: p => `${p[0].name}: ${p[0].value} ${currentUnit.value}`
    },
    // containLabel: true 确保省份名标签不被裁剪
    grid: { containLabel: true, left: 8, right: 24, bottom: 8, top: 44 },
    xAxis: {
      type: 'value',
      splitLine: splitLineStyle,
      axisLabel: axisLabelStyle
    },
    yAxis: {
      type: 'category',
      data: regions,
      axisLine: { show: false },
      axisTick: { show: false },
      // 省份名标签：根据数量自适应字号
      axisLabel: {
        color: '#334155', fontWeight: 500,
        fontSize: sorted.length > 25 ? 10 : 11
      }
    },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: '#0f172a', borderRadius: [0, 4, 4, 0] },
      barWidth: sorted.length > 25 ? 10 : 14,
      emphasis: { itemStyle: { color: '#334155' } }
    }]
  }, true)

  // 中国地图
  if (!mapInst) mapInst = echarts.init(mapRef.value)
  mapInst.setOption({
    title: { ...titleStyle, text: '地区分布' },
    tooltip: {
      trigger: 'item',
      ...darkTooltip,
      formatter: p => p.value != null
        ? `${p.name}: ${p.value} ${currentUnit.value}`
        : `${p.name}: 暂无数据`
    },
    visualMap: {
      min: 0,
      max: sorted.length > 0 ? Math.max(...sorted.map(d => d[year])) : 1,
      left: 8, bottom: 8,
      text: ['高', '低'], calculable: true,
      inRange: { color: ['#e2e8f0', '#64748b', '#0f172a'] },
      itemWidth: 12, itemHeight: 100,
      textStyle: { color: '#64748b' }
    },
    series: [{
      type: 'map',
      map: 'china',
      roam: false,
      emphasis: {
        label: { show: true, color: '#fff' },
        itemStyle: { areaColor: '#334155' }
      },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: mapData
    }]
  }, true)
}

// 加载数据
async function load() {
  try {
    errorMsg.value = ''
    const res = await fetch(`/api/data/${active.value}`)
    rawData = await res.json()
    // 提取所有年份列
    const yearCols = Object.keys(rawData[0] || {}).filter(c => /\d{4}年/.test(c))
    yearList.value = yearCols
    // 更新省份数量（驱动柱状图动态高度）
    provinceCount.value = rawData.filter(r => r['地区'] !== '全国').length
    // 默认选最新年份
    if (!activeYear.value || !yearCols.includes(activeYear.value)) {
      activeYear.value = yearCols[yearCols.length - 1]
    }
    renderCharts()
  } catch (e) {
    console.error(e)
    errorMsg.value = '数据加载失败，请稍后重试'
  }
}

// 切换指标时重置年份并重新加载
function switchItem(key) {
  active.value = key
  activeYear.value = ''
  load()
}

// 窗口自适应处理函数
function onResize() { barInst?.resize(); mapInst?.resize() }

onMounted(async () => {
  await loadChinaMap()
  load()
  window.addEventListener('resize', onResize)
})

// keep-alive 激活时 resize 图表（容器尺寸可能已变化）
onActivated(() => {
  onResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  barInst?.dispose()
  mapInst?.dispose()
})
</script>

<template>
  <div>
    <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>

    <!-- 指标切换 -->
    <nav class="subnav">
      <button
        v-for="item in items"
        :key="item.key"
        :class="['subnav-btn', { active: active === item.key }]"
        @click="switchItem(item.key)"
      >{{ item.label }}</button>
    </nav>

    <!-- 年份选择 -->
    <nav class="year-nav">
      <button
        v-for="y in yearList"
        :key="y"
        :class="['year-btn', { active: activeYear === y }]"
        @click="activeYear = y; renderCharts()"
      >{{ y.replace('年', '') }}</button>
      <span v-if="currentUnit" class="unit-tag">单位：{{ currentUnit }}</span>
    </nav>

    <!-- 双栏图表 -->
    <div class="grid-2">
      <!-- 柱状图：动态高度适配省份数量 -->
      <div ref="barRef" class="chart" :style="{ height: barChartHeight }"></div>
      <div ref="mapRef" class="chart chart-map"></div>
    </div>
  </div>
</template>

<style scoped>
.chart-map { height: 560px; }

@media (max-width: 960px) {
  .chart-map { height: 480px; }
}
@media (max-width: 640px) {
  .chart-map { height: 420px; }
}
</style>
