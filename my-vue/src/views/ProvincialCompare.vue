<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'

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
const errorMsg = ref('')       // 错误提示

// 加载中国地图 GeoJSON 并注册
async function loadChinaMap() {
  if (chinaGeoLoaded) return
  try {
    const res = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    const geoJson = await res.json()
    echarts.registerMap('china', geoJson)
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

  // 横向柱状图
  if (!barInst) barInst = echarts.init(barRef.value)
  barInst.setOption({
    title: {
      text: `${active.value} · ${year}（${currentUnit.value}）`,
      left: 0,
      top: 0,
      textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.92)',
      borderColor: 'transparent',
      textStyle: { color: '#fff' },
      confine: true,
      formatter: (params) => {
        const p = params[0]
        return `${p.name}: ${p.value} ${currentUnit.value}`
      }
    },
    grid: { left: 80, right: 24, bottom: 24, top: 44 },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'category',
      data: sorted.map(r => r['地区']).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#334155', fontWeight: 500, fontSize: 11 }
    },
    // 数据条数多时自动调整条宽
    series: [{
      type: 'bar',
      data: sorted.map(r => r[year]).reverse(),
      itemStyle: {
        color: '#0f172a',
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: sorted.length > 20 ? 12 : 16,
      emphasis: {
        itemStyle: { color: '#334155' }
      }
    }]
  }, true)

  // 中国地图
  if (!mapInst) mapInst = echarts.init(mapRef.value)
  const maxVal = Math.max(...sorted.map(d => d[year]))
  mapInst.setOption({
    title: {
      text: '地区分布',
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
      formatter: (params) => params.value != null
        ? `${params.name}: ${params.value} ${currentUnit.value}`
        : `${params.name}: 暂无数据`
    },
    visualMap: {
      min: 0,
      max: maxVal,
      left: 0,
      bottom: 0,
      text: ['高', '低'],
      calculable: true,
      inRange: { color: ['#e2e8f0', '#64748b', '#0f172a'] },
      itemWidth: 12,
      itemHeight: 100,
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
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      data: sorted.map(r => ({ name: r['地区'], value: r[year] }))
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

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  barInst?.dispose()
  mapInst?.dispose()
})
</script>

<template>
  <div>
    <!-- 异步状态通知区域 -->
    <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>
    <!-- 页面标题区 -->
    <header class="hero">
      <h1 class="hero-title">分省对比</h1>
      <p class="hero-desc">横向对比各省份教育指标，识别区域差异与领先梯队</p>
    </header>

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
      <div ref="barRef" class="chart"></div>
      <div ref="mapRef" class="chart"></div>
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

/* 指标子导航 */
.subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.subnav-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: color .2s ease, background-color .2s ease;
  font-weight: 500;
}
.subnav-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}
.subnav-btn.active {
  color: #fff;
  background: #0f172a;
}
/* 键盘焦点可见样式 */
.subnav-btn:focus-visible,
.year-btn:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
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
  transition: color .15s ease, background-color .15s ease, border-color .15s ease;
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

/* 单位标签 */
.unit-tag {
  margin-left: auto;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  align-self: center;
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
  height: 620px;
  padding: 16px;
}

@media (max-width: 960px) {
  .grid-2 { grid-template-columns: 1fr; }
  .chart { height: 520px; }
}
@media (max-width: 640px) {
  .hero-title { font-size: 24px; }
  .subnav-btn { padding: 7px 14px; font-size: 13px; }
  .chart { padding: 10px; border-radius: 8px; height: 460px; }
}
</style>
