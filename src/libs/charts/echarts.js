import {
  BarChart,
  GaugeChart,
  LineChart,
  MapChart,
  PieChart,
  RadarChart,
  ScatterChart
} from 'echarts/charts'
import {
  DatasetComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import VueECharts from 'vue-echarts'
// vue-echarts 7+ 把根元素 x-vue-echarts{width:100%;height:100%} 的样式拆到了单独的 css,
// 必须显式导入,否则图表容器尺寸为 0,报 "[ECharts] Can't get DOM width or height"
import 'vue-echarts/style.css'

/**
 * 初始化并注册 ECharts 扩展
 */
function initECharts() {
  use([
    CanvasRenderer,
    BarChart,
    LineChart,
    PieChart,
    ScatterChart,
    MapChart,
    RadarChart,
    GaugeChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DatasetComponent,
    ToolboxComponent,
    DataZoomComponent,
    VisualMapComponent
  ])
}

initECharts()

// (loaded the first time a chart is shown: ECharts is too large for the console's first load)
export default VueECharts
