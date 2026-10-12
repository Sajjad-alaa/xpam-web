<template>
  <div>
    <Echart ref="echarts" :options="options" :autoresize="true" />
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import * as echarts from 'echarts'
import { getCssVar, mix } from '@/utils/theme/color'
import Echart from '@/components/Dashboard/Echart.vue'

export default {
  components: { Echart },
  props: {
    datesMetrics: {
      type: Array,
      default: () => []
    },
    primaryName: {
      type: String,
      default: ''
    },
    primaryData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {}
  },
  computed: {
    mixColors() {
      const documentStyle = document.documentElement.style
      const primary = documentStyle.getPropertyValue('--color-primary') || '#38bdf8'
      const colorValue = primary.replace(/#/g, '')
      const TwoLevelColor = mix(colorValue, 'ffffff', 48)
      const ThreeLevelColor = mix(colorValue, 'ffffff', 6)
      return {
        primary,
        TwoLevelColor,
        ThreeLevelColor
      }
    },
    options() {
      const { primary, TwoLevelColor, ThreeLevelColor } = this.mixColors
      const textSecondary = getCssVar('--color-text-secondary', '#8796AD')
      const border = getCssVar('--color-border', '#243044')
      return {
        grid: {
          left: '2%',
          top: '3%',
          right: '2%',
          bottom: '1%',
          containLabel: true
        },
        tooltip: {
          show: true
        },
        xAxis: [
          {
            type: 'category',
            name: '',
            nameLocation: 'center',
            nameGap: 35,
            nameTextStyle: {
              color: textSecondary,
              fontSize: '16'
            },
            axisLabel: {
              color: textSecondary,
              fontSize: '14'
            },
            data: this.datesMetrics,
            axisLine: {
              lineStyle: {
                width: 1,
                color: border
              }
            },
            axisTick: {
              show: false
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '',
            nameLocation: 'middle',
            nameGap: 45,
            nameTextStyle: {
              color: textSecondary,
              fontSize: '16'
            },
            axisLabel: {
              color: textSecondary,
              fontSize: '14'
            },
            axisTick: {
              show: false
            },
            axisLine: {
              show: false
            },
            splitLine: {
              lineStyle: {
                color: border
              }
            }
          }
        ],
        series: [
          {
            type: 'bar',
            name: this.primaryName,
            stack: 1,
            barWidth: '20%',
            borderWidth: 0,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(
                0,
                0,
                0,
                1,
                [
                  {
                    offset: 0,
                    color: TwoLevelColor
                  },
                  {
                    offset: 1,
                    color: ThreeLevelColor
                  }
                ],
                false
              )
            },
            label: {
              show: false
            },
            data: this.primaryData
          },
          {
            type: 'pictorialBar',
            name: this.primaryName,
            symbol: 'rect',
            symbolSize: ['25%', 6],
            symbolOffset: [0, -6],
            z: 12,
            itemStyle: {
              color: primary
            },
            label: {
              show: false,
              position: 'top',
              fontSize: 16
            },
            symbolPosition: 'end',
            data: this.primaryData
          }
        ]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.echarts {
  width: 100%;
  height: 272px;
}
</style>
