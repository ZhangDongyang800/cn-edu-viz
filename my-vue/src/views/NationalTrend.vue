<script setup>
import { ref, onMounted } from 'vue'
import DataChart from '../components/DataChart.vue'

const items = [
  { key: '在校生数', label: '在校生数' },
  { key: '招生数', label: '招生数' },
  { key: '毕业生数', label: '毕业生数' },
]
const active = ref('在校生数')
const chartData = ref([])
const chartColumns = ref([])

async function load() {
  const res = await fetch(`/api/data/${active.value}`)
  const data = await res.json()
  chartData.value = data
  chartColumns.value = Object.keys(data[0] || {})
}

onMounted(load)
</script>

<template>
  <div>
    <h1 class="page-title">全国趋势</h1>

    <nav class="subnav">
      <button
        v-for="item in items" :key="item.key"
        :class="['subnav-btn', { active: active === item.key }]"
        @click="active = item.key; load()"
      >{{ item.label }}</button>
    </nav>

    <DataChart :data="chartData" :columns="chartColumns" :title="active" />
  </div>
</template>

<style scoped>
.page-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin-bottom: 24px;
}
.subnav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.subnav-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all .15s;
}
.subnav-btn:hover { color: #1a1a1a; background: #f0f0f0; }
.subnav-btn.active { color: #1a1a1a; background: #1a1a1a; color: #fff; }
</style>
