/**
 * ECharts 公共配置模块
 * 统一管理所有图表的 tooltip、legend、调色板、grid 等配置
 * 避免在各组件中重复定义，确保视觉风格一致
 */

// 深色 tooltip 样式（所有图表通用）
export const darkTooltip = {
  backgroundColor: 'rgba(15,23,42,0.92)',
  borderColor: 'transparent',
  textStyle: { color: '#fff' },
  confine: true,        // 限制 tooltip 在图表容器内，防止溢出
}

// 可滚动 legend（系列较多时使用）
export const scrollLegend = {
  type: 'scroll',
  bottom: 0, left: 0, right: 0,
  itemWidth: 10, itemHeight: 10,
  textStyle: { color: '#475569', fontSize: 11 },
  pageIconColor: '#64748b',
  pageTextStyle: { color: '#64748b' },
}

// 灰度调色板（结构分析等需要区分多系列的场景）
export const grayPalette = [
  '#0f172a', '#1e293b', '#334155', '#475569',
  '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0',
]

// 主调色板（折线图、柱状图等）
export const mainPalette = [
  '#0f172a', '#334155', '#475569', '#64748b',
  '#94a3b8', '#cbd5e1', '#2563eb', '#7c3aed',
]

/**
 * 基础 grid 配置
 * containLabel: true 是关键 —— 自动将轴标签纳入 grid 计算范围
 * 防止长标签被裁剪或与其他元素重叠
 */
export const baseGrid = {
  containLabel: true,   // 标签包含在 grid 内，防止遮挡
  left: 16, right: 16, top: 44, bottom: 16,
}

// 公共标题样式
export const titleStyle = {
  left: 0, top: 0,
  textStyle: { fontSize: 15, fontWeight: 600, color: '#0f172a' },
}

// 公共坐标轴样式
export const axisLineStyle = { lineStyle: { color: '#e2e8f0' } }
export const splitLineStyle = { lineStyle: { color: '#f1f5f9' } }
export const axisLabelStyle = { color: '#64748b' }

/**
 * tooltip formatter：过滤 0/null，按数值降序，取 Top 8
 * @param {Array} params - ECharts tooltip params
 * @param {string} unit - 可选的单位后缀
 * @returns {string} HTML 字符串
 */
export function buildTooltipHtml(params, unit = '') {
  let filtered = params.filter(p => p.value !== 0 && p.value != null)
  filtered.sort((a, b) => b.value - a.value)
  if (!filtered.length) return params[0]?.axisValue || ''

  const SHOW_TOP = 8
  const total = filtered.reduce((s, p) => s + p.value, 0)
  const topItems = filtered.slice(0, SHOW_TOP)
  const restCount = filtered.length - SHOW_TOP
  const suffix = unit ? ` ${unit}` : ''

  // 格式化数值：统一保留两位小数，避免后端浮点原始值显示一长串
  const fmt = v => Number.isFinite(v) ? v.toFixed(2) : v

  let html = `<div style="font-weight:600;margin-bottom:6px;font-size:13px">${filtered[0].axisValue}${unit ? '年' : ''}</div>`
  topItems.forEach(p => {
    html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;font-size:12px">
      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
      <span style="flex:1;white-space:nowrap">${p.seriesName}</span>
      <span style="font-weight:600;margin-left:12px">${fmt(p.value)}${suffix}</span>
    </div>`
  })
  if (restCount > 0) {
    html += `<div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#94a3b8">还有 ${restCount} 项，合计 ${fmt(total)}${suffix}</div>`
  }
  return html
}
