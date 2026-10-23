<template>
  <div class="approval-preview">
    <div v-if="!preview" class="approval-preview-muted">{{ $t('JITPreviewChoose') }}</div>
    <template v-else-if="preview.instant">
      <div class="approval-preview-badges">
        <el-tag type="success" size="small">{{ $t('JITPreviewInstant') }}</el-tag>
        <el-tag v-if="preview.auto_approve_hours" type="success" effect="plain" size="small">
          Instant up to {{ preview.auto_approve_hours }} h
        </el-tag>
        <span class="approval-preview-text">
          {{ $t('JITPreviewInstantHelp', { rules: (preview.rules || []).join(', ') }) }}
        </span>
      </div>
      <div v-if="durationOptions.length > 1" class="approval-preview-presets">
        <span class="approval-preview-muted">Quick duration:</span>
        <el-button
          v-for="h of durationOptions"
          :key="h"
          size="small"
          :type="Math.abs(currentHours - h) < 0.1 ? 'primary' : 'default'"
          plain
          @click="applyDuration(h)"
        >
          {{ h }} h
        </el-button>
      </div>
    </template>
    <template v-else>
      <div class="approval-preview-badges">
        <el-tag type="warning" size="small">{{ $t('JITPreviewApproval') }}</el-tag>
        <el-tag
          v-if="preview.policies && preview.policies.length"
          type="primary"
          effect="plain"
          size="small"
        >
          JIT Rule: {{ preview.policies.join(', ') }}
        </el-tag>
        <el-tag v-if="preview.flow" type="info" effect="plain" size="small">
          Flow: {{ preview.flow }}
        </el-tag>
        <el-button
          v-if="preview.auto_approve_hours > 0"
          type="success"
          size="small"
          plain
          @click="applyDuration(preview.auto_approve_hours)"
        >
          Use Instant Approval ({{ preview.auto_approve_hours }} h)
        </el-button>
      </div>
      <div v-if="preview.why" class="approval-preview-text">
        {{ $t('JITPreviewWhy', { why: preview.why }) }}
      </div>
      <div v-if="durationOptions.length > 1" class="approval-preview-presets">
        <span class="approval-preview-muted">Quick duration:</span>
        <el-button
          v-for="h of durationOptions"
          :key="h"
          size="small"
          :type="Math.abs(currentHours - h) < 0.1 ? 'primary' : 'default'"
          plain
          @click="applyDuration(h)"
        >
          {{ h }} h
        </el-button>
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
import { FORM_RENDERER_KEY } from '@/components/Form/DataForm/components/el-form-renderer/el-form-renderer.vue'

// XPAM: before sending an access request — approved at once by a just-in-time rule, or why it waits and who
// approves it, level by level (the same decision the server makes when the request is sent)
export default {
  name: 'ApprovalPreview',
  inheritAttrs: false,
  inject: {
    formRenderer: {
      from: FORM_RENDERER_KEY,
      default: null
    }
  },
  props: {
    assets: { type: Array, default: () => [] },
    nodes: { type: Array, default: () => [] },
    accounts: { type: Array, default: () => [] },
    protocols: { type: Array, default: null },
    actions: { type: Array, default: null },
    dateStart: { type: String, default: '' },
    dateExpired: { type: String, default: '' },
    reason: { type: String, default: '' },
    flowId: { type: String, default: '' },
    onPreview: { type: Function, default: null }
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
    },
    currentHours() {
      const startMs = new Date(this.dateStart || Date.now()).getTime()
      const endMs = new Date(this.dateExpired || Date.now()).getTime()
      return Math.max(0, (endMs - startMs) / 3600000)
    },
    durationOptions() {
      if (!this.preview || !this.preview.covered) return []
      const maxH = this.preview.max_hours || this.preview.auto_approve_hours || 8
      const base = [1, 2, 4, 8, 12, 24].filter((h) => h <= maxH)
      if (this.preview.auto_approve_hours && !base.includes(this.preview.auto_approve_hours)) {
        base.push(this.preview.auto_approve_hours)
      }
      if (maxH && !base.includes(maxH) && maxH <= 72) {
        base.push(maxH)
      }
      return base.sort((a, b) => a - b)
    }
  },
  watch: {
    request: {
      deep: true,
      immediate: true,
      handler() {
        clearTimeout(this.timer)
        this.timer = setTimeout(this.load, 120)
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    applyDuration(hours) {
      if (!hours || hours <= 0) return
      const now = new Date()
      const end = new Date(now.getTime() + hours * 3600 * 1000)
      if (this.formRenderer?.updateForm) {
        this.formRenderer.updateForm({
          apply_date_start: now.toISOString(),
          apply_date_expired: end.toISOString()
        })
      }
    },
    async load() {
      const req = this.request
      if (!req.assets.length && !req.nodes.length) {
        this.preview = null
        if (this.onPreview) this.onPreview(null, this.formRenderer?.updateForm)
        return
      }
      const seq = ++this.seq
      try {
        const res = await this.$axios.post('/api/v1/accounts/jit-access/preview/', req, {
          disableFlashErrorMsg: true
        })
        if (seq === this.seq) {
          this.preview = res && (res.instant || res.route?.length || res.covered) ? res : null
          if (this.onPreview) this.onPreview(this.preview, this.formRenderer?.updateForm)
        }
      } catch (e) {
        if (seq === this.seq) {
          this.preview = null
          if (this.onPreview) this.onPreview(null, this.formRenderer?.updateForm)
        }
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
.approval-preview-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.approval-preview-presets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
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
