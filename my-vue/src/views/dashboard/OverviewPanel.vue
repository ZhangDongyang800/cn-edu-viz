<script setup>
import { ref, onMounted } from 'vue'

// 数据库展示相关状态
const dbTables = ref([])
const activeTable = ref('')
const tableData = ref([])
const tableColumns = ref([])
const dbError = ref('')
const dbLoading = ref(false)

onMounted(() => {
  loadDbTables()
})

// 加载数据库表列表（排除 users 和 prediction_history 等业务表）
async function loadDbTables() {
  try {
    dbError.value = ''
    const res = await fetch('/api/db/tables')
    const allTables = await res.json()
    // 仅保留教育数据表，排除 users 和 prediction_history 等业务表
    dbTables.value = allTables.filter(t => !['users', 'prediction_history'].includes(t.name))
    // 默认选中第一张表
    if (dbTables.value.length > 0) {
      activeTable.value = dbTables.value[0].name
      loadTableData(dbTables.value[0].name)
    }
  } catch (e) {
    console.error(e)
    dbError.value = '数据库表列表加载失败'
  }
}

// 加载指定表的数据
async function loadTableData(tableName) {
  if (!tableName) return
  try {
    dbError.value = ''
    dbLoading.value = true
    const res = await fetch(`/api/data/${tableName}`)
    const data = await res.json()
    tableData.value = data
    tableColumns.value = data.length > 0 ? Object.keys(data[0]) : []
    activeTable.value = tableName
  } catch (e) {
    console.error(e)
    dbError.value = `表 ${tableName} 数据加载失败`
  } finally {
    dbLoading.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="dbError" class="error-msg" role="alert">{{ dbError }}</div>

    <!-- 数据库内容展示 -->
    <section class="db-section">
      <div class="section-header">
        <h2 class="section-title">数据库实时预览</h2>
        <span class="section-badge">MySQL / cn_edu_viz</span>
      </div>

      <!-- 表名列表 -->
      <nav class="table-nav">
        <button
          v-for="t in dbTables"
          :key="t.name"
          :class="['table-btn', { active: activeTable === t.name }]"
          @click="loadTableData(t.name)"
          :title="t.comment || t.name"
        >
          {{ t.name }}
        </button>
      </nav>

      <!-- 数据表格 -->
      <div class="table-wrap">
        <div v-if="dbLoading" class="loading">加载中…</div>
        <template v-else-if="tableData.length">
          <div class="table-info">表 <strong>{{ activeTable }}</strong>（共 {{ tableData.length }} 行）</div>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th v-for="col in tableColumns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in tableData" :key="i">
                  <td v-for="col in tableColumns" :key="col">{{ row[col] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="loading">暂无数据</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 数据库展示区块 */
.db-section { margin-top: 8px; }
.section-header {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 16px;
}
.section-title { font-size: 18px; font-weight: 600; color: #0f172a; }
.section-badge { font-size: 12px; color: #94a3b8; font-weight: 500; letter-spacing: 0.5px; }

/* 表名导航 */
.table-nav {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-bottom: 16px;
}
.table-btn {
  padding: 5px 12px; border: 1px solid #e2e8f0; background: #fff;
  color: #475569; font-size: 13px; cursor: pointer; border-radius: 6px;
  transition: all .15s ease; font-weight: 500;
}
.table-btn:hover { border-color: #94a3b8; color: #0f172a; }
.table-btn.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.table-btn:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }

/* 表格容器 */
.table-wrap {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 16px;
}
.table-info {
  font-size: 13px; color: #64748b;
  margin-bottom: 12px;
}
.table-scroll {
  overflow-x: auto;
}
.table-scroll table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.table-scroll th, .table-scroll td {
  padding: 8px 12px; border-bottom: 1px solid #ebeef5;
  text-align: left; white-space: nowrap;
}
.table-scroll th {
  background: #f5f7fa; color: #333; font-weight: 600;
  position: sticky; top: 0;
}
.table-scroll tbody tr:hover { background: #f5f7fa; }
.loading { text-align: center; padding: 40px; color: #999; }
</style>
