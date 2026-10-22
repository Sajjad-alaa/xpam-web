<template>
  <div class="jit-flow-select">
    <el-select
      :model-value="selected"
      :placeholder="defaultLabel"
      clearable
      style="width: 100%"
      @update:model-value="onChange"
    >
      <el-option v-for="flow of flows" :key="flow.id" :label="label(flow)" :value="flow.id" />
    </el-select>
    <div v-if="shown" class="jit-flow-route">
      <div v-for="step of shown.route" :key="step.level">
        <span class="jit-flow-level">{{ $t('JITFlowLevel', { n: step.level }) }}</span>
        {{ step.approvers.join(', ') || '-' }}
        <span v-if="step.more">{{ $t('JITFlowMore', { n: step.more }) }}</span>
      </div>
      <div v-if="!shown.route.length">{{ $t('JITFlowNoLevels') }}</div>
    </div>
    <div v-else-if="loaded && !flows.length" class="jit-flow-route">{{ $t('JITFlowNone') }}</div>
    <el-link
      v-if="$hasPerm('tickets.view_ticketflow')"
      type="primary"
      underline="never"
      @click="$router.push({ name: 'TicketFlow' })"
    >
      {{ $t('JITFlowEdit') }}
    </el-link>
  </div>
</template>

<script>
// XPAM: the approval flow of a just-in-time rule — the flows for access requests (Tickets → Flow setup), with who
// approves at each level; empty: the organization's flow (the first one)
export default {
  name: 'JITApprovalFlowSelect',
  inheritAttrs: false,
  emits: ['input', 'update:modelValue'],
  props: {
    value: {
      type: [Object, String],
      default: null
    }
  },
  data() {
    return { flows: [], loaded: false }
  },
  computed: {
    selected() {
      const v = this.value
      return (v && typeof v === 'object' ? v.id : v) || ''
    },
    defaultFlow() {
      return this.flows.find((f) => f.default)
    },
    defaultLabel() {
      return this.defaultFlow
        ? this.$t('JITFlowDefault', { name: this.defaultFlow.name })
        : this.$t('JITFlowNone')
    },
    shown() {
      return this.flows.find((f) => f.id === this.selected) || this.defaultFlow
    }
  },
  async mounted() {
    try {
      this.flows = await this.$axios.get('/api/v1/accounts/jit-policies/approval-flows/')
    } catch (e) {
      this.flows = []
    }
    this.loaded = true
  },
  methods: {
    label(flow) {
      return flow.default ? `${flow.name} (${this.$t('JITFlowDefaultTag')})` : flow.name
    },
    onChange(id) {
      const payload = id || null
      this.$emit('input', payload)
      this.$emit('update:modelValue', payload)
    }
  }
}
</script>

<style lang="scss" scoped>
.jit-flow-select {
  width: 100%;
}
.jit-flow-route {
  margin-top: 6px;
  padding: 6px 10px;
  line-height: 1.7;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 4px;
}
.jit-flow-level {
  display: inline-block;
  min-width: 60px;
  color: var(--el-text-color-secondary);
}
</style>
