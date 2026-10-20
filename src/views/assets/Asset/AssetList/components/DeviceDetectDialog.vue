<template>
  <el-dialog
    :model-value="visible"
    :title="$t('DeviceDetectPlatform')"
    width="680px"
    append-to-body
    destroy-on-close
    @update:model-value="(v) => !v && close()"
  >
    <div v-loading="loading" :element-loading-text="$t('DeviceDetecting')" class="detect">
      <el-table v-if="results" :data="results" border>
        <el-table-column :label="$t('Name')" prop="name" min-width="140" />
        <el-table-column :label="$t('Platform')" min-width="200">
          <template #default="{ row }">
            <span v-if="row.changed">
              {{ row.before }} → <b>{{ row.after }}</b>
            </span>
            <span v-else-if="row.after">{{ row.after }} ✓</span>
            <span v-else>{{ row.before }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('Result')" min-width="240">
          <template #default="{ row }">
            <span v-if="row.error" class="detect-error">{{ row.error }}</span>
            <span v-else>{{
              row.changed ? $t('DeviceDetectChanged') : $t('DeviceDetectSame')
            }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button type="primary" @click="close">{{ $t('Close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'DeviceDetectDialog',
  props: {
    visible: { type: Boolean, default: false },
    assets: { type: Array, default: () => [] }
  },
  emits: ['update:visible', 'done'],
  data() {
    return { loading: false, results: null }
  },
  watch: {
    visible(v) {
      if (v) this.run()
    }
  },
  methods: {
    run() {
      this.results = null
      this.loading = true
      this.$axios
        .post('/api/v1/assets/tools/detect-platform/', { assets: this.assets })
        .then((data) => {
          this.results = data
          if (data.some((r) => r.changed)) this.$emit('done')
        })
        .finally(() => {
          this.loading = false
        })
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.detect {
  min-height: 120px;
}

.detect-error {
  color: var(--el-color-danger);
}
</style>
