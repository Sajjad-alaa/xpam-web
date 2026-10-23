<template>
  <div class="approval-preview">
    <div v-if="!preview" class="approval-preview-muted">{{ $t('JITPreviewChoose') }}</div>
    <template v-else-if="preview.instant">
      <el-tag type="success" size="small">{{ $t('JITPreviewInstant') }}</el-tag>
      <span class="approval-preview-text">
        {{ $t('JITPreviewInstantHelp', { rules: (preview.rules || []).join(', ') }) }}
      </span>
    </template>
    <template v-else>
      <el-tag type="warning" size="small">{{ $t('JITPreviewApproval') }}</el-tag>
      <div v-if="preview.why" class="approval-preview-text">
        {{ $t('JITPreviewWhy', { why: preview.why }) }}
      </div>
      <div v-for="step of preview.route" :key="step.level" class="approval-preview-step">
        <span class="approval-preview-level">{{ $t('JITFlowLevel', { n: step.level }) }}</span>
        {{ step.approvers.join(', ') || '-' }}
        <span v-if="step.more">{{ $t('JITFlowMore', { n: step.more }) }}</span>
      </div>
    </template>
  </div>
</template>

<script>
// XPAM: before sending an access request — approved at once by a just-in-time rule, or why it waits and who
// approves it, level by level (the same decision the server makes when the request is sent)
export default {
  name: 'ApprovalPreview',
  inheritAttrs: false,
  props: {
    assets: { type: Array, default: () => [] },
    nodes: { type: Array, default: () => [] },
    accounts: { type: Array, default: () => [] },
    protocols: { type: Array, default: null },
    actions: { type: Array, default: null },
    dateStart: { type: String, default: '' },
    dateExpired: { type: String, default: '' },
    reason: { type: String, default: '' },
    flowId: { type: String, default: '' }
  },
  data() {
    return { preview: null, timer: null, seq: 0 }
  },
  computed: {
    request() {
      const req = {
        assets: this.assets || [],
        nodes: this.nodes || [],
        accounts: this.accounts && this.accounts.length ? this.accounts : ['@JIT'],
        date_start: this.dateStart,
        date_expired: this.dateExpired,
        reason: this.reason || '',
        flow_id: this.flowId || ''
      }
      if (this.protocols && this.protocols.length) req.protocols = this.protocols
      // (the actions too: a rule that limits them does not approve "All" by itself)
      if (this.actions && this.actions.length) req.actions = this.actions
      return req
    }
  },
  watch: {
    request: {
      deep: true,
      immediate: true,
      handler() {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.load, 400)
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    async load() {
      const req = this.request
      if (!req.assets.length && !req.nodes.length) {
        this.preview = null
        return
      }
      const seq = ++this.seq
      try {
        const res = await this.$axios.post('/api/v1/accounts/jit-access/preview/', req, {
          disableFlashErrorMsg: true
        })
        if (seq === this.seq) this.preview = res && (res.instant || res.route?.length) ? res : null
      } catch (e) {
        if (seq === this.seq) this.preview = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.approval-preview {
  line-height: 1.8;
  font-size: 13px;
}
.approval-preview-muted {
  color: var(--el-text-color-secondary);
}
.approval-preview-text {
  margin-left: 6px;
  color: var(--el-text-color-regular);
}
div.approval-preview-text {
  margin-left: 0;
  margin-top: 4px;
}
.approval-preview-step {
  color: var(--el-text-color-regular);
}
.approval-preview-level {
  display: inline-block;
  min-width: 60px;
  color: var(--el-text-color-secondary);
}
</style>
