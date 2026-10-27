<template>
  <div class="box">
    <div class="header">
      <Title :config="config" />
    </div>

    <div class="chart-content">
      <!-- eslint-disable-next-line -->
      <Echart ref="chartRef" :options="chartOption" :autoresize="true" />
    </div>
  </div>
</template>

<script>
import Title from '@/components/Dashboard/Title.vue'
import * as echarts from 'echarts'
import Echart from '@/components/Dashboard/Echart.vue'
import { getCssVar } from '@/utils/theme/color'
import { applyChartTheme } from '@/utils/theme/chart'
import 'echarts/lib/chart/pie'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/title'
import 'echarts/lib/component/legend'

export default {
  name: 'MissionSummery',
  components: { Title, Echart },
  data() {
    return {
      config: {
        title: this.$t('TaskSummary'),
        tip: this.$t('TaskSummary')
      },
      counter: {
        total_count_change_secret_automation: 0,
        total_count_push_account_automation: 0,
        total_count_gathered_account_automation: 0,
        total_count_backup_account_automation: 0,
        total_count_integration_application: 0
      },
      chart: null
    }
  },
  computed: {
    chartItems() {
      return [
        {
          value: this.counter.total_count_change_secret_automation,
          name: this.$t('BaseAccountChangeSecret')
        },
        {
          value: this.counter.total_count_push_account_automation,
          name: this.$t('BaseAccountPush')
        },
        {
          value: this.counter.total_count_gathered_account_automation,
          name: this.$t('DiscoverAccounts')
        },
        {
          value: this.counter.total_count_backup_account_automation,
          name: this.$t('AccountBackup')
        },
        { value: this.counter.total_count_integration_application, name: this.$t('RelevantApp') }
      ]
    },
    chartOption() {
      const items = this.chartItems
      // When every count is 0, minAngle still gives each item a slice, drawing five fake
      // equal segments. Hide zero-sum sectors and show a neutral placeholder ring instead.
      const hasData = items.some((item) => Number(item.value) > 0)
      const ringLayout = { top: '22%', radius: ['45%', '60%'] }
      return {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `${params.name}: ${params.value} (${params.percent}%)`
          }
        },
        legend: {
          // ECharts 6 moved the default legend to the bottom, where it overlaps the ring
          top: 0,
          icon: 'rect',
          itemWidth: 10,
          itemHeight: 10,
          left: '2%',
          data: items.map((item) => item.name)
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        series: [
          {
            name: this.$t('TaskSummary'),
            type: 'pie',
            minAngle: hasData ? 5 : 0,
            ...ringLayout,
            stillShowZeroSum: false,
            label: {
              show: false
            },
            labelLine: {
              show: false
            },
            data: items,
            emphasis: {
              scaleSize: 5,
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            }
          },
          ...(hasData
            ? []
            : [
                {
                  type: 'pie',
                  ...ringLayout,
                  silent: true,
                  z: 1,
                  tooltip: { show: false },
                  label: { show: false },
                  labelLine: { show: false },
                  itemStyle: { color: getCssVar('--color-border', '#e5e7eb') },
                  data: [{ value: 1, name: '' }]
                }
              ])
        ],
        color: ['#2B937C', '#5470c6', '#91cc75', '#fac858', '#ee6666']
      }
    }
  },
  watch: {
    counter: {
      handler() {
        this.updateChart()
      },
      deep: true
    }
  },
  async mounted() {
    // this.initChart()
    this.counter = await this.getResourcesCount()
    // this.updateChart()
    // window.addEventListener('resize', this.resizeChart)
  },
  beforeUnmount() {
    // if (this.chart) {
    //   this.chart.dispose()
    //   this.chart = null
    // }
    // window.removeEventListener('resize', this.resizeChart)
  },
  methods: {
    async getResourcesCount() {
      return this.$axios.get('/api/v1/accounts/pam-dashboard/', {
        params: {
          total_count_change_secret_automation: 1,
          total_count_gathered_account_automation: 1,
          total_count_push_account_automation: 1,
          total_count_backup_account_automation: 1,
          total_count_integration_application: 1
        }
      })
    },
    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
      this.chart.setOption(applyChartTheme(this.chartOption))
    },
    updateChart() {
      if (this.chart) {
        this.chart.setOption(applyChartTheme(this.chartOption))
      }
    },
    resizeChart() {
      if (this.chart) {
        this.chart.resize()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--page-background-color, #fff);
  border-radius: 4px;

  .header {
    padding: 1.2rem 1.25rem 0;
    margin-bottom: 8px;
  }

  .chart-content {
    flex: 1;
    min-height: 0;
    padding: 0 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(.echarts) {
      height: 14.25rem;
    }
  }
}

:deep(.echarts) {
  .el-legend {
    .el-legend-item {
      &:hover {
        color: var(--color-primary);
      }
    }
  }
}
</style>
