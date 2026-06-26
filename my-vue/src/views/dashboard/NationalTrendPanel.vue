<script setup>
import { ref, onMounted } from 'vue'
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

async function load() {
  try {
    errorMsg.value = ''
    const res = await fetch(`/api/data/${active.value}`)
    const data = await res.json()
    chartData.value = data
    chartColumns.value = Object.keys(data[0] || {})
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

    <!-- 图表区 -->
    <section class="chart-wrap">
      <DataChart :data="chartData" :columns="chartColumns" :title="active" />
    </section>
  </div>
</template>

<style scoped>
/* 该面板无特有样式，全部使用全局公共样式 */
</style>
