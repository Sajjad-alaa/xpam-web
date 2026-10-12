<template>
  <div class="box">
    <div class="head">
      <Title :config="config" />
      <SwitchDate @change="onChange" />
    </div>
    <el-table :data="tableData" class="table" style="width: 100%">
      <el-table-column :label="$tc('Ranking')" width="100">
        <template #header>
          <el-tooltip :content="$t('Ranking')" placement="top" :show-after="500">
            <span style="cursor: pointer">{{ $t('Ranking') }}</span>
          </el-tooltip>
        </template>
        <template #default="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>

      <el-table-column
        v-for="i in config.columns"
        :key="i.prop"
        :prop="i.prop"
        :width="getColumnWidth(i)"
      >
        <template #header>
          <el-tooltip :content="i.label" placement="top" :show-after="500">
            <span style="cursor: pointer">{{ i.label }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import Title from './Title.vue'
import SwitchDate from './SwitchDate.vue'
import { scopedLocalStorage as localStorage } from '@/utils/storage'

export default {
  components: {
    Title,
    SwitchDate
  },
  props: {
    config: {
      type: Object,
      default: () => {}
    },
    url: {
      type: String,
      default: ''
    }
  },
  data() {
    const days = localStorage.getItem('dashboardDays') || '7'
    return {
      tableData: [],
      tableUrl: this.config.url + `&days=${days}`
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getColumnWidth(column) {
      if (column.prop === 'total') {
        const locale = this.$i18n.locale
        switch (locale) {
          case 'en':
            return '120px'
          case 'pt-br':
            return '220px'
          default:
            return '100px'
        }
      }
    },
    getList() {
      this.$axios.get(this.tableUrl).then((res) => {
        this.tableData = this.config.data ? res?.[this.config.data] : res
      })
    },
    onChange(val) {
      this.tableUrl = this.config.url + `&days=${val}`
      this.getList()
      localStorage.setItem('dashboardDays', val)
    }
  }
}
</script>

<style lang="scss" scoped>
.box {
  margin-top: 16px;
  padding: 20px;
  background: var(--page-background-color, #ffffff);
  border-radius: var(--jms-card-radius, 8px);

  .head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
}

:deep(.el-table) {
  background-color: transparent !important;
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: var(--el-fill-color-light, rgba(255, 255, 255, 0.04)) !important;
  --el-table-border-color: var(--panel-border-color, #243044) !important;
  --el-table-text-color: var(--color-text-primary, #f8fafc) !important;
}

:deep(.el-table td),
:deep(.el-table th) {
  padding: 5px 0;
}

:deep(.el-table th.el-table__cell) {
  background-color: var(--el-fill-color-light, rgba(255, 255, 255, 0.04)) !important;
  color: var(--color-text-secondary, #94a3b8) !important;
  border-bottom: 1px solid var(--panel-border-color, #243044) !important;
}

:deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  color: var(--color-text-primary, #f8fafc) !important;
  border-bottom: 1px solid var(--panel-border-color, #243044) !important;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table__empty-block) {
  background-color: transparent !important;
}

:deep(.el-table__empty-text) {
  color: var(--color-text-secondary, #94a3b8) !important;
}

:deep(.el-table .cell) {
  white-space: nowrap;
}
</style>
