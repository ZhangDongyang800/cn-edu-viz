<script setup>
// 标签导航组件：接收表名列表和当前选中项，点击时触发 select 事件
defineProps({
  tables: { type: Array, required: true },
  active: { type: String, required: true }
})
const emit = defineEmits(['select'])
</script>

<template>
  <nav class="tabs">
    <button
      v-for="t in tables" :key="t"
      :class="['tab', { active: active === t }]"
      @click="emit('select', t)"
    >{{ t }}</button>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin: 16px 0;
}
.tab {
  padding: 6px 16px; border: 1px solid #dcdfe6; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 14px; color: #606266;
  transition: color .2s ease, background-color .2s ease, border-color .2s ease;
}
.tab:hover { color: #409eff; border-color: #c6e2ff; }
.tab.active { background: #409eff; color: #fff; border-color: #409eff; }
/* 键盘焦点可见样式 */
.tab:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}
</style>
