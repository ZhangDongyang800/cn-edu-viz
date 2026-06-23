<script setup>
import { ref, onMounted } from 'vue'

// 后端接口返回的数据
const data = ref([])
// 连接状态信息
const status = ref('正在连接后端...')

// 页面加载时请求后端测试接口
onMounted(async () => {
  try {
    const res = await fetch('/api/test')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = await res.json()
    status.value = '连接成功'
  } catch (e) {
    status.value = '连接失败: ' + e.message
  }
})
</script>

<template>
  <div class="container">
    <h1>中国十年教育数据分析与可视化</h1>
    <p class="status">后端连接状态：<span :class="status === '连接成功' ? 'ok' : 'err'">{{ status }}</span></p>

    <!-- 展示后端返回的测试数据 -->
    <div v-if="data.length" class="card">
      <h3>测试数据（test_conn 表）</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>消息</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.msg }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
  margin: 60px auto;
  font-family: "Microsoft YaHei", sans-serif;
  text-align: center;
}
.status { font-size: 16px; color: #666; }
.ok { color: #67c23a; font-weight: bold; }
.err { color: #f56c6c; font-weight: bold; }
.card {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-align: left;
}
table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th, td { padding: 8px 12px; border-bottom: 1px solid #ebeef5; text-align: left; }
th { background: #f5f7fa; color: #333; }
</style>
