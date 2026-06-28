<script setup>
import { ref, computed, onMounted } from 'vue'
import DataChart from '../../components/DataChart.vue'

const items = [
  { key: '在校生数', label: '在校生数' },
  { key: '招生数', label: '招生数' },
  { key: '毕业生数', label: '毕业生数' },
]
const active = ref('在校生数')
const chartData = ref([])
const chartColumns = ref([])
const errorMsg = ref('')

// 排行榜相关状态
const TOP_N = 13                              // 默认显示的系列数量
const toggledNames = ref([])                  // 被用户点击切换过显隐的系列名集合
const allNames = ref([])                      // 所有指标名

// 从 columns 中提取年份列并按升序排列（2011年 → 2025年）
const yearCols = computed(() => {
  return chartColumns.value
    .filter(c => /\d{4}年/.test(c))
    .sort((a, b) => parseInt(a) - parseInt(b))
})

// 排行榜数据：按每个指标所有有效年份的平均值降序排列
const rankingList = computed(() => {
  if (!chartData.value.length || !yearCols.value.length) return []
  return chartData.value
    .map(row => {
      const name = row['指标']
      let sum = 0
      let count = 0
      // 遍历所有年份，累加有效值（非空且非 0）
      for (const col of yearCols.value) {
        const v = row[col]
        if (v != null && v !== 0) {
          sum += v
          count++
        }
      }
      return { name, value: count > 0 ? sum / count : 0 }
    })
    .filter(item => item.name)
    .sort((a, b) => b.value - a.value)
})

// 传给 DataChart 的隐藏列表
// 默认：Top N 可见，其余隐藏；用户点击过的则反转默认状态
const hiddenSeries = computed(() => {
  const topNames = rankingList.value.slice(0, TOP_N).map(r => r.name)
  return allNames.value.filter(name => {
    const isDefaultVisible = topNames.includes(name)
    const isToggled = toggledNames.value.includes(name)
    // 被点击过 → 反转默认显隐；未被点击 → 保持默认
    if (isToggled) return isDefaultVisible   // 原本可见→隐藏，原本隐藏→可见
    return !isDefaultVisible                  // 默认：Top N 可见，其余隐藏
  })
})

// 切换某系列的显示/隐藏（点击即反转当前状态）
function toggleSeries(name) {
  if (toggledNames.value.includes(name)) {
    toggledNames.value = toggledNames.value.filter(n => n !== name)
  } else {
    toggledNames.value = [...toggledNames.value, name]
  }
}

// 判断某系列是否处于显示状态
function isSeriesVisible(name) {
  return !hiddenSeries.value.includes(name)
}

async function load() {
  try {
    errorMsg.value = ''
    const res = await fetch(`/api/data/${active.value}`)
    const data = await res.json()
    chartData.value = data
    chartColumns.value = Object.keys(data[0] || {})

    // 初始化所有指标名列表
    allNames.value = data.map(row => row['指标']).filter(Boolean)

    // 重置切换状态
    toggledNames.value = []
  } catch (e) {
    console.error(e)
    errorMsg.value = '数据加载失败，请稍后重试'
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</div>

    <!-- 子导航 -->
    <nav class="subnav">
      <button
        v-for="item in items"
        :key="item.key"
        :class="['subnav-btn', { active: active === item.key }]"
        @click="active = item.key; load()"
      >{{ item.label }}</button>
    </nav>

    <!-- 图表 + 排行榜双栏布局 -->
    <div class="trend-layout">
      <!-- 左侧：折线图 -->
      <section class="chart-wrap trend-chart">
        <DataChart :data="chartData" :columns="chartColumns" :title="active"
          :hidden-series="hiddenSeries" />
      </section>

      <!-- 右侧：Top 排行榜 -->
      <aside class="ranking-panel">
        <h3 class="ranking-title">指标排行</h3>
        <p class="ranking-hint">默认显示前 {{ TOP_N }} 项，点击切换显隐</p>
        <ul class="ranking-list">
          <li
            v-for="(item, idx) in rankingList"
            :key="item.name"
            :class="['ranking-item', { dimmed: !isSeriesVisible(item.name) }]"
            @click="toggleSeries(item.name)"
          >
            <span class="ranking-rank">{{ idx + 1 }}</span>
            <span class="ranking-name" :title="item.name">{{ item.name }}</span>
            <span class="ranking-value">{{ Number.isFinite(item.value) ? item.value.toFixed(2) : item.value }}</span>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* 双栏布局：图表 + 排行榜 */
.trend-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.trend-chart {
  flex: 1;
  min-width: 0;
}

/* 排行榜面板 */
.ranking-panel {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.ranking-title {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.ranking-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.ranking-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 500px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color .15s ease;
}

.ranking-item:hover {
  background: #f1f5f9;
}

/* 被隐藏的系列变灰 */
.ranking-item.dimmed {
  opacity: 0.4;
}

.ranking-item.dimmed .ranking-name {
  text-decoration: line-through;
}

.ranking-rank {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #0f172a;
  border-radius: 50%;
}

/* 前 3 名用不同颜色突出 */
.ranking-item:nth-child(1) .ranking-rank { background: #f59e0b; }
.ranking-item:nth-child(2) .ranking-rank { background: #64748b; }
.ranking-item:nth-child(3) .ranking-rank { background: #b45309; }

.ranking-name {
  flex: 1;
  font-size: 12px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-value {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

/* 响应式：窄屏改为单栏，排行榜移到下方 */
@media (max-width: 960px) {
  .trend-layout {
    flex-direction: column;
  }
  .ranking-panel {
    width: 100%;
  }
}
</style>
