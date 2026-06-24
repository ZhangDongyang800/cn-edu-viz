<script setup>
// 数据表格组件：接收列名和行数据
defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
</script>

<template>
  <div class="table-wrap">
    <div v-if="loading" class="loading">加载中...</div>
    <table v-else-if="data.length">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in data" :key="i">
          <td v-for="col in columns" :key="col">{{ row[col] }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="loading">暂无数据</div>
  </div>
</template>

<style scoped>
.table-wrap {
  background: #fff; border-radius: 8px; padding: 16px;
  overflow-x: auto;
}
.table-wrap table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table-wrap th, .table-wrap td {
  padding: 8px 12px; border-bottom: 1px solid #ebeef5; text-align: left; white-space: nowrap;
}
.table-wrap th { background: #f5f7fa; color: #333; font-weight: 600; }
.table-wrap tbody tr:hover { background: #f5f7fa; }
.loading { text-align: center; padding: 40px; color: #999; }
</style>
