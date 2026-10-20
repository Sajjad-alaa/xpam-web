<template>
  <el-dialog
    :model-value="visible"
    :title="$t('AssetAttention')"
    width="720px"
    append-to-body
    destroy-on-close
    @update:model-value="(v) => !v && close()"
  >
    <div v-loading="loading" class="attention">
      <el-alert
        v-if="data && !data.groups.length"
        type="success"
        :closable="false"
        show-icon
        :title="$t('AssetAttentionNone', { n: data.total })"
      />
      <div v-for="g of data?.groups || []" :key="g.key" class="attention-group">
        <div class="attention-title">
          <el-tag
            :type="g.key === 'unreachable' || g.key === 'account_failed' ? 'danger' : 'warning'"
          >
            {{ g.count }}
          </el-tag>
          <b>{{ g.title }}</b>
        </div>
        <div class="attention-fix">{{ g.fix }}</div>
        <div class="attention-assets">
          <el-link
            v-for="a of g.assets"
            :key="a.id"
            type="primary"
            underline="never"
            @click="open(a)"
          >
            {{ a.name }}
          </el-link>
          <span v-if="g.count > g.assets.length" class="attention-more">
            {{ $t('AssetAttentionMore', { n: g.count - g.assets.length }) }}
          </span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="load">{{ $t('Refresh') }}</el-button>
      <el-button type="primary" @click="close">{{ $t('Close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'AssetAttentionDialog',
  props: { visible: { type: Boolean, default: false } },
  emits: ['update:visible'],
  data() {
    return { loading: false, data: null }
  },
  watch: {
    visible(v) {
      if (v) this.load()
    }
  },
  methods: {
    load() {
      this.loading = true
      this.$axios
        .get('/api/v1/assets/tools/attention/')
        .then((data) => {
          this.data = data
        })
        .finally(() => {
          this.loading = false
        })
    },
    open(asset) {
      this.close()
      this.$router.push({ name: 'AssetDetail', params: { id: asset.id } })
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.attention {
  min-height: 120px;
}

.attention-group {
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.attention-group:last-child {
  border-bottom: none;
}

.attention-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attention-fix {
  margin: 6px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.attention-assets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.attention-more {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
