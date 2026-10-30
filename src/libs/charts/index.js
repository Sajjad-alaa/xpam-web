import { defineAsyncComponent } from 'vue'

// XPAM: ECharts and vue-echarts load the first time a chart is shown (./echarts.js), not with the console's first
// page: they were most of its startup code. The components keep their global names.
const AsyncECharts = defineAsyncComponent(() => import('./echarts'))

/**
 * Charts 插件
 * 统一封装 ECharts 相关的所有设置
 */
const ChartsPlugin = {
  install(app) {
    app.component('Echarts', AsyncECharts)
    app.component('Echart', AsyncECharts)
  }
}

// 导出插件，供 app.use() 使用
export default ChartsPlugin
